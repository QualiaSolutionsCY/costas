import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * The set of currently-verified workshop names, lowercased + trimmed for
 * matching. The owner side has no FK from `service_entries.place` (free text)
 * to a workshop, so resolving a history entry's `place` against this set is the
 * only honest way to badge it "verified". Centralized here so the owner page
 * stays a thin wiring layer. Returns an empty Set on error — never throws.
 */
export async function getVerifiedWorkshopNames(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select("name")
    .eq("status", "verified");

  if (error || !data) return new Set();

  return new Set(data.map((r) => r.name.toLowerCase().trim()));
}
