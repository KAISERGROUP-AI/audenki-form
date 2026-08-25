"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { APPLICATION_STATUSES } from "@/lib/statusConfig";

type AdminRole = "editor" | "viewer";

interface DashboardData {
  yearMonth: string;
  totalCount: number;
  counts: Record<string, number>;
  target: number;
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<{ username: string; role: AdminRole } | null>(null);
  const [month, setMonth] = useState(currentYearMonth());
  const [data, setData] = useState<DashboardData | null>(null);
  const [targetDraft, setTargetDraft] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/dashboard?month=${m}`);
      const result = await res.json();
      if (!res.ok || !result.success) {
        setMessage(result.error ?? "取得に失敗しました。");
      } else {
        setData(result);
        setTargetDraft(String(result.target ?? 0));
      }
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/admin/me");
      if (meRes.ok) {
        const meResult = await meRes.json();
        setUser(meResult.user);
      }
      await load(month);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMonthChange(value: string) {
    setMonth(value);
    load(value);
  }

  async function handleSaveTarget() {
    const target = parseInt(targetDraft, 10);
    if (isNaN(target) || target < 0) {
      setMessage("正しい数値を入力してください。");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yearMonth: month, target }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setMessage(result.error ?? "保存に失敗しました。");
      } else {
        setMessage("目標値を保存しました。");
        await load(month);
      }
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return <div className="p-8 text-sm text-stone-500">読み込み中…</div>;
  }

  const total = data?.totalCount ?? 0;
  const target = data?.target ?? 0;
  const progress = target > 0 ? Math.min(100, Math.round((total / target) * 1000) / 10) : null;

  return (
    <div className="min-h-dvh bg-stone-50">
      <AdminHeader username={user.username} role={user.role} />

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-stone-800">月次ダッシュボード</h1>
          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-stone-200 bg-white p-3 text-sm font-medium text-stone-700">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-stone-500">読み込み中…</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                <p className="text-xs text-stone-500">①総件数</p>
                <p className="mt-1 text-2xl font-bold text-stone-800">{total}</p>
              </div>
              {APPLICATION_STATUSES.map((status, i) => (
                <div key={status} className="rounded-xl border border-stone-200 bg-white p-4 text-center">
                  <p className="text-xs text-stone-500">
                    {i === 0 ? "②" : i === 1 ? "③" : i === 2 ? "④" : "⑤"}
                    {status.replace(/^[①②③④]/, "")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-stone-800">{data?.counts[status] ?? 0}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5">
              <p className="text-sm font-bold text-stone-800">今月の目標</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="number"
                  min={0}
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  disabled={user.role !== "editor"}
                  placeholder="目標件数"
                  className="w-40 rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-50"
                />
                {user.role === "editor" && (
                  <button
                    onClick={handleSaveTarget}
                    disabled={saving}
                    className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    {saving ? "保存中…" : "目標を保存"}
                  </button>
                )}
              </div>

              {progress !== null ? (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
                    <span>
                      進捗 {total} / {target} 件
                    </span>
                    <span className="font-bold text-orange-600">{progress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-stone-400">目標を設定すると進捗％が表示されます。</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
