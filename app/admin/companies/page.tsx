"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";

type AdminRole = "editor" | "viewer";

interface CompanyContact {
  companyName: string;
  contactEmail: string;
  viewToken: string | null;
}

export default function AdminCompaniesPage() {
  const [user, setUser] = useState<{ username: string; role: AdminRole } | null>(null);
  const [companies, setCompanies] = useState<CompanyContact[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState<string | null>(null);
  const [generatingCompany, setGeneratingCompany] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copiedCompany, setCopiedCompany] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");

  async function load() {
    setLoading(true);
    const meRes = await fetch("/api/admin/me");
    if (meRes.ok) {
      const meResult = await meRes.json();
      setUser(meResult.user);
    }
    const res = await fetch("/api/admin/companies");
    if (res.ok) {
      const result = await res.json();
      setCompanies(result.companies);
      const initialDrafts: Record<string, string> = {};
      for (const c of result.companies) initialDrafts[c.companyName] = c.contactEmail;
      setDrafts(initialDrafts);
    }
    setLoading(false);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    load();
  }, []);

  async function handleAddCompany() {
    if (!newCompanyName.trim() || !newCompanyEmail.trim()) return;
    setSavingCompany(newCompanyName);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: newCompanyName.trim(), contactEmail: newCompanyEmail.trim() }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setMessage(result.error ?? "会社の登録に失敗しました。");
      } else {
        setMessage(`「${newCompanyName.trim()}」を登録しました。`);
        setNewCompanyName("");
        setNewCompanyEmail("");
        await load();
      }
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setSavingCompany(null);
    }
  }

  async function handleSave(companyName: string) {
    setSavingCompany(companyName);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactEmail: drafts[companyName] }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setMessage(result.error ?? "保存に失敗しました。");
      } else {
        setMessage(`「${companyName}」の連絡先を保存しました。`);
        setCompanies((prev) =>
          prev.map((c) => (c.companyName === companyName ? { ...c, contactEmail: drafts[companyName] } : c))
        );
      }
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setSavingCompany(null);
    }
  }

  async function handleGenerateLink(companyName: string) {
    setGeneratingCompany(companyName);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/companies/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setMessage(result.error ?? "リンクの発行に失敗しました。");
      } else {
        setCompanies((prev) =>
          prev.map((c) => (c.companyName === companyName ? { ...c, viewToken: result.viewToken } : c))
        );
        setMessage(`「${companyName}」の進捗確認リンクを発行しました。`);
      }
    } catch {
      setMessage("通信エラーが発生しました。");
    } finally {
      setGeneratingCompany(null);
    }
  }

  function buildViewUrl(viewToken: string) {
    return `${origin}/view/${viewToken}`;
  }

  async function handleCopy(companyName: string, viewToken: string) {
    try {
      await navigator.clipboard.writeText(buildViewUrl(viewToken));
      setCopiedCompany(companyName);
      setTimeout(() => setCopiedCompany(null), 2000);
    } catch {
      setMessage("コピーに失敗しました。リンクを手動で選択してコピーしてください。");
    }
  }

  if (!user) {
    return <div className="p-8 text-sm text-stone-500">読み込み中…</div>;
  }

  return (
    <div className="min-h-dvh bg-stone-50">
      <AdminHeader username={user.username} role={user.role} />

      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-lg font-bold text-stone-800">会社連絡先・進捗確認リンク</h1>
        <p className="mt-1 text-sm text-stone-500">
          「通知先メール」は、ステータスが「③返却」になったときの連絡先です。<br />
          「進捗確認リンク」は、会社側に共有すると進捗ステータスと件数だけを閲覧できる専用ページ（編集不可）です。
        </p>

        {user.role === "editor" && (
          <div className="mt-6 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
            <input
              type="text"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="新しい会社名（例：株式会社◯◯）"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={newCompanyEmail}
              onChange={(e) => setNewCompanyEmail(e.target.value)}
              placeholder="通知先メールアドレス"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddCompany}
              disabled={!newCompanyName.trim() || !newCompanyEmail.trim() || savingCompany === newCompanyName}
              className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              会社を登録
            </button>
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3 text-sm font-medium text-stone-700">
            {message}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-sm text-stone-500">読み込み中…</p>
        ) : companies.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">まだ会社データがありません。</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {companies.map((c) => (
              <div key={c.companyName} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="font-bold text-stone-800">{c.companyName}</div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="w-28 shrink-0 text-xs text-stone-500">通知先メール</span>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="email"
                      value={drafts[c.companyName] ?? ""}
                      onChange={(e) => setDrafts((prev) => ({ ...prev, [c.companyName]: e.target.value }))}
                      disabled={user.role !== "editor"}
                      placeholder="通知先メールアドレス"
                      className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm disabled:bg-stone-50"
                    />
                    {user.role === "editor" && (
                      <button
                        onClick={() => handleSave(c.companyName)}
                        disabled={savingCompany === c.companyName}
                        className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {savingCompany === c.companyName ? "保存中…" : "保存"}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <span className="w-28 shrink-0 text-xs text-stone-500">進捗確認リンク</span>
                  <div className="flex flex-1 items-center gap-2">
                    {c.viewToken ? (
                      <>
                        <input
                          type="text"
                          readOnly
                          value={buildViewUrl(c.viewToken)}
                          className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-600"
                        />
                        <button
                          onClick={() => handleCopy(c.companyName, c.viewToken!)}
                          className="shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                        >
                          {copiedCompany === c.companyName ? "コピーしました" : "コピー"}
                        </button>
                      </>
                    ) : (
                      <span className="flex-1 text-xs text-stone-400">未発行</span>
                    )}
                    {user.role === "editor" && (
                      <button
                        onClick={() => handleGenerateLink(c.companyName)}
                        disabled={generatingCompany === c.companyName}
                        className="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 disabled:opacity-60"
                      >
                        {generatingCompany === c.companyName
                          ? "発行中…"
                          : c.viewToken
                          ? "再発行"
                          : "リンクを発行"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
