// ============================================================================
// フォーム項目の定義ファイル
// 項目の追加・削除・並び替え・必須/任意の変更は、基本的にこのファイルの編集だけで完結します。
// ※ 項目を追加した場合は、lib/types.ts の型定義と、Supabaseのテーブルの
// カラムもあわせて追加してください。
// ============================================================================

export type FieldType = "text" | "kana" | "tel" | "date" | "time-select" | "select" | "file";

export interface FieldConfig {
  path: string; // フォームデータ内の位置（例: "staffName" / "usageAddress.postalCode"）
  label: string; // 画面に表示する項目名
  type: FieldType;
  required: boolean;
  placeholder?: string;
  autoComplete?: string;
  options?: { value: string; label: string }[]; // select / time-select 用
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
  helpText?: string;
}

export interface SectionConfig {
  number: string; // 01, 02, 03...
  title: string;
  description?: string;
  fields: FieldConfig[];
}

export const PHONE_TYPE_OPTIONS = [
  { value: "携帯", label: "携帯電話" },
  { value: "固定", label: "固定電話" },
];

export const TIME_BAND_OPTIONS = [
  { value: "09:00-12:00", label: "09:00〜12:00" },
  { value: "12:00-15:00", label: "12:00〜15:00" },
  { value: "15:00-18:00", label: "15:00〜18:00" },
  { value: "18:00-21:00", label: "18:00〜21:00" },
];

export const PLAN_OPTIONS = [
  { value: "でんきMプラン", label: "でんきMプラン（一般家庭向け）" },
  { value: "でんきLプラン", label: "でんきLプラン" },
  { value: "でんきSプラン", label: "でんきSプラン" },
];

export const PREFECTURE_OPTIONS = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
].map((p) => ({ value: p, label: p }));

function addressFields(
  prefix: "usageAddress" | "previousAddress",
  required: boolean
): FieldConfig[] {
  return [
    {
      path: `${prefix}.postalCode`,
      label: "郵便番号",
      type: "text",
      required,
      placeholder: "例：7300000（ハイフンなし）",
      inputMode: "numeric",
      maxLength: 8,
    },
    {
      path: `${prefix}.prefecture`,
      label: "都道府県",
      type: "select",
      required,
      options: PREFECTURE_OPTIONS,
      placeholder: "選択してください",
    },
    {
      path: `${prefix}.city`,
      label: "市区町村",
      type: "text",
      required,
      placeholder: "例：広島市南区東雲",
    },
    {
      path: `${prefix}.addressLine`,
      label: "番地",
      type: "text",
      required,
      placeholder: "例：3丁目3-20",
    },
    {
      path: `${prefix}.building`,
      label: "建物名・部屋番号",
      type: "text",
      required: false,
      placeholder: "例：KAISERビル 101号室",
    },
  ];
}

export const FORM_SECTIONS: SectionConfig[] = [
  {
    number: "01",
    title: "基本情報",
    description: "この申し込みを取り扱う会社・担当者情報です。",
    fields: [
      {
        path: "companyName",
        label: "会社名",
        type: "select",
        required: true,
        placeholder: "会社名を選択してください",
      },
      {
        path: "staffName",
        label: "申し込み担当者",
        type: "text",
        required: true,
        placeholder: "例：山田 太郎",
        autoComplete: "name",
      },
      {
        path: "linkDate",
        label: "連携日",
        type: "date",
        required: true,
      },
    ],
  },
  {
    number: "02",
    title: "申し込み情報",
    description: "ご契約いただくプランと利用開始希望日時です。",
    fields: [
      {
        path: "plan",
        label: "プラン選択",
        type: "select",
        required: true,
        options: PLAN_OPTIONS,
        placeholder: "選択してください",
      },
      {
        path: "customerNumber",
        label: "お客様番号",
        type: "text",
        required: true,
        placeholder: "例：1234567890",
      },
      {
        path: "supplyPointNumber",
        label: "供給地点番号",
        type: "text",
        required: true,
        placeholder: "例：00112233445566778899（22桁）",
        inputMode: "numeric",
        maxLength: 22,
        helpText: "検針票や現在の電気料金明細に記載されている22桁の番号です。",
      },
      {
        path: "currentPowerCompany",
        label: "現在利用の電気会社",
        type: "text",
        required: true,
        placeholder: "例：中国電力",
      },
      {
        path: "currentPlan",
        label: "現在利用中のプラン",
        type: "text",
        required: true,
        placeholder: "例：従量電灯A",
      },
      {
        path: "currentAmpere",
        label: "現在利用中のアンペア",
        type: "text",
        required: true,
        placeholder: "例：30A",
      },
    ],
  },
  {
    number: "03",
    title: "ご契約者様情報",
    description: "電気のご契約者様ご本人の情報をご入力ください。",
    fields: [
      {
        path: "contractorName",
        label: "名前（漢字）",
        type: "text",
        required: true,
        placeholder: "例：山田 太郎",
        autoComplete: "name",
      },
      {
        path: "contractorNameKana",
        label: "ふりがな",
        type: "kana",
        required: true,
        placeholder: "例：やまだ たろう",
      },
      {
        path: "birthDate",
        label: "生年月日",
        type: "date",
        required: true,
      },
      {
        path: "phoneNumber",
        label: "電話番号",
        type: "tel",
        required: true,
        placeholder: "例：09012345678（ハイフンなし）",
        inputMode: "tel",
        maxLength: 11,
      },
      {
        path: "phoneType",
        label: "電話番号区分",
        type: "select",
        required: true,
        options: PHONE_TYPE_OPTIONS,
        placeholder: "選択してください",
      },
    ],
  },
  {
    number: "04",
    title: "ご使用場所住所",
    description: "電気を使用される場所のご住所です。",
    fields: addressFields("usageAddress", true),
  },
  {
    number: "05",
    title: "引越し前住所",
    description: "お引越しされるお客様のみご入力ください。お引越しがない場合は空欄のままで構いません。",
    fields: addressFields("previousAddress", false),
  },
  {
    number: "06",
    title: "同意書",
    description: "お客様に署名・捺印いただいた同意書を撮影してアップロードしてください。",
    fields: [
      {
        path: "consentFormImage",
        label: "同意書の写真",
        type: "file",
        required: true,
        helpText: "文字がはっきり読める明るさ・角度で撮影してください。",
      },
    ],
  },
];
