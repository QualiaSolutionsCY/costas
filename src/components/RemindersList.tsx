"use client";

import { useActionState } from "react";
import { useLang } from "./LanguageProvider";
import { Icon } from "./icons";
import { type Reminder } from "@/lib/reminders";
import { dismissReminder } from "@/lib/notification-actions";

// dd/mm/yyyy from an ISO `YYYY-MM-DD`, mirroring ServiceLog's local helper.
function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/**
 * Owner reminders surface. Carries its own title block (the /reminders page is
 * a server component, so the bilingual heading lives here in client context).
 * Each reminder renders the kind, plate, a colour-coded status line (overdue →
 * negative, soon → accent, upcoming → muted) and a Dismiss form wired to the
 * dismissReminder server action. Empty state mirrors the dashed-card pattern
 * from SettingsClient. Tokens only.
 */
export function RemindersList({ reminders }: { reminders: Reminder[] }) {
  const { t } = useLang();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{t.remindersTitle}</h1>
        <p className="mt-1 text-sm text-muted">{t.remindersSubtitle}</p>
      </div>

      {reminders.length === 0 ? (
        <div className="grid place-items-center rounded-xl border border-dashed bg-surface py-14 text-center">
          <Icon name="check" className="h-6 w-6 text-positive" />
          <p className="mt-2 max-w-xs text-sm text-muted">{t.remindersEmpty}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reminders.map((r) => (
            <ReminderRow
              key={`${r.vehicleId}-${r.kind}-${r.dueOn}`}
              reminder={r}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReminderRow({ reminder }: { reminder: Reminder }) {
  const { t } = useLang();
  const [state, action, pending] = useActionState(dismissReminder, { ok: false, error: false });

  const isMot = reminder.kind === "mot";
  const title = isMot ? t.reminderMot : t.reminderService;

  // Colour-code the status line off the computed status: overdue → negative,
  // soon → accent, upcoming → muted.
  const overdue = reminder.status === "overdue";
  const statusClass = overdue
    ? "text-negative"
    : reminder.status === "soon"
      ? "text-accent"
      : "text-muted";
  const statusText = overdue
    ? t.reminderOverdue(Math.abs(reminder.daysUntil))
    : t.reminderInDays(reminder.daysUntil);

  return (
    <li className="rounded-xl border bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/15">
          <Icon name={isMot ? "shield" : "history"} className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">{title}</p>
            <div className="flex items-center gap-2">
              {state.error ? (
                <span className="text-[11px] font-medium text-negative">{t.errSave}</span>
              ) : null}
              <form action={action}>
                <input type="hidden" name="vehicle_id" value={reminder.vehicleId} />
                <input type="hidden" name="reminder_kind" value={reminder.kind} />
                <input type="hidden" name="due_on" value={reminder.dueOn} />
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-2 disabled:opacity-40"
                >
                  {pending ? (
                    <Icon name="spinner" className="h-3.5 w-3.5" />
                  ) : null}
                  {t.reminderDismiss}
                </button>
              </form>
            </div>
          </div>

          <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-muted">
            {reminder.vehiclePlate}
          </p>

          <p className={`mt-2 text-xs font-medium ${statusClass}`}>
            {statusText}
            <span className="text-muted"> · {t.reminderDueOn(formatDate(reminder.dueOn))}</span>
          </p>

          {reminder.lastServicedOn ? (
            <p className="mt-1 text-xs text-muted">
              {t.reminderBasedOn(formatDate(reminder.lastServicedOn))}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
