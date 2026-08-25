import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifySessionToken, ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isValidStatus, NOTIFY_ON_STATUS } from "@/lib/statusConfig";

interface RouteParams {
  params: { id: string };
}

async function sendReturnNotification(params: {
  companyName: string;
  contractorName: string;
  note: string | null;
}) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD が設定されていません。");
  }

  const supabase = getSupabaseServerClient();
  const { data: contact, error } = await supabase
    .from("company_contacts")
    .select("contact_email")
    .eq("company_name", params.companyName)
    .maybeSingle();

  if (error) {
    throw new Error(`会社担当者の連絡先取得に失敗しました: ${error.message}`);
  }
  if (!contact?.contact_email) {
    throw new Error(
      `「${params.companyName}」の通知先メールアドレスが未登録です。管理画面の「会社連絡先」から登録してください。`
    );
  }

  // 通知先メールは「a@example.com, b@example.com」のようにカンマ区切りで
  // 複数登録できます（1つだけでも問題ありません）。
  const recipients = contact.contact_email
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      `「${params.companyName}」の通知先メールアドレスが未登録です。管理画面の「会社連絡先」から登録してください。`
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailAppPassword },
  });

  await transporter.sendMail({
    from: gmailUser,
    to: recipients,
    subject: `【auでんき】お申し込み内容のご確認のお願い（${params.contractorName}様）`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>お申し込み内容のご確認のお願い</h2>
        <p>${escapeHtml(params.companyName)}様</p>
        <p>
          お申し込みいただいた内容（${escapeHtml(params.contractorName)}様分）について、
          確認が必要な項目がございましたのでご連絡いたします。
        </p>
        ${params.note ? `<p><strong>差し戻し理由：</strong><br>${escapeHtml(params.note)}</p>` : ""}
        <p>お手数ですが、内容をご確認のうえ、本メールに返信する形でご連絡くださいますようお願いいたします。</p>
        <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;" />
        <p style="font-size:13px;color:#555;line-height:1.8;">
          株式会社KAISER GROUP<br>
          TEL: 082-236-7133<br>
          Mail: info@kaisergroup.company<br>
          HP: <a href="https://kaisergroup.company/">https://kaisergroup.company/</a><br>
          <br>
          〒734-0022<br>
          広島県広島市南区東雲3丁目3-20<br>
          事業者届出番号: H2312450<br>
          適格請求書発行事業者登録番号: T8240001061349<br>
          古物商許可番号:第731032600032号
        </p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  let body: { status?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { status, note } = body;
  if (!status || !isValidStatus(status)) {
    return NextResponse.json({ success: false, error: "不正なステータスです。" }, { status: 400 });
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

  const { data: updated, error: updateError } = await supabase
    .from("audenki_applications")
    .update({ status, status_note: note ?? null })
    .eq("id", params.id)
    .select("id, company_name, contractor_name, status")
    .maybeSingle();

  if (updateError || !updated) {
    console.error("Supabase update error:", updateError);
    return NextResponse.json(
      { success: false, error: "ステータスの更新に失敗しました。" },
      { status: 500 }
    );
  }

  if (status === NOTIFY_ON_STATUS) {
    try {
      await sendReturnNotification({
        companyName: updated.company_name,
        contractorName: updated.contractor_name,
        note: note ?? null,
      });
    } catch (err) {
      console.error("Return notification error:", err);
      return NextResponse.json(
        {
          success: true,
          application: updated,
          warning: err instanceof Error ? err.message : "通知メールの送信に失敗しました。",
        },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ success: true, application: updated }, { status: 200 });
}
