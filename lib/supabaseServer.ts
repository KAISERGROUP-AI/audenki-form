import { createClient } from "@supabase/supabase-js";

// サーバー側（API Route）専用のSupabaseクライアントです。
// SUPABASE_SERVICE_ROLE_KEY はブラウザに絶対に露出させないでください。
// app/api/submit/route.ts と app/api/admin/* から読み込まれます。

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が環境変数に設定されていません。"
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
