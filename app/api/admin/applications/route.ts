import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: "ログインが必要です。" }, { status: 401 });
  }

  const companyFilter = request.nextUrl.searchParams.get("company");

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("audenki_applications")
      .select(
        "id, created_at, company_name, staff_name, link_date, plan, desired_start_date, contractor_name, contractor_name_kana, phone_number, status, status_note"
      )
      .order("created_at", { ascending: false });

    if (companyFilter) {
      query = query.eq("company_name", companyFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json(
        { success: false, error: "データの取得に失敗しました。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, applications: data }, { status: 200 });
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "データの取得に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }
}
