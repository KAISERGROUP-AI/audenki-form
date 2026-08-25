export function CompletionView({ warning }: { warning?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl2 border border-line/70 bg-card p-10 text-center shadow-card md:p-14">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-bold text-ink md:text-2xl">
          お申し込み連携が完了しました
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
          ご入力ありがとうございました。
          <br />
          担当者へ申込情報を連携しました。
        </p>
      </div>

      {warning && (
        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
          {warning}
        </div>
      )}
    </div>
  );
}
