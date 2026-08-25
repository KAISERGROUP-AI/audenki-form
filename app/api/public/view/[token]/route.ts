import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { APPLICATION_STATUSES } from "@/lib/statusConfig";

interface RouteParams {
  params: { token: string };
}

// ※このAPIはログイン不要です。トークン（推測困難なランダム文字列）を知っている人だけが、
// その会社の案件一覧・件数を閲覧できます（編集は一切できません）。

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { token } = params;
  if (!token) {
    return NextResponse.json({ success: false, error: "無効なリンクです。" }, { status: 400 });
  }

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
    .order("created_at", { ascending: false });

  if (appsError) {
    console.error("Supabase select error:", appsError);
    return NextResponse.json({ success: false, error: "取得に失敗しました。" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
  for (const s of APPLICATION_STATUSES) counts[s] = 0;
  for (const app of applications ?? []) {
    if (counts[app.status] !== undefined) counts[app.status] += 1;
  }

  return NextResponse.json(
    {
      success: true,
      companyName: contact.company_name,
      totalCount: applications?.length ?? 0,
      counts,
      applications,
    },
    { status: 200 }
  );
}
