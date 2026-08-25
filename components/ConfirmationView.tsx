import { AudenkiFormData } from "@/lib/types";
import { FORM_SECTIONS } from "@/lib/formSections";
import { getByPath } from "@/lib/paths";

interface Props {
  data: AudenkiFormData;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  errorMessage?: string | null;
}

function displayValue(field: { path: string; options?: { value: string; label: string }[] }, data: AudenkiFormData) {
  const raw = getByPath(data, field.path);
  if (!raw) return "—";
  const opt = field.options?.find((o) => o.value === raw);
  return opt ? opt.label : raw;
}

export function ConfirmationView({ data, onBack, onConfirm, submitting, errorMessage }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl2 border border-accent/20 bg-accent-soft/60 p-5 text-sm text-ink md:p-6">
        内容をご確認のうえ、よろしければ「この内容で送信する」を押してください。
      </div>

      {FORM_SECTIONS.map((section) => (
        <section
          key={section.number}
          className="rounded-xl2 border border-line/70 bg-card p-6 shadow-card md:p-8"
        >
          <div className="mb-4 flex items-center gap-3 border-b border-line pb-3">
            <span className="font-mono text-lg font-bold text-accent/80">{section.number}</span>
            <h3 className="text-sm font-bold text-ink md:text-base">{section.title}</h3>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.path} className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted">{field.label}</dt>
                <dd className="text-sm font-medium text-ink break-words">
                  {displayValue(field, data)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {errorMessage && (
        <div className="rounded-xl2 border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 rounded-xl bg-gradient-to-b from-accent to-accent-dark px-6 py-4 text-base font-bold text-white shadow-cta transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "送信しています…" : "この内容で送信する"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 rounded-xl border border-line bg-white px-6 py-4 text-base font-bold text-ink transition-colors hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          修正する
        </button>
      </div>
    </div>
  );
}
