// ============================================================================
// 管理画面で扱う「ステータス」の定義です。
// ステータスの追加・表示名変更は、ここを編集するだけで完結します。
// ============================================================================

export const APPLICATION_STATUSES = [
  "①申し込み中",
  "②後確認中",
  "③返却",
  "④完了",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const DEFAULT_STATUS: ApplicationStatus = "①申し込み中";

// このステータスに変更されたときだけ、会社担当者へメール通知します。
export const NOTIFY_ON_STATUS: ApplicationStatus = "③返却";

export const STATUS_STYLES: Record<ApplicationStatus, string> = {
  "①申し込み中": "bg-blue-50 text-blue-700 border-blue-200",
  "②後確認中": "bg-amber-50 text-amber-700 border-amber-200",
  "③返却": "bg-red-50 text-red-700 border-red-200",
  "④完了": "bg-green-50 text-green-700 border-green-200",
};

export function isValidStatus(value: string): value is ApplicationStatus {
  return (APPLICATION_STATUSES as readonly string[]).includes(value);
}
