import { FieldConfig } from "@/lib/formSections";
import { RequiredBadge } from "./RequiredBadge";

interface Props {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const baseInputClasses =
  "w-full rounded-lg border bg-white px-4 py-3.5 text-base text-ink placeholder:text-muted/60 " +
  "transition-colors duration-150 focus:outline-none focus:ring-4 " +
  "focus:ring-accent/15 focus:border-accent";

export function FormField({ field, value, onChange, error }: Props) {
  const borderClass = error ? "border-red-400" : "border-line";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-ink">{field.label}</label>
        <RequiredBadge required={field.required} />
      </div>

      {field.type === "select" || field.type === "time-select" ? (
        <select
          className={`${baseInputClasses} ${borderClass} select-caret`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.placeholder ?? "選択してください"}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : "text"}
          className={`${baseInputClasses} ${borderClass}`}
          placeholder={field.placeholder}
          value={value}
          autoComplete={field.autoComplete}
          inputMode={field.inputMode}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.helpText && <p className="text-xs text-muted">{field.helpText}</p>}
      {error && <p className="text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
