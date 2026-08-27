// ============================================================================
// フォームのデータ構造（型定義）
// ここを変更する場合は、Supabaseのテーブル定義・API Route（app/api/submit/route.ts）
// ・formSections.ts の入力項目定義もあわせて確認してください。
// ============================================================================

export interface AddressInfo {
  postalCode: string; // 郵便番号
  prefecture: string; // 都道府県
  city: string; // 市区町村
  addressLine: string; // 番地
  building: string; // 建物名・部屋番号（任意）
}

export interface AudenkiFormData {
  // 01 基本情報
  companyName: string; // 会社名
  staffName: string; // 申し込み担当者
  linkDate: string; // 連携日

  // 02 申し込み情報
  plan: string; // プラン選択
  desiredStartDate: string; // 使用開始希望日
  desiredStartTime: string; // 使用開始希望時間
  customerNumber: string; // お客様番号
  supplyPointNumber: string; // 供給地点番号
  currentPowerCompany: string; // 現在利用の電気会社
  currentPlan: string; // 現在利用中のプラン

  // 03 ご契約者様情報
  contractorName: string; // 名前（漢字）
  contractorNameKana: string; // ふりがな
  birthDate: string; // 生年月日
  phoneNumber: string; // 電話番号
  phoneType: string; // 電話番号区分

  // 04 ご使用場所住所
  usageAddress: AddressInfo;

  // 05 引越し前住所
  previousAddress: AddressInfo;
}

export const emptyAddress = (): AddressInfo => ({
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  building: "",
});

export const emptyFormData = (): AudenkiFormData => ({
  companyName: "",
  staffName: "",
  linkDate: "",
  plan: "",
  desiredStartDate: "",
  desiredStartTime: "",
  customerNumber: "",
  supplyPointNumber: "",
  currentPowerCompany: "",
  currentPlan: "",
  contractorName: "",
  contractorNameKana: "",
  birthDate: "",
  phoneNumber: "",
  phoneType: "",
  usageAddress: emptyAddress(),
  previousAddress: emptyAddress(),
});
