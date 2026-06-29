import { redirect } from "next/navigation";
import { MechanicLog } from "@/components/MechanicLog";
import { getSessionRole } from "@/lib/session";
import { getMechanicRecentEntries } from "@/lib/mechanic-actions";

export const metadata = {
  title: "Costas · Πλευρά Συνεργείου",
};

export default async function MechanicPage() {
  const role = await getSessionRole();
  if (!role) redirect("/welcome");
  if (role === "owner") redirect("/");

  const entries = await getMechanicRecentEntries();

  return (
    <div className="min-h-screen bg-background">
      <MechanicLog initialEntries={entries} />
    </div>
  );
}
