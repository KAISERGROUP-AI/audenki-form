# auでんき申し込みフォーム連携

Next.js（App Router）+ Tailwind CSS + Supabase + Gmail通知 で構築した申し込みフォームです。

流れ：**入力 → 内容確認 → 送信 → 完了**

---

## 1. セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local を編集して実際の値を入力
npm run dev
```

http://localhost:3000 で確認できます。

## 2. Supabaseのテーブル作成

SupabaseのSQL Editorで以下を実行してテーブルを作成してください。

```sql
create table audenki_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  company_name text not null,
  staff_name text not null,
  link_date date not null,

  plan text not null,
  desired_start_date date not null,
  desired_start_time text not null,
  supply_point_number text not null,
  current_power_company text not null,

  contractor_name text not null,
  contractor_name_kana text not null,
  birth_date date not null,
  phone_number text not null,
  phone_type text not null,

  usage_address jsonb not null,
  previous_address jsonb not null
);
```

住所（`usage_address` / `previous_address`）は
`{ postalCode, prefecture, city, addressLine, building }` の形のJSONで保存されます。

## 3. Gmail通知の設定

1. 送信に使うGmailアカウントで **2段階認証** を有効化
2. Googleアカウント設定 > セキュリティ > 「アプリ パスワード」を発行
3. `.env.local` の `GMAIL_USER` / `GMAIL_APP_PASSWORD` に設定
4. `NOTIFY_EMAIL_1` / `NOTIFY_EMAIL_2` に通知を受け取る2名分のメールアドレスを設定

## 4. デプロイ（Vercel推奨）

1. このプロジェクトをGitHubリポジトリにpush
2. Vercelでリポジトリをインポート
3. Vercelの Project Settings > Environment Variables に `.env.local` と同じ内容を設定
4. デプロイ

---

## 今後フォーム項目を追加・変更する場合に触るファイル

| やりたいこと | 編集するファイル |
|---|---|
| 項目の追加・削除・並び替え・ラベル変更・必須/任意の変更 | `lib/formSections.ts` |
| データの型定義（新しい項目を追加した場合はここも） | `lib/types.ts` |
| Supabaseへの保存項目（新しい項目を追加した場合はここも） | `app/api/submit/route.ts`（`insert` 部分）＋ Supabaseのテーブルにカラム追加 |
| デザイン（色・余白・カード等） | `tailwind.config.ts`（色は `colors.accent` など）／各 `components/*.tsx` |
| メインタイトル・サブタイトル・ステップ表記 | `components/FormHeader.tsx` |
| 完了画面の文言 | `components/CompletionView.tsx` |
| 入力欄の見た目（角丸・枠線・フォーカス色など） | `components/FormField.tsx` |

**項目を1つ追加する場合の最短ルート：**

1. `lib/types.ts` にフィールドを追加
2. `lib/formSections.ts` の該当セクションに `FieldConfig` を1行追加
3. `app/api/submit/route.ts` の `insert({...})` に対応するカラムを追加
4. Supabaseのテーブルに同名のカラムを追加

画面（入力欄・確認画面・必須バッジなど）は自動的に反映されます。

---

## ディレクトリ構成

```
app/
  layout.tsx          # 全体レイアウト・フォント
  page.tsx            # トップページ（フォーム本体を呼び出すだけ）
  globals.css          # 全体スタイル
  api/submit/route.ts  # 送信API（バリデーション → Supabase保存 → Gmail通知）
components/
  AudenkiForm.tsx       # 状態管理の中心（入力/確認/完了のステップ管理）
  FormHeader.tsx         # ヘッダー（タイトル・ステップ表示）
  FormSectionCard.tsx    # セクションカード（01, 02...の番号付き）
  FormField.tsx          # 個々の入力欄
  RequiredBadge.tsx       # 「必須」「任意」バッジ
  ConfirmationView.tsx    # 確認画面
  CompletionView.tsx      # 完了画面
lib/
  types.ts             # フォームのデータ構造（型定義）
  formSections.ts       # フォーム項目の定義（ここを編集すれば項目が変わる）
  paths.ts               # ドット区切りパスでのデータ取得・更新ユーティリティ
  supabaseServer.ts       # Supabaseクライアント（サーバー専用）
```
