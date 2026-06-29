"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";

// Write seam for the reminder bell. Dismissing a reminder records its exact
// (vehicle_id, reminder_kind, due_on) cycle in public.reminder_dismissals so
// getRemindersForVehicles can subtract it. The insert is an idempotent upsert:
// a double-dismiss of the same cycle is a no-op. Demo-permissive RLS covers the
// anonymous owner flow; when a session exists, dismissed_by is stamped.

const dismissSchema = z.object({
  vehicle_id: z.string().uuid(),
  reminder_kind: z.enum(["mot", "service"]),
  due_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Server Action for useActionState: validates and records a reminder dismissal
 * for its current cycle. Upsert with ignoreDuplicates makes a repeat dismiss a
 * no-op. revalidatePath('/') + revalidatePath('/reminders') refresh the badge
 * and the reminders list. Returns {ok:true} on success, {ok:false} on any
 * parse/db error.
 */
export async function dismissReminder(
  _prev: { ok: boolean },
  formData: FormData,
): Promise<{ ok: boolean }> {
  const parsed = dismissSchema.safeParse({
    vehicle_id: formData.get("vehicle_id"),
    reminder_kind: formData.get("reminder_kind"),
    due_on: formData.get("due_on"),
  });

  if (!parsed.success) return { ok: false };

  const user = await getUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("reminder_dismissals")
    .upsert(
      {
        vehicle_id: parsed.data.vehicle_id,
        reminder_kind: parsed.data.reminder_kind,
        due_on: parsed.data.due_on,
        dismissed_by: user?.id ?? null,
      },
      { onConflict: "vehicle_id,reminder_kind,due_on", ignoreDuplicates: true },
    );

  if (error) return { ok: false };

  revalidatePath("/");
  revalidatePath("/reminders");
  return { ok: true };
}
