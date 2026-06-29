import { MechanicLog } from "@/components/MechanicLog";
import { createClient } from "@/lib/supabase/server";
import type { WorkshopStatus } from "@/components/WorkshopBadge";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Costas · Πλευρά Συνεργείου",
  description:
    "Κατέγραψε εργασίες σέρβις ανά πινακίδα — γρήγορα, από το κινητό, στον χώρο του συνεργείου.",
};

// No auth gate — login is optional. Anonymous mechanics can resolve a plate,
// tap the car, and register a job. When a mechanic IS signed in, we resolve
// their own workshop's verification status (the workshops_select_own RLS policy
// scopes the query to the caller's row) and surface it as a live badge in the
// header. Anonymous use gets no DB-backed status — MechanicLog falls back to the
// static workshop identity from data.ts.
export default async function MechanicPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workshops")
    .select("status")
    .maybeSingle();

  const status = (data?.status ?? undefined) as WorkshopStatus | undefined;

  return (
    <div className="min-h-screen bg-background">
      <MechanicLog workshopStatus={status} />
    </div>
  );
}
