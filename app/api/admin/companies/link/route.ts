import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

  let body: { companyName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { companyName } = body;
  if (!companyName) {
    return NextResponse.json({ success: false, error: "会社名を指定してください。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "発行に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const viewToken = generateToken();

  const { error } = await supabase.from("company_contacts").upsert(
    {
      company_name: companyName,
      view_token: viewToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_name", ignoreDuplicates: false }
  );

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ success: false, error: "発行に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ success: true, viewToken }, { status: 200 });
}
