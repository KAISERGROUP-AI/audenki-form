import { ApplicationStatus, STATUS_STYLES } from "@/lib/statusConfig";

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as ApplicationStatus] ?? "bg-stone-100 text-stone-600 border-stone-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${style}`}>
      {status}
    </span>
  );
}
