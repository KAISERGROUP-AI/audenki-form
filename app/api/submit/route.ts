import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { AudenkiFormData } from "@/lib/types";
import { FORM_SECTIONS } from "@/lib/formSections";
import { getByPath } from "@/lib/paths";

// このAPI Routeが担う処理は3つだけです。
// 1) サーバー側での必須項目チェック
// 2) Supabaseへの保存
// 3) Gmail通知メール送信（NOTIFY_EMAIL_1は必須、NOTIFY_EMAIL_2は任意。
//    2人目を追加したくなったら、Vercelの環境変数にNOTIFY_EMAIL_2を追加するだけでOK）
// フォーム項目を追加/削除した場合、ここは触らずに
// lib/formSections.ts と lib/types.ts の変更だけで追従します。

function validate(data: AudenkiFormData): string[] {
  const errors: string[] = [];
  for (const section of FORM_SECTIONS) {
    for (const field of section.fields) {
      if (field.required) {
        const value = getByPath(data, field.path);
        if (!value || value.trim() === "") {
          errors.push(`${section.title}：${field.label}は必須です。`);
        }
      }
    }
  }
  return errors;
}

function buildNotificationHtml(data: AudenkiFormData): string {
  const rows = FORM_SECTIONS.map((section) => {
    const fieldRows = section.fields
      .map((field) => {
        const raw = getByPath(data, field.path);
        const value = raw && raw.trim() !== "" ? raw : "（未入力）";
        return `<tr>
          <td style="padding:6px 12px;color:#8A8578;white-space:nowrap;">${field.label}</td>
          <td style="padding:6px 12px;color:#20242B;">${escapeHtml(value)}</td>
        </tr>`;
      })
      .join("");
    return `
      <tr>
        <td colspan="2" style="padding:16px 12px 4px;font-weight:bold;color:#D9600F;border-top:1px solid #E6E1D8;">
          ${section.number} ${section.title}
        </td>
      </tr>
      ${fieldRows}
    `;
  }).join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#20242B;">auでんき 新規お申し込みのご連携</h2>
      <p style="color:#555;">以下の内容でお申し込みフォームより連携がありました。</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
      </table>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendNotificationEmail(data: AudenkiFormData) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const recipient1 = process.env.NOTIFY_EMAIL_1;
  const recipient2 = process.env.NOTIFY_EMAIL_2; // 任意：2人目を増やす場合はVercelに追加するだけ

  if (!gmailUser || !gmailAppPassword || !recipient1) {
    throw new Error(
      "メール通知の環境変数（GMAIL_USER / GMAIL_APP_PASSWORD / NOTIFY_EMAIL_1）が不足しています。"
    );
  }

  const recipients = [recipient1, recipient2].filter(
    (email): email is string => Boolean(email && email.trim() !== "")
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: gmailUser,
    to: recipients,
    subject: `【auでんき】新規お申し込み連携（${data.contractorName || "お名前未入力"}様）`,
    html: buildNotificationHtml(data),
  });
}

export async function POST(request: NextRequest) {
  let data: AudenkiFormData;

  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const errors = validate(data);
  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: errors[0], errors }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error: insertError } = await supabase.from("audenki_applications").insert({
      company_name: data.companyName,
      staff_name: data.staffName,
      link_date: data.linkDate,
      plan: data.plan,
      desired_start_date: data.desiredStartDate,
      desired_start_time: data.desiredStartTime,
      supply_point_number: data.supplyPointNumber,
      current_power_company: data.currentPowerCompany,
      contractor_name: data.contractorName,
      contractor_name_kana: data.contractorNameKana,
      birth_date: data.birthDate,
      phone_number: data.phoneNumber,
      phone_type: data.phoneType,
      usage_address: data.usageAddress,
      previous_address: data.previousAddress,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "データの保存に失敗しました。時間をおいて再度お試しください。" },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Supabase client error:", err);
    return NextResponse.json(
      { success: false, error: "データの保存に失敗しました。環境変数の設定を確認してください。" },
      { status: 500 }
    );
  }

  try {
    await sendNotificationEmail(data);
  } catch (err) {
    // 保存は既に成功しているため、送信失敗はエラーとして返しつつ
    // データ自体はロストしないようにします（担当者は後から手動確認可能）。
    console.error("Gmail notification error:", err);
    return NextResponse.json(
      {
        success: true,
        warning: "保存は完了しましたが、メール通知の送信に失敗しました。担当者へご連絡ください。",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
