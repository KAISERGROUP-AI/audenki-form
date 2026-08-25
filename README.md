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

## 3. 管理画面（顧客管理表）のテーブル作成

SupabaseのSQL Editorで以下を実行してください（`audenki_applications`にステータス関連のカラムを追加し、会社ごとの通知先メールアドレスを保存するテーブルを新規作成します）。

```sql
alter table audenki_applications
  add column if not exists status text not null default '①申し込み中',
  add column if not exists status_note text;

create table if not exists company_contacts (
  company_name text primary key,
  contact_email text not null,
  updated_at timestamptz not null default now()
);
```

ステータスは `①申し込み中` `②後確認中` `③返却` `④完了` の4つです。
「③返却」に変更すると、`company_contacts` に登録された会社の担当者へ自動でメールが送信されます
（未登録の会社は、管理画面の「会社連絡先」ページから登録してください）。

### 3-2. 会社向け「進捗確認リンク」機能を追加する場合

会社ごとに、ステータスと件数だけを見られる閲覧専用リンクを発行する機能です。
すでに上記の`company_contacts`テーブルを作成済みの場合は、以下を追加で実行してください。

```sql
alter table company_contacts
  add column if not exists view_token text unique;

alter table company_contacts
  alter column contact_email drop not null;
```

（`contact_email`を必須ではなくしているのは、メール通知を使わずリンクだけ発行したい会社にも対応するためです）

管理画面の「会社連絡先」ページで「リンクを発行」を押すと、
`https://（デプロイ先）/view/（発行されたトークン）` という形のURLが作られます。
このURLを知っている人だけが、その会社の進捗状況（ステータス別件数・一覧）を閲覧できます。
ログイン不要・編集不可のページです。他の会社のデータは表示されません。

## 4. 管理画面（`/admin`）のログイン設定

`.env.local`（またはVercelの環境変数）に以下を設定してください。

```
ADMIN_USERS=tanaka:tanaka-pass:editor,sato:sato-pass:viewer
ADMIN_SESSION_SECRET=十分に長いランダムな文字列
```

- `ADMIN_USERS` はメンバーのアカウント一覧です。`ユーザー名:パスワード:role` をカンマ区切りで並べます。
  `role` は `editor`（ステータス変更・会社連絡先の編集ができる）または `viewer`（閲覧のみ）です。
- メンバーの追加・削除・権限変更は、この環境変数を書き換えて再デプロイするだけで反映されます。
- `ADMIN_SESSION_SECRET` はログインセッションの署名に使う秘密の文字列です。他人に推測されない、十分長いランダム文字列にしてください。

ログインURL：`https://（デプロイ先のURL）/admin/login`

## 5. Gmail通知の設定

1. 送信に使うGmailアカウントで **2段階認証** を有効化
2. Googleアカウント設定 > セキュリティ > 「アプリ パスワード」を発行
3. `.env.local` の `GMAIL_USER` / `GMAIL_APP_PASSWORD` に設定
4. `NOTIFY_EMAIL_1` に通知を受け取るメールアドレスを設定（必須・1件のみでOK）。2人目に送りたくなったら `NOTIFY_EMAIL_2` を追加するだけで自動的に両方に届きます

## 6. デプロイ（Vercel推奨）

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
| 管理画面のステータス項目を追加・変更 | `lib/statusConfig.ts` |
| 管理画面のメンバー・権限を追加/変更 | Vercelの環境変数 `ADMIN_USERS` |
| 「返却」通知メールの文面 | `app/api/admin/applications/[id]/route.ts`（`sendReturnNotification`関数） |

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
  admin/login/page.tsx  # 管理画面ログインページ
  admin/page.tsx         # 管理画面：案件一覧（顧客管理表）
  admin/companies/page.tsx # 管理画面：会社ごとの通知先メール管理
  api/admin/login/route.ts       # ログイン処理
  api/admin/logout/route.ts       # ログアウト処理
  api/admin/me/route.ts            # ログイン中ユーザー確認
  api/admin/applications/route.ts   # 案件一覧取得
  api/admin/applications/[id]/route.ts # ステータス更新＋「返却」時のメール送信
  api/admin/companies/route.ts      # 会社連絡先の取得・保存
  api/admin/companies/link/route.ts   # 進捗確認リンク（トークン）の発行
  api/public/view/[token]/route.ts     # 会社向け進捗確認ページ用API（ログイン不要）
  view/[token]/page.tsx                 # 会社向け進捗確認ページ本体（閲覧専用）
components/
  AudenkiForm.tsx       # 状態管理の中心（入力/確認/完了のステップ管理）
  FormHeader.tsx         # ヘッダー（タイトル・ステップ表示）
  FormSectionCard.tsx    # セクションカード（01, 02...の番号付き）
  FormField.tsx          # 個々の入力欄
  RequiredBadge.tsx       # 「必須」「任意」バッジ
  ConfirmationView.tsx    # 確認画面
  CompletionView.tsx      # 完了画面
  admin/AdminHeader.tsx    # 管理画面の共通ヘッダー・ナビ
  admin/StatusBadge.tsx     # ステータス表示バッジ（閲覧者向け）
  admin/StatusEditor.tsx     # ステータス変更コントロール（編集者向け）
lib/
  types.ts             # フォームのデータ構造（型定義）
  formSections.ts       # フォーム項目の定義（ここを編集すれば項目が変わる）
  paths.ts               # ドット区切りパスでのデータ取得・更新ユーティリティ
  supabaseServer.ts       # Supabaseクライアント（サーバー専用）
  statusConfig.ts          # 管理画面のステータス定義（ここを編集すれば項目が変わる）
  adminAuth.ts              # 管理画面のログイン認証・セッション管理
middleware.ts             # /admin配下のログイン保護
```
