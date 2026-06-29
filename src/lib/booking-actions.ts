"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { SERVICE_CODES } from "@/lib/services";
import { normalizePlate } from "@/lib/plate";

// Booking data seam. Reads incoming + owner bookings straight from Supabase and
// writes new requests and status changes back. Access is anonymous (no login
// required) — the demo-permissive `demo_bookings_*` policies allow anon
// select/insert/update. When a session exists, owner_id is stamped; when not, it
// stays null. This is the only file that knows the `bookings` table shape.
//
// Next-16 rule: a 'use server' file may export ONLY async functions. Shared
// return shapes are therefore inlined in each signature, never exported as types
// from here — consumers infer them from the reader functions or redeclare the
// small action-state shape inline.

/** Owner's own bookings, newest first. */
export async function getOwnerBookings(): Promise<
  {
    id: string;
    workshop_name: string | null;
    plate: string | null;
    service_code: string | null;
    requested_date: string | null;
    status: string;
    note: string | null;
    created_at: string;
  }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, workshop_name, plate, service_code, requested_date, status, note, created_at",
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Incoming bookings for the workshop side, newest first. Demo-permissive: the
 * workshop sees all requests (no per-workshop scoping in the demo).
 */
export async function getIncomingBookings(): Promise<
  {
    id: string;
    workshop_name: string | null;
    plate: string | null;
    service_code: string | null;
    requested_date: string | null;
    status: string;
    note: string | null;
    created_at: string;
  }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, workshop_name, plate, service_code, requested_date, status, note, created_at",
    )
    .order("created_at", { ascending: false });
  return data ?? [];
}

const bookingSchema = z.object({
  workshop_name: z.string().trim().min(1).max(120),
  service_code: z.enum(SERVICE_CODES),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plate: z.string().trim().min(1).max(20).transform(normalizePlate).optional(),
  vehicle_id: z.string().uuid().optional(),
  note: z.string().trim().max(300).optional(),
});

/**
 * Server Action for useActionState: validates and inserts a booking request.
 * The owner may book without binding a plate or vehicle (anonymous-friendly).
 * When a session exists, owner_id is stamped; otherwise it stays null. Status
 * starts at 'requested'. revalidatePath('/book') + revalidatePath('/bookings')
 * refresh both sides. Returns {ok:true} on success, {ok:false,error:'save'} on
 * any failure.
 */
export async function createBooking(
  _prev: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const parsed = bookingSchema.safeParse({
    workshop_name: formData.get("workshop_name"),
    service_code: formData.get("service_code"),
    requested_date: formData.get("requested_date"),
    plate: formData.get("plate") || undefined,
    vehicle_id: formData.get("vehicle_id") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const user = await getUser();
  const supabase = await createClient();

  const { error } = await supabase.from("bookings").insert({
    workshop_name: parsed.data.workshop_name,
    service_code: parsed.data.service_code,
    requested_date: parsed.data.requested_date,
    plate: parsed.data.plate ?? null,
    vehicle_id: parsed.data.vehicle_id ?? null,
    note: parsed.data.note ?? null,
    owner_id: user?.id ?? null,
    status: "requested",
  });

  if (error) return { ok: false, error: "save" };

  revalidatePath("/book");
  revalidatePath("/bookings");
  return { ok: true, error: null };
}

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["requested", "confirmed", "done", "cancelled"]),
});

/**
 * Server Action for useActionState: updates a booking's status. Relies on the
 * demo-permissive `demo_bookings_update` policy. revalidatePath('/bookings') +
 * revalidatePath('/book') refresh both sides. Returns {ok:true} on success,
 * {ok:false,error:'save'} on any failure.
 */
export async function updateBookingStatus(
  _prev: { ok: boolean; error: string | null },
  formData: FormData,
): Promise<{ ok: boolean; error: string | null }> {
  const parsed = statusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, error: "save" };

  revalidatePath("/bookings");
  revalidatePath("/book");
  return { ok: true, error: null };
}
