"use client";

import { useState } from "react";
import { APPLICATION_STATUSES, ApplicationStatus, NOTIFY_ON_STATUS } from "@/lib/statusConfig";

interface Props {
  applicationId: string;
  currentStatus: string;
  onUpdated: (newStatus: string, warning?: string) => void;
}

export function StatusEditor({ applicationId, currentStatus, onUpdated }: Props) {
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelect(value: string) {
    const status = value as ApplicationStatus;
    if (status === NOTIFY_ON_STATUS) {
      // 返却は理由メモを入れてから確定させる
      setPendingStatus(status);
      return;
    }
    void submit(status, "");
  }

  async function submit(status: ApplicationStatus, noteValue: string) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: noteValue || undefined }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error ?? "更新に失敗しました。");
        setSubmitting(false);
        return;
      }
      onUpdated(status, result.warning);
      setPendingStatus(null);
      setNote("");
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingStatus) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <p className="text-xs font-bold text-red-700">差し戻し理由（任意・会社担当者へのメールに記載されます）</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-red-200 bg-white px-2 py-1.5 text-sm"
          placeholder="例：供給地点番号のご確認をお願いします"
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => submit(pendingStatus, note)}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {submitting ? "送信中…" : "返却して通知する"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              setPendingStatus(null);
              setNote("");
              setError(null);
            }}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentStatus}
        disabled={submitting}
        onChange={(e) => handleSelect(e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm"
      >
        {APPLICATION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
