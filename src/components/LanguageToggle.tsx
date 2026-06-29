"use client";

import { useLang } from "./LanguageProvider";
import type { Lang } from "@/lib/i18n";

const options: { value: Lang; label: string }[] = [
  { value: "el", label: "ΕΛ" },
  { value: "en", label: "EN" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex items-center rounded-lg border p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setLang(o.value)}
          aria-pressed={lang === o.value}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            lang === o.value ? "bg-foreground text-surface" : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
