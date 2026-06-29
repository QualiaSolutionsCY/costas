"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { SERVICE_CODES } from "@/lib/services";
import { normalizePlate } from "@/lib/plate";

// A single service entry on a vehicle's history, flattened for the mechanic
// timeline. The persisted `service_code` is language-stable; the UI localizes it.
export type MechanicEntry = {
  id: string;
  service_code: string;
  serviced_on: string;
  kind: string;
};

/**
 * The full service history for a plate, newest first. Resolves the vehicle by
 * normalized plate; returns [] when no such vehicle exists (or on error) so the
 * caller renders the empty state without throwing. Anonymous selects are allowed
 * by RLS, so this works whether or not the caller is signed in.
 */
export async function getPlateHistory(plate: string): Promise<MechanicEntry[]> {
  const normalized = normalizePlate(plate);
  if (!normalized) return [];

  const supabase = await createClient();

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate", normalized)
    .maybeSingle();

  if (vehicleError || !vehicle) return [];

  const { data, error } = await supabase
    .from("service_entries")
    .select("id, service_code, serviced_on, kind")
    .eq("vehicle_id", vehicle.id)
    .order("serviced_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    service_code: row.service_code,
    serviced_on: row.serviced_on,
    kind: row.kind,
  }));
}

export type JobState = { ok: boolean; error: string | null };

const jobSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1)
    .transform(normalizePlate),
  service_code: z.enum(SERVICE_CODES),
  serviced_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Logs a workshop job against a vehicle resolved by plate. For useActionState:
 * validates the form, resolves the vehicle (creating it if the plate is unknown),
 * inserts a `workshop_job` service entry, and revalidates the mechanic view.
 * Login is OPTIONAL — created_by / owner_id fall back to null for anonymous use.
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
  const supabase = await createClient();

  // Resolve the vehicle by plate; create it on first sighting so an unknown
  // plate still gets a history. owner_id is null for anonymous registrations.
  const { data: existing, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id")
    .eq("plate", parsed.data.plate)
    .maybeSingle();

  if (vehicleError) return { ok: false, error: "save" };

  let vehicleId = existing?.id;

  if (!vehicleId) {
    const { data: created, error: createError } = await supabase
      .from("vehicles")
      .insert({
        plate: parsed.data.plate,
        model: null,
        owner_id: user?.id ?? null,
      } as never)
      .select("id")
      .single();

    if (createError || !created) return { ok: false, error: "save" };
    vehicleId = created.id;
  }

  const { error: insertError } = await supabase.from("service_entries").insert({
    vehicle_id: vehicleId,
    kind: "workshop_job",
    service_code: parsed.data.service_code,
    serviced_on: parsed.data.serviced_on,
    created_by: user?.id ?? null,
  } as never);

  if (insertError) return { ok: false, error: "save" };

  revalidatePath("/mechanic");
  return { ok: true, error: null };
}
