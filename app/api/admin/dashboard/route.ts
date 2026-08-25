import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { APPLICATION_STATUSES } from "@/lib/statusConfig";

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

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: "ログインが必要です。" }, { status: 401 });
  }

  const yearMonth = request.nextUrl.searchParams.get("month") || currentYearMonth();
  const { start, end } = getMonthRange(yearMonth);

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "取得に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const { data: applications, error: appsError } = await supabase
    .from("audenki_applications")
    .select("status, created_at")
    .gte("created_at", start)
    .lt("created_at", end);

  if (appsError) {
    console.error("Supabase select error:", appsError);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) counts[s] = 0;
  for (const app of applications ?? []) {
    if (counts[app.status] !== undefined) counts[app.status] += 1;
  }

  const { data: targetRow } = await supabase
    .from("monthly_targets")
    .select("target_count")
    .eq("year_month", yearMonth)
    .maybeSingle();

  return NextResponse.json(
    {
      success: true,
      yearMonth,
      totalCount: applications?.length ?? 0,
      counts,
      target: targetRow?.target_count ?? 0,
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    }
  );
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: "ログインが必要です。" }, { status: 401 });
  }
  if (user.role !== "editor") {
    return NextResponse.json(
      { success: false, error: "この操作には編集者権限が必要です。" },
      { status: 403 }
    );
  }

  let body: { yearMonth?: string; target?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { yearMonth, target } = body;
  if (!yearMonth || typeof target !== "number" || target < 0) {
    return NextResponse.json({ success: false, error: "入力内容が不正です。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "保存に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const { error } = await supabase
    .from("monthly_targets")
    .upsert({ year_month: yearMonth, target_count: target, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ success: false, error: "保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
