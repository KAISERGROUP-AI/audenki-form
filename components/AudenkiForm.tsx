"use client";

import { useState, useEffect } from "react";
import { AudenkiFormData, emptyFormData } from "@/lib/types";
import { FORM_SECTIONS, FieldConfig, SectionConfig } from "@/lib/formSections";
import { getByPath, setByPath } from "@/lib/paths";
import { FormHeader, Step } from "./FormHeader";
import { FormSectionCard } from "./FormSectionCard";
import { FormField } from "./FormField";
import { ConfirmationView } from "./ConfirmationView";
import { CompletionView } from "./CompletionView";

export function AudenkiForm() {
  const [step, setStep] = useState<Step>("input");
  const [data, setData] = useState<AudenkiFormData>(emptyFormData());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [companyOptions, setCompanyOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/companies");
        const result = await res.json();
        if (res.ok && result.success) {
          const options = (result.companies as string[]).map((name) => ({ value: name, label: name }));
          setCompanyOptions(options);
        }
      } catch {
        // 取得できなくてもフォーム自体は使えるようにしておく（空のプルダウンになる）
      }
    })();
  }, []);

  function updateField(path: string, value: string) {
    setData((prev) => setByPath(prev, path, value));
    if (fieldErrors[path]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    }
  }

  function validateAll(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const section of FORM_SECTIONS) {
      for (const field of section.fields) {
        if (field.required) {
          const value = getByPath(data, field.path);
          if (!value || value.trim() === "") {
            errors[field.path] = `${field.label}を入力してください。`;
          }
        }
      }
    }
    setFieldErrors(errors);
    return errors;
  }

  function handleGoToConfirm() {
    const errors = validateAll();
    const firstErrorPath = Object.keys(errors)[0];
    if (firstErrorPath) {
      const el = document.getElementById(`field-${firstErrorPath}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setSubmitError(result.error ?? "送信に失敗しました。時間をおいて再度お試しください。");
        setSubmitting(false);
        return;
      }

      if (result.warning) {
        setWarning(result.warning);
      }
      setStep("complete");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError("通信エラーが発生しました。ネットワーク状況をご確認のうえ再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  function resolveField(field: FieldConfig): FieldConfig {
    if (field.path === "companyName") {
      return { ...field, options: companyOptions };
    }
    return field;
  }

  return (
    <div className="min-h-dvh bg-paper pb-16">
      <FormHeader step={step} />

      <main className="mx-auto max-w-2xl px-5 pt-8 md:px-8">
        {step === "input" && (
          <div className="flex flex-col gap-5">
            {FORM_SECTIONS.map((section: SectionConfig) => (
              <FormSectionCard key={section.number} section={section}>
                {section.fields.map((rawField) => {
                  const field = resolveField(rawField);
                  return (
                    <div id={`field-${field.path}`} key={field.path} className="scroll-mt-24">
                      <FormField
                        field={field}
                        value={getByPath(data, field.path)}
                        onChange={(v) => updateField(field.path, v)}
                        error={fieldErrors[field.path]}
                      />
                    </div>
                  );
                })}
              </FormSectionCard>
            ))}

            <button
              type="button"
              onClick={handleGoToConfirm}
              className="mt-2 w-full rounded-xl bg-gradient-to-b from-accent to-accent-dark px-6 py-4 text-base font-bold text-white shadow-cta transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              入力内容を確認する
            </button>
          </div>
        )}

        {step === "confirm" && (
          <ConfirmationView
            data={data}
            onBack={() => {
              setStep("input");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onConfirm={handleSubmit}
            submitting={submitting}
            errorMessage={submitError}
          />
        )}

        {step === "complete" && <CompletionView warning={warning} />}
      </main>
    </div>
  );
}
