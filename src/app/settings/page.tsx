import { getProfile } from "@/lib/profile-actions";
import { getReminderPrefs } from "@/lib/reminder-prefs-actions";
import { getVehicles } from "@/lib/owner-actions";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SettingsClient, BackToLogLink } from "@/components/SettingsClient";

// Reads session-scoped profile + cookies at request time, so it must opt out
// of static rendering (Next 16 — dynamic surfaces that read cookies/session).
export const dynamic = "force-dynamic";

/**
 * Account settings surface. Mirrors the /admin shell: a Costas-branded header
 * with the language toggle and a bilingual back link, then the interactive
 * client. The profile + vehicle reads happen server-side through the existing
 * data seams so the client never touches Supabase directly.
 */
export default async function SettingsPage() {
  const profile = await getProfile();
  const vehicles = await getVehicles();
  const reminderPrefs = await getReminderPrefs();

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

        <SettingsClient
          profile={profile}
          vehicles={vehicles}
          reminderPrefs={reminderPrefs}
        />
      </div>
    </main>
  );
}
