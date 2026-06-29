"use client";

import { useLang } from "@/components/LanguageProvider";
import { Icon } from "@/components/icons";

/**
 * Bilingual sign-out trigger. Rendered inside a `<form action={signOut}>` server
 * action, so the click submits the form — no client-side handler needed. Lives
 * in its own component purely to read the translated label via useLang().
 */
export function SignOutButton() {
  const { t } = useLang();
  return (
    <button
      type="submit"
      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2"
    >
      <Icon name="key" className="h-3.5 w-3.5 text-muted" />
      {t.signOut}
    </button>
  );
}
