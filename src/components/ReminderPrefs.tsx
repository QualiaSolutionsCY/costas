"use client";

import { useActionState } from "react";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";
import { updateReminderPrefs } from "@/lib/reminder-prefs-actions";

// Shared class strings, matching SettingsClient's form surfaces so every
// control on the settings page stays on the design system.
const INPUT =
  "w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-foreground focus:bg-surface";
const LABEL = "block text-xs font-medium text-muted";
const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40";
const CARD = "rounded-xl border bg-surface p-5";

/**
 * Reminder-preferences card (NOTIF-07/08). Server-rendered prefs arrive as a
 * prop; the mutation rides a useActionState server action so the section stays
 * a thin client over the reminder-prefs data seam. When signed out, a muted
 * hint renders in place of the form.
 */
export function ReminderPrefs({
  prefs,
}: {
  prefs: { inApp: boolean; email: boolean; advanceDays: number } | null;
}) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(updateReminderPrefs, {
    ok: false,
    error: false,
  });

  if (prefs === null) {
    return (
      <section className={CARD}>
        <SectionHead title={t.reminderPrefsSection} />
        <p className="mt-3 text-xs text-muted">{t.settingsSignedOutHint}</p>
      </section>
    );
  }

  return (
    <section className={CARD}>
      <SectionHead title={t.reminderPrefsSection} />
      <form action={action} className="mt-4 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="inapp"
            defaultChecked={prefs.inApp}
            className="h-4 w-4 shrink-0 rounded border accent-accent"
          />
          <span className="text-sm font-medium">{t.reminderPrefsInApp}</span>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="email"
            defaultChecked={prefs.email}
            className="h-4 w-4 shrink-0 rounded border accent-accent"
          />
          <span className="text-sm font-medium">{t.reminderPrefsEmail}</span>
        </label>

        <div className="space-y-1.5">
          <label htmlFor="reminders-advance" className={LABEL}>
            {t.reminderPrefsAdvance}
          </label>
          <input
            id="reminders-advance"
            name="advance_days"
            type="text"
            inputMode="numeric"
            defaultValue={prefs.advanceDays}
            className={INPUT}
          />
        </div>

        {state.ok ? (
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-positive">
            <Icon name="check" className="h-4 w-4" />
            {t.reminderPrefsSaved}
          </p>
        ) : state.error ? (
          <p role="alert" className="text-xs font-medium text-negative">{t.errSave}</p>
        ) : null}

        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? (
            <>
              <Icon name="spinner" className="h-4 w-4" />
              {t.saving}
            </>
          ) : (
            t.saveProfile
          )}
        </button>
      </form>
    </section>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
        <Icon name="bell" className="h-4 w-4" />
      </span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  );
}
