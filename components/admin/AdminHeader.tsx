"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type AdminRole = "editor" | "viewer";

export function AdminHeader({ username, role }: { username: string; role: AdminRole }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const linkClass = (href: string) =>
    `text-sm font-bold ${pathname === href ? "text-orange-600" : "text-stone-500 hover:text-stone-800"}`;

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-stone-800">顧客管理表</span>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className={linkClass("/admin")}>
              案件一覧
            </Link>
            <Link href="/admin/companies" className={linkClass("/admin/companies")}>
              会社連絡先
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500">
            {username}（{role === "editor" ? "編集者" : "閲覧者"}）
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
