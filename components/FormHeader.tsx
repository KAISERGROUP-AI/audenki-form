export type Step = "input" | "confirm" | "complete";

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: "input", label: "入力" },
  { key: "confirm", label: "確認" },
  { key: "complete", label: "完了" },
];

export function FormHeader({ step }: { step: Step }) {
  const currentIndex = STEP_LABELS.findIndex((s) => s.key === step);

  return (
    <header className="border-b border-line/80 bg-white">
      <div className="mx-auto max-w-2xl px-5 pb-6 pt-8 md:px-8 md:pt-12">
        <p className="font-mono text-[11px] font-bold tracking-[0.2em] text-accent">
          APPLICATION FORM
        </p>
        <h1 className="mt-2 text-[22px] font-bold leading-snug text-ink md:text-3xl">
          auでんき申し込みフォーム連携
        </h1>
        <p className="mt-2 text-sm text-muted md:text-base">
          お客様の申込情報をご入力ください
        </p>

        <ol className="mt-7 flex items-center gap-2">
          {STEP_LABELS.map((s, i) => {
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <li key={s.key} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isDone
                        ? "bg-accent text-white"
                        : isCurrent
                        ? "bg-accent-soft text-accent ring-2 ring-accent"
                        : "bg-black/[0.04] text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-xs font-bold md:text-sm ${
                      isCurrent ? "text-ink" : isDone ? "text-ink/70" : "text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <span
                    className={`h-px flex-1 ${i < currentIndex ? "bg-accent" : "bg-line"}`}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </header>
  );
}
