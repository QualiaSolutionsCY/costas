"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";

// Reminder-preferences data seam. Reads and writes the authenticated user's own
// `profiles` row (reminders_inapp_enabled / reminders_email_enabled /
// reminders_advance_days — migration 0010) through the session-scoped Supabase
// client under existing RLS, which confines every read/write to `auth.uid()`.
// As a "use server" module this file may export ONLY async functions, so the
// prefs shape is declared inline at each boundary; the form component owns its
// own prop type.

/**
 * The current user's reminder preferences, or null when unauthenticated.
 * Columns default to (inApp=true, email=false, advanceDays=30) when the row
 * has no value yet.
 */
export async function getReminderPrefs(): Promise<{
  inApp: boolean;
  email: boolean;
  advanceDays: number;
} | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(
      "reminders_inapp_enabled, reminders_email_enabled, reminders_advance_days",
    )
    .eq("id", user.id)
    .maybeSingle();

  return {
    inApp: data?.reminders_inapp_enabled ?? true,
    email: data?.reminders_email_enabled ?? false,
    advanceDays: data?.reminders_advance_days ?? 30,
  };
}

const prefsSchema = z.object({
  inapp: z.preprocess((v) => v === "on", z.boolean()),
  email: z.preprocess((v) => v === "on", z.boolean()),
  advance_days: z.coerce.number().int().min(1).max(90),
});

/**
 * Server Action for useActionState: validates and updates the current user's
 * own reminder preferences. Checkboxes arrive as 'on' when checked, absent
 * (null) otherwise. RLS confines the write to `auth.uid()`. Revalidates the
 * settings page and the log root so reminder surfaces refresh. Returns
 * {ok:true,error:false} on success, {ok:false,error:true} on any failure.
 */
export async function updateReminderPrefs(
  _prev: { ok: boolean; error: boolean },
  formData: FormData,
): Promise<{ ok: boolean; error: boolean }> {
  const parsed = prefsSchema.safeParse({
    inapp: formData.get("inapp"),
    email: formData.get("email"),
    advance_days: formData.get("advance_days"),
  });

  if (!parsed.success) return { ok: false, error: true };

  const user = await getUser();
  if (!user) return { ok: false, error: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      reminders_inapp_enabled: parsed.data.inapp,
      reminders_email_enabled: parsed.data.email,
      reminders_advance_days: parsed.data.advance_days,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: true };

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true, error: false };
}
