import { NextRequest, NextResponse } from "next/server";
import { verifyLogin, createSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/adminAuth";

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "リクエスト形式が不正です。" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json(
      { success: false, error: "ユーザー名とパスワードを入力してください。" },
      { status: 400 }
    );
  }

  const user = verifyLogin(username, password);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "ユーザー名またはパスワードが違います。" },
      { status: 401 }
    );
  }

  let token: string;
  try {
    token = await createSessionToken(user);
  } catch (err) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { success: false, error: "サーバー設定エラーです。管理者へご連絡ください。" },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ success: true, user }, { status: 200 });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
