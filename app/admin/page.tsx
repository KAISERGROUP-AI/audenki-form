"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusEditor } from "@/components/admin/StatusEditor";

type AdminRole = "editor" | "viewer";

interface Application {
  id: string;
  created_at: string;
  company_name: string;
  staff_name: string;
  link_date: string;
  plan: string;
  desired_start_date: string;
  contractor_name: string;
  contractor_name_kana: string;
  phone_number: string;
  status: string;
  status_note: string | null;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<{ username: string; role: AdminRole } | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyOptions, setCompanyOptions] = useState<string[]>([]);
  const [companyFilter, setCompanyFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const loadApplications = useCallback(async (company: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const url = company
        ? `/api/admin/applications?company=${encodeURIComponent(company)}`
        : "/api/admin/applications";
      const res = await fetch(url);
      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrorMessage(result.error ?? "取得に失敗しました。");
        setApplications([]);
      } else {
        setApplications(result.applications);
      }
    } catch {
      setErrorMessage("通信エラーが発生しました。");
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

      const companiesRes = await fetch("/api/admin/companies");
      if (companiesRes.ok) {
        const companiesResult = await companiesRes.json();
        setCompanyOptions(companiesResult.companies.map((c: { companyName: string }) => c.companyName));
      }

      await loadApplications("");
    })();
  }, [loadApplications]);

  function handleFilterChange(value: string) {
    setCompanyFilter(value);
    loadApplications(value);
  }

  function handleStatusUpdated(id: string, newStatus: string, warning?: string) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    setWarningMessage(warning ?? null);
  }

  if (!user) {
    return <div className="p-8 text-sm text-stone-500">読み込み中…</div>;
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      <AdminHeader username={user.username} role={user.role} />

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-stone-800">案件一覧</h1>
          <select
            value={companyFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">すべての会社</option>
            {companyOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {warningMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-700">
            {warningMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-stone-500">読み込み中…</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-stone-500">該当する案件がありません。</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs text-stone-500">
                  <th className="px-4 py-3 font-bold">会社名</th>
                  <th className="px-4 py-3 font-bold">担当者</th>
                  <th className="px-4 py-3 font-bold">契約者名</th>
                  <th className="px-4 py-3 font-bold">プラン</th>
                  <th className="px-4 py-3 font-bold">使用開始希望日</th>
                  <th className="px-4 py-3 font-bold">連携日</th>
                  <th className="px-4 py-3 font-bold">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-stone-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-stone-800">{app.company_name}</td>
                    <td className="px-4 py-3 text-stone-600">{app.staff_name}</td>
                    <td className="px-4 py-3 text-stone-600">{app.contractor_name}</td>
                    <td className="px-4 py-3 text-stone-600">{app.plan}</td>
                    <td className="px-4 py-3 text-stone-600">{app.desired_start_date}</td>
                    <td className="px-4 py-3 text-stone-600">{app.link_date}</td>
                    <td className="px-4 py-3">
                      {user.role === "editor" ? (
                        <StatusEditor
                          applicationId={app.id}
                          currentStatus={app.status}
                          onUpdated={(newStatus, warning) => handleStatusUpdated(app.id, newStatus, warning)}
                        />
                      ) : (
                        <StatusBadge status={app.status} />
                      )}
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
