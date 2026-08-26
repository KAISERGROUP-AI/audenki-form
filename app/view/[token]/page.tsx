"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { APPLICATION_STATUSES } from "@/lib/statusConfig";
import { StatusBadge } from "@/components/admin/StatusBadge";

interface Application {
  id: string;
  created_at: string;
  contractor_name: string;
  plan: string;
  desired_start_date: string;
  status: string;
}

interface ViewData {
  companyName: string;
  yearMonth: string;
  totalCount: number;
  counts: Record<string, number>;
  applications: Application[];
  lastMonthCount: number;
}

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function calcProgress(count: number, target: number): number | null {
  if (target <= 0) {
    return null;
  }
  const raw = (count / target) * 1000;
  const rounded = Math.round(raw) / 10;
  return Math.min(200, rounded);
}

export default function CompanyProgressViewPage() {
  const params = useParams<{ token: string }>();
  const [month, setMonth] = useState(currentYearMonth());
  const [data, setData] = useState<ViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/view/${params.token}?month=${m}`);
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error ?? "このリンクは無効です。");
      } else {
        setData(result);
      }
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  useEffect(() => {
    load(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleMonthChange(value: string) {
    setMonth(value);
    load(value);
  }

  if (loading) {
    return <div className="p-8 text-sm text-stone-500">読み込み中…</div>;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-5">
        <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-red-600">{error ?? "このリンクは無効です。"}</p>
        </div>
      </div>
    );
  }

  const compareProgress = calcProgress(data.totalCount, data.lastMonthCount);

  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-6">
          <p className="text-xs font-bold tracking-wide text-orange-600">PROGRESS VIEW</p>
          <h1 className="mt-1 text-lg font-bold text-stone-800">{data.companyName} 様 進捗確認ページ</h1>
          <p className="mt-1 text-sm text-stone-500">こちらは閲覧専用ページです（編集はできません）</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-6 flex justify-end">
          <input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-xs text-stone-500">総件数</p>
            <p className="mt-1 text-2xl font-bold text-stone-800">{data.totalCount}</p>
          </div>
          {APPLICATION_STATUSES.map((status) => (
            <div key={status} className="rounded-xl border border-stone-200 bg-white p-4 text-center">
              <p className="text-xs text-stone-500">{status}</p>
              <p className="mt-1 text-2xl font-bold text-stone-800">{data.counts[status] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-stone-200 bg-white p-5">
          <p className="text-sm font-bold text-stone-800">先月との比較</p>
          <p className="mt-1 text-xs text-stone-500">
            先月（{data.lastMonthCount}件） → 今月（{data.totalCount}件）
          </p>
          {compareProgress !== null ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
                <span>先月比</span>
                <span
                  className={`font-bold ${compareProgress >= 100 ? "text-green-600" : "text-orange-600"}`}
                >
                  {compareProgress}%
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={`h-full rounded-full ${
                    compareProgress >= 100 ? "bg-green-500" : "bg-orange-500"
                  }`}
                  style={{ width: `${Math.min(100, compareProgress)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-stone-400">先月の件数が0件のため比較できません。</p>
          )}
        </div>

        {data.applications.length === 0 ? (
          <p className="text-sm text-stone-500">この月の申し込みはまだありません。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                  <th className="px-4 py-3 font-bold">契約者名</th>
                  <th className="px-4 py-3 font-bold">プラン</th>
                  <th className="px-4 py-3 font-bold">使用開始希望日</th>
                  <th className="px-4 py-3 font-bold">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {data.applications.map((app) => (
                  <tr key={app.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-800">{app.contractor_name}</td>
                    <td className="px-4 py-3 text-stone-600">{app.plan}</td>
                    <td className="px-4 py-3 text-stone-600">{app.desired_start_date}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
