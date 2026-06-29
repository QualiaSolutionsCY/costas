import { AppShell } from "@/components/AppShell";
import { ServiceLog } from "@/components/ServiceLog";
import { FirstVisitGate } from "@/components/FirstVisitGate";
import { getVehicles, getEntries } from "@/lib/owner-actions";
import { getVerifiedWorkshopNames } from "@/lib/workshop-status";

// No auth gate — the owner flow is anonymous. getVehicles() returns every
// vehicle; we hydrate the first one's history server-side and let the client
// swap on a vehicle switch.
export default async function Home() {
  const vehicles = await getVehicles();
  const firstId = vehicles[0]?.id ?? null;
  const entries = firstId ? await getEntries(firstId) : [];
  const verified = await getVerifiedWorkshopNames();

  return (
    <>
      <FirstVisitGate />
      <AppShell vehicles={vehicles}>
        <ServiceLog
          vehicles={vehicles}
          initialEntries={entries}
          verifiedWorkshops={[...verified]}
        />
      </AppShell>
    </>
  );
}
