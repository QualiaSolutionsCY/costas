"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { SERVICE_CODES } from "@/lib/services";
import { normalizePlate } from "@/lib/plate";

// Owner-side data seam. Reads vehicles + their service history straight from
// Supabase and writes new vehicles and owner-logged services back. Access is
// anonymous (no login required) — RLS allows anon select/insert. When a session
// exists, ownership is stamped (owner_id / created_by); when not, those stay
// null. This is the only file that knows the `vehicles` / `service_entries`
// table shapes for the owner flow.

export type OwnerVehicle = { id: string; model: string | null; plate: string };

export type OwnerEntry = {
  id: string;
  service_code: string;
  place: string | null;
  serviced_on: string;
  note: string | null;
  kind: string;
};

/** All vehicles, newest first. */
export async function getVehicles(): Promise<OwnerVehicle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("id, model, plate")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Service entries for one vehicle, newest first. Callable from the client on a
 * vehicle switch so the history + stats swap without a full page reload.
 */
export async function getEntries(vehicleId: string): Promise<OwnerEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_entries")
    .select("id, service_code, place, serviced_on, note, kind")
    .eq("vehicle_id", vehicleId)
    .order("serviced_on", { ascending: false });
  return data ?? [];
}

// State shape consumed by useActionState on the add-vehicle form.
export type VehicleState = { ok: boolean; error: string | null };

const vehicleSchema = z.object({
  model: z.string().trim().min(1).max(80),
  plate: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform(normalizePlate),
});

/**
 * Server Action for useActionState: validates and inserts a new vehicle. When a
 * session exists, owner_id is stamped; otherwise it stays null (anonymous).
 * revalidatePath('/') refreshes the server-rendered vehicle list.
 */
export async function addVehicle(
  _prevState: VehicleState,
  formData: FormData,
): Promise<VehicleState> {
  const parsed = vehicleSchema.safeParse({
    model: formData.get("model"),
    plate: formData.get("plate"),
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const user = await getUser();
  const supabase = await createClient();

  const { error } = await supabase.from("vehicles").insert({
    model: parsed.data.model,
    plate: parsed.data.plate,
    owner_id: user?.id ?? null,
  });

  if (error) return { ok: false, error: "save" };

  revalidatePath("/");
  return { ok: true, error: null };
}

// State shape consumed by useActionState on the owner ServiceLog form.
export type LogState = { ok: boolean; error: string | null };

const logSchema = z.object({
  service_code: z.enum(SERVICE_CODES),
  serviced_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vehicle_id: z.string().uuid(),
  city: z.string().trim().max(60).optional(),
  mechanic: z.string().trim().max(80).optional(),
});

/**
 * Server Action for useActionState: validates a logged service and inserts it
 * as an `owner_log` against the chosen vehicle. The human-readable `place`
 * combines the mechanic name and city. When a session exists, created_by is
 * stamped; otherwise it stays null (anonymous). revalidatePath('/') refreshes
 * the server-rendered history. Returns {ok:true} on success,
 * {ok:false,error:'save'} on any failure.
 */
export async function logOwnerService(
  _prevState: LogState,
  formData: FormData,
): Promise<LogState> {
  const parsed = logSchema.safeParse({
    service_code: formData.get("service_code"),
    serviced_on: formData.get("serviced_on"),
    vehicle_id: formData.get("vehicle_id"),
    city: formData.get("city") || undefined,
    mechanic: formData.get("mechanic") || undefined,
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const place =
    [parsed.data.mechanic, parsed.data.city].filter(Boolean).join(", ") || null;

  const user = await getUser();
  const supabase = await createClient();

  const { error } = await supabase.from("service_entries").insert({
    vehicle_id: parsed.data.vehicle_id,
    kind: "owner_log",
    service_code: parsed.data.service_code,
    serviced_on: parsed.data.serviced_on,
    place,
    created_by: user?.id ?? null,
  });

  if (error) return { ok: false, error: "save" };

  revalidatePath("/");
  return { ok: true, error: null };
}
