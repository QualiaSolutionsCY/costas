"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser, getSessionRole } from "@/lib/session";
import { SERVICE_CODES } from "@/lib/services";

// A recent workshop entry, flattened for the mechanic list. `plate` is resolved
// from the joined vehicle so the UI never sees raw vehicle_ids.
export type MechanicEntry = {
  id: string;
  service_code: string;
  plate: string;
  serviced_on: string;
};

/**
 * Recent workshop jobs created by the current user, newest first. RLS scopes
 * the rows to created_by = auth.uid(); the embedded vehicles(plate) join
 * resolves the plate in a single round-trip. Returns [] when unauthenticated
 * or on error, so the caller can render the empty state without throwing.
 */
export async function getMechanicRecentEntries(): Promise<MechanicEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("service_entries")
    .select("id, service_code, serviced_on, vehicles(plate)")
    .order("serviced_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    service_code: row.service_code,
    serviced_on: row.serviced_on,
    plate: row.vehicles?.plate ?? "",
  }));
}

export type JobState = { ok: boolean; error: string | null };

const jobSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1)
    .transform((p) => p.toUpperCase()),
  service_code: z.enum(SERVICE_CODES),
  serviced_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Logs a workshop job against a vehicle resolved by plate. For useActionState:
 * validates the form, authorizes the caller as a mechanic, resolves the
 * vehicle, inserts a `workshop_job` service entry, and revalidates the list.
 * Returns a discriminated error code ('plate' | 'save') the UI maps to copy.
 */
export async function logMechanicJob(
  _prevState: JobState,
  formData: FormData,
): Promise<JobState> {
  const parsed = jobSchema.safeParse({
    plate: formData.get("plate"),
    service_code: formData.get("service_code"),
    serviced_on: formData.get("serviced_on"),
  });
  if (!parsed.success) return { ok: false, error: "save" };

  const user = await getUser();
  const role = await getSessionRole();
  if (!user || role !== "mechanic") return { ok: false, error: "save" };

  const supabase = await createClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate", parsed.data.plate)
    .maybeSingle();

  if (vehicleError) return { ok: false, error: "save" };
  if (!vehicle) return { ok: false, error: "plate" };

  const { error: insertError } = await supabase.from("service_entries").insert({
    kind: "workshop_job",
    created_by: user.id,
    vehicle_id: vehicle.id,
    service_code: parsed.data.service_code,
    serviced_on: parsed.data.serviced_on,
  });

  if (insertError) return { ok: false, error: "save" };

  revalidatePath("/mechanic");
  return { ok: true, error: null };
}
