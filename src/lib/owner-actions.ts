"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole, getUser } from "@/lib/session";
import { SERVICE_CODES } from "@/lib/services";

// Owner-side data seam. Reads the signed-in owner's vehicle + service history
// straight from Supabase (RLS scopes every query to the caller's own rows) and
// writes new owner-logged services back. This is the only file that knows the
// `vehicles` / `service_entries` table shapes for the owner flow.

export type OwnerVehicle = { id: string; model: string; plate: string };

export type OwnerEntry = {
  id: string;
  service_code: string;
  note: string | null;
  place: string | null;
  serviced_on: string;
  kind: string;
};

/**
 * Server read for the owner home: the signed-in user's vehicle (RLS returns
 * only rows they own — we take the first) and its service entries, newest
 * first. Returns a null vehicle (and empty entries) when the user owns none.
 */
export async function getOwnerVehicleWithEntries(): Promise<{
  vehicle: OwnerVehicle | null;
  entries: OwnerEntry[];
}> {
  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, model, plate")
    .limit(1)
    .maybeSingle();

  if (!vehicle) return { vehicle: null, entries: [] };

  const { data: entries } = await supabase
    .from("service_entries")
    .select("id, service_code, note, place, serviced_on, kind")
    .eq("vehicle_id", vehicle.id)
    .order("serviced_on", { ascending: false });

  return { vehicle, entries: entries ?? [] };
}

// State shape consumed by useActionState on the owner ServiceLog form.
export type LogState = { ok: boolean; error: string | null };

const logSchema = z.object({
  service_code: z.enum(SERVICE_CODES),
  serviced_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().trim().max(120).optional(),
  note: z.string().trim().max(280).optional(),
});

/**
 * Server Action for useActionState: validates a logged service, confirms the
 * caller is the owner, resolves their vehicle server-side, and inserts the
 * entry as an `owner_log`. The vehicle id is NEVER taken from the client — it
 * is derived from the authenticated session, so a forged form cannot write to
 * another user's vehicle. revalidatePath('/') refreshes the server-rendered
 * history. Returns {ok:true} on success, {ok:false,error:'save'} on any failure.
 */
export async function logOwnerService(
  _prevState: LogState,
  formData: FormData,
): Promise<LogState> {
  const parsed = logSchema.safeParse({
    service_code: formData.get("service_code"),
    serviced_on: formData.get("serviced_on"),
    place: formData.get("place") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const user = await getUser();
  const role = await getSessionRole();
  if (!user || role !== "owner") return { ok: false, error: "save" };

  const supabase = await createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!vehicle) return { ok: false, error: "save" };

  const { error } = await supabase.from("service_entries").insert({
    vehicle_id: vehicle.id,
    kind: "owner_log",
    service_code: parsed.data.service_code,
    serviced_on: parsed.data.serviced_on,
    place: parsed.data.place ?? null,
    note: parsed.data.note ?? null,
    created_by: user.id,
  });

  if (error) return { ok: false, error: "save" };

  revalidatePath("/");
  return { ok: true, error: null };
}
