import type { Metadata } from "next";
import { getOwnerBookings } from "@/lib/booking-actions";
import { getVerifiedWorkshopNames } from "@/lib/workshop-status";
import { getVehicles } from "@/lib/owner-actions";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BackToLogLink } from "@/components/SettingsClient";
import { BookingForm } from "@/components/BookingForm";

// Reads the session-scoped bookings + verified-workshop list at request time, so
// it must opt out of static rendering (Next 16 — dynamic session/cookie reads).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Costas · Κλείσε ραντεβού",
  description: "Κλείσε ραντεβού σέρβις με πιστοποιημένο συνεργείο κοντά σου.",
};

/**
 * OWNER booking surface. Mirrors the /settings shell — a Costas-branded header
 * with the language toggle and a back link — then the interactive BookingForm.
 * The workshop names, vehicles, and existing bookings are read server-side
 * through the existing data seams so the client never touches Supabase directly.
 */
export default async function BookPage() {
  // getVerifiedWorkshopNames returns a Set<string> of lowercased names; the
  // datalist option order is cosmetic so the raw set is fine for the demo.
  const workshops = [...(await getVerifiedWorkshopNames())].map((n) => n);
  const bookings = await getOwnerBookings();
  const vehicles = await getVehicles();

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

        <BookingForm
          workshops={workshops}
          vehicles={vehicles}
          bookings={bookings}
        />
      </div>
    </main>
  );
}
