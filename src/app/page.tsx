import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ServiceLog } from "@/components/ServiceLog";
import { getSessionRole } from "@/lib/session";
import { getOwnerVehicleWithEntries } from "@/lib/owner-actions";

export default async function Home() {
  const role = await getSessionRole();
  if (!role) redirect("/welcome");
  if (role === "mechanic") redirect("/mechanic");

  const { vehicle, entries } = await getOwnerVehicleWithEntries();

  return (
    <AppShell vehicle={vehicle} entries={entries}>
      <ServiceLog vehicle={vehicle} initialEntries={entries} />
    </AppShell>
  );
}
