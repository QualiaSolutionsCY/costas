import type { Metadata } from "next";
import { getIncomingBookings } from "@/lib/booking-actions";
import { LanguageToggle } from "@/components/LanguageToggle";
import { IncomingBookings } from "@/components/IncomingBookings";

// Reads the live booking queue at request time (Supabase, no caching), so this
// surface must opt out of static rendering (Next 16 — dynamic request data).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Costas · Εισερχόμενα ραντεβού",
  description:
    "Διαχειρίσου τα εισερχόμενα αιτήματα ραντεβού του συνεργείου σου.",
};

/**
 * Workshop-side incoming-bookings surface. Mirrors the /settings shell: a
 * Costas-branded header with the language toggle, then the interactive list.
 * The bilingual title + back link + booking rows all live in the client
 * component so every string stays language-reactive.
 */
export default async function BookingsPage() {
  const bookings = await getIncomingBookings();

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">Costas</span>
          <div className="ml-auto">
            <LanguageToggle />
          </div>
        </header>

        <IncomingBookings bookings={bookings} />
      </div>
    </main>
  );
}
