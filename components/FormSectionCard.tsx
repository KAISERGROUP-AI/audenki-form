import { ReactNode } from "react";
import { SectionConfig } from "@/lib/formSections";

export function FormSectionCard({
  section,
  children,
}: {
  section: SectionConfig;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl2 border border-line/70 bg-card p-6 shadow-card md:p-8">
      <div className="mb-6 flex items-start gap-4">
        <span className="font-mono text-2xl font-bold leading-none text-accent/80">
          {section.number}
        </span>
        <div className="flex-1 border-l border-line pl-4">
          <h2 className="text-base font-bold text-ink md:text-lg">{section.title}</h2>
          {section.description && (
            <p className="mt-1 text-xs text-muted md:text-sm">{section.description}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
