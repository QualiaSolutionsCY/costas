import { AppShell } from "@/components/AppShell";
import { ServiceLog } from "@/components/ServiceLog";

export default function Home() {
  return (
    <AppShell>
      <ServiceLog />
    </AppShell>
  );
}
