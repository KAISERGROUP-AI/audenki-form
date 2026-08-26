import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { APPLICATION_STATUSES } from "@/lib/statusConfig";

interface RouteParams {
  params: { token: string };
}

function getMonthRange(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function previousYearMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const d = new Date(Date.UTC(year, month - 2, 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function countByStatus(applications: { status: string }[]) {
  const counts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) counts[s] = 0;
  for (const app of applications) {
    if (counts[app.status] !== undefined) counts[app.status] += 1;
  }
  return counts;
}

// ※このAPIはログイン不要です。トークン（推測困難なランダム文字列）を知っている人だけが、
// その会社の案件一覧・件数を閲覧できます（編集は一切できません）。

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = params;
  if (!token) {
    return NextResponse.json({ success: false, error: "無効なリンクです。" }, { status: 400 });
  }

  const yearMonth = request.nextUrl.searchParams.get("month") || currentYearMonth();
  const { start, end } = getMonthRange(yearMonth);
  const lastMonth = previousYearMonth(yearMonth);
  const { start: lastStart, end: lastEnd } = getMonthRange(lastMonth);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }

  const { data: contact, error: contactError } = await supabase
    .from("company_contacts")
    .select("company_name")
    .eq("view_token", token)
    .maybeSingle();

  if (contactError) {
    console.error("Supabase select error:", contactError);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }
  if (!contact) {
    return NextResponse.json({ success: false, error: "このリンクは無効です。" }, { status: 404 });
  }

  const { data: applications, error: appsError } = await supabase
    .from("audenki_applications")
    .select("id, created_at, contractor_name, plan, desired_start_date, status")
    .eq("company_name", contact.company_name)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Supabase select error:", appsError);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }

  const { data: lastMonthApps, error: lastMonthError } = await supabase
    .from("audenki_applications")
    .select("id")
    .eq("company_name", contact.company_name)
    .gte("created_at", lastStart)
    .lt("created_at", lastEnd);

  if (lastMonthError) {
    console.error("Supabase select error:", lastMonthError);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }

  const counts = countByStatus(applications ?? []);

  return NextResponse.json(
    {
      success: true,
      companyName: contact.company_name,
      yearMonth,
      totalCount: applications?.length ?? 0,
      counts,
      applications,
      lastMonthCount: lastMonthApps?.length ?? 0,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}
