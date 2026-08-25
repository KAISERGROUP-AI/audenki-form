// ============================================================================
// 管理画面用の認証まわりです。
//
// メンバーのアカウントは環境変数 ADMIN_USERS に、
//   ユーザー名:パスワード:role,ユーザー名:パスワード:role
// の形式で登録します（role は "editor" または "viewer"）。
// 例：
//   ADMIN_USERS=tanaka:tanaka-pass:editor,sato:sato-pass:viewer
//
// メンバーの追加・削除・権限変更は、Vercelの環境変数を編集するだけでOKです。
//
// ※ middleware.ts（Edge Runtime）とAPI Route（Node Runtime）の両方から
// 呼び出すため、Node専用の "crypto" モジュールではなく、
// 両方で使えるWeb Crypto API（globalThis.crypto.subtle）で署名しています。
// ============================================================================

export type AdminRole = "editor" | "viewer";

export interface AdminUser {
  username: string;
  role: AdminRole;
}

interface AdminUserWithPassword extends AdminUser {
  password: string;
}

function parseAdminUsers(): AdminUserWithPassword[] {
  const raw = process.env.ADMIN_USERS ?? "";
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [username, password, role] = entry.split(":").map((s) => s?.trim());
      return { username, password, role: role === "editor" ? "editor" : "viewer" } as AdminUserWithPassword;
    })
    .filter((u) => u.username && u.password);
}

export function verifyLogin(username: string, password: string): AdminUser | null {
  const users = parseAdminUsers();
  const found = users.find((u) => u.username === username && u.password === password);
  if (!found) return null;
  return { username: found.username, role: found.role };
}

// --- セッションCookieの署名・検証（Web Crypto API） --------------------------

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12時間
const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const arr = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): ArrayBuffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const str = atob(padded);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes.buffer;
}

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET が環境変数に設定されていません。");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(signature);
}

export async function createSessionToken(user: AdminUser): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = JSON.stringify({ username: user.username, role: user.role, exp });
  const encoded = base64UrlEncode(encoder.encode(payload));
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<AdminUser | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signature),
      encoder.encode(encoded)
    );
    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(encoded));
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    if (payload.role !== "editor" && payload.role !== "viewer") return null;
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
