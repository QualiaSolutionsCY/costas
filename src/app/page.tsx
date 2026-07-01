import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ServiceLog } from "@/components/ServiceLog";
import { SplashGate } from "@/components/SplashGate";
import { getVehicles, getEntries } from "@/lib/owner-actions";
import { getVerifiedWorkshopNames } from "@/lib/workshop-status";
import { getReminderBadgeCount } from "@/lib/reminders";

// Reads request-time searchParams (?v={id}) to scope the active vehicle, so the
// page must opt out of static rendering.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Costas · Το ιστορικό του αυτοκινήτου σου",
  description:
    "Κατέγραψε και παρακολούθησε το πλήρες ιστορικό σέρβις του αυτοκινήτου σου.",
};

// No auth gate — the owner flow is anonymous. getVehicles() returns every
// vehicle; the ?v={id} searchParam picks the active one (server-side, no
// localStorage — avoids a hydration mismatch). We hydrate that vehicle's
// history server-side and let the client swap on a vehicle switch.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;
  const vehicles = await getVehicles();
  const activeId =
    v && vehicles.some((x) => x.id === v) ? v : (vehicles[0]?.id ?? null);
  const entries = activeId ? await getEntries(activeId) : [];
  const verified = await getVerifiedWorkshopNames();
  const reminderCount = await getReminderBadgeCount(vehicles, { advanceDays: 30 });

  return (
    <>
      <SplashGate />
      <AppShell vehicles={vehicles} reminderCount={reminderCount}>
        <ServiceLog
          vehicles={vehicles}
          initialEntries={entries}
          verifiedWorkshops={[...verified]}
          activeVehicleId={activeId}
        />
      </AppShell>
    </>
  );
}
