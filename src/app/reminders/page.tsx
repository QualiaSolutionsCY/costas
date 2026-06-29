import type { Metadata } from "next";
import { getVehicles } from "@/lib/owner-actions";
import { getRemindersForVehicles } from "@/lib/reminders";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BackToLogLink } from "@/components/SettingsClient";
import { RemindersList } from "@/components/RemindersList";

// Reads session-scoped vehicles + cookies at request time, so it must opt out
// of static rendering (Next 16 — dynamic surfaces that read cookies/session).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Costas · Υπενθυμίσεις",
  description: "Δες τις επερχόμενες υπενθυμίσεις σέρβις για τα οχήματά σου.",
  robots: { index: false },
};

/**
 * Owner reminders surface. Mirrors the /settings shell: a Costas-branded header
 * with the language toggle and a bilingual back link, then the reminders body.
 * Vehicles are read server-side through the owner data seam; the reminder
 * computation (MOT-due + next-service, filtered to the advance window) happens
 * in getRemindersForVehicles. The titled body lives in RemindersList because
 * the page is a server component and the bilingual strings need client context.
 */
export default async function RemindersPage() {
  const vehicles = await getVehicles();
  const reminders = await getRemindersForVehicles(vehicles, { advanceDays: 30 });

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">Costas</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <BackToLogLink />
          </div>
        </header>

        <RemindersList reminders={reminders} />
      </div>
    </main>
  );
}
