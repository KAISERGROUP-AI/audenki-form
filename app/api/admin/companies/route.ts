import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);
  if (!user) {
    return NextResponse.json({ success: false, error: "ログインが必要です。" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "データの取得に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const [{ data: contacts, error: contactsError }, { data: apps, error: appsError }] = await Promise.all([
    supabase
      .from("company_contacts")
      .select("company_name, contact_email, view_token")
      .order("company_name"),
    supabase.from("audenki_applications").select("company_name"),
  ]);

  if (contactsError || appsError) {
    console.error("Supabase select error:", contactsError ?? appsError);
    return NextResponse.json({ success: false, error: "データの取得に失敗しました。" }, { status: 500 });
  }

  // 申し込み実績はあるが、まだ連絡先未登録の会社も一覧に出す
  const contactMap = new Map(
    (contacts ?? []).map((c) => [c.company_name, { contactEmail: c.contact_email, viewToken: c.view_token }])
  );
  const allCompanyNames = new Set<string>([
    ...(contacts ?? []).map((c) => c.company_name),
    ...(apps ?? []).map((a) => a.company_name),
  ]);

  const companies = Array.from(allCompanyNames)
    .sort()
    .map((name) => ({
      companyName: name,
      contactEmail: contactMap.get(name)?.contactEmail ?? "",
      viewToken: contactMap.get(name)?.viewToken ?? null,
      hasContact: contactMap.has(name),
    }));

  return NextResponse.json({ success: true, companies }, { status: 200 });
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

  let body: { companyName?: string; contactEmail?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { companyName, contactEmail } = body;
  if (!companyName || !contactEmail) {
    return NextResponse.json(
      { success: false, error: "会社名とメールアドレスを入力してください。" },
      { status: 400 }
    );
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
    .from("company_contacts")
    .upsert({ company_name: companyName, contact_email: contactEmail, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ success: false, error: "保存に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

// 会社名の変更（改名）。過去の申し込み履歴・目標データもすべて新しい名前に紐付け直す。
export async function PATCH(request: NextRequest) {
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

  let body: { oldName?: string; newName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const oldName = body.oldName?.trim();
  const newName = body.newName?.trim();
  if (!oldName || !newName) {
    return NextResponse.json({ success: false, error: "会社名を入力してください。" }, { status: 400 });
  }
  if (oldName === newName) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "更新に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const { data: existing } = await supabase
    .from("company_contacts")
    .select("company_name")
    .eq("company_name", newName)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { success: false, error: "その会社名はすでに使われています。別の名前を入力してください。" },
      { status: 400 }
    );
  }

  const { error: contactError } = await supabase
    .from("company_contacts")
    .update({ company_name: newName, updated_at: new Date().toISOString() })
    .eq("company_name", oldName);

  if (contactError) {
    console.error("Supabase update error:", contactError);
    return NextResponse.json({ success: false, error: "更新に失敗しました。" }, { status: 500 });
  }

  const { error: appsError } = await supabase
    .from("audenki_applications")
    .update({ company_name: newName })
    .eq("company_name", oldName);

  if (appsError) {
    console.error("Supabase update error:", appsError);
    return NextResponse.json({ success: false, error: "申し込み履歴の更新に失敗しました。" }, { status: 500 });
  }

  await supabase
    .from("company_monthly_targets")
    .update({ company_name: newName })
    .eq("company_name", oldName);

  return NextResponse.json({ success: true }, { status: 200 });
}

// 会社の連絡先登録の削除（過去の申し込み履歴は残る。プルダウンや連絡先一覧からは消える）。
export async function DELETE(request: NextRequest) {
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

  const companyName = body.companyName?.trim();
  if (!companyName) {
    return NextResponse.json({ success: false, error: "会社名が指定されていません。" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "削除に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("company_contacts").delete().eq("company_name", companyName);

  if (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json({ success: false, error: "削除に失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
