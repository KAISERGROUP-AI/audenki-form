export function RequiredBadge({ required }: { required: boolean }) {
  if (required) {
    return (
      <span className="inline-flex items-center rounded-full border border-accent/25 bg-accent-soft px-2 py-0.5 text-[11px] font-bold tracking-wide text-accent">
        必須
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-black/[0.03] px-2 py-0.5 text-[11px] font-bold tracking-wide text-muted">
      任意
    </span>
  );
}
