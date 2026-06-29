"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";

// Profile data seam. Reads and writes the authenticated user's own
// `profiles` row (full_name + phone) through the session-scoped Supabase
// client under existing RLS — `profiles_select_own` / `profiles_update_own`
// confine every read/write to `auth.uid()`. This is the only file that knows
// the `profiles` table shape for the account-settings flow.

export type ProfileData = { full_name: string | null; phone: string | null };

// State shape consumed by useActionState on the profile-edit form.
export type ProfileState = { ok: boolean; error: string | null };

/** The current user's profile, or null when unauthenticated. */
export async function getProfile(): Promise<ProfileData | null> {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return {
    full_name: data?.full_name ?? null,
    phone: data?.phone ?? null,
  };
}

const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

/**
 * Server Action for useActionState: validates and updates the current user's
 * own profile row. RLS confines the write to `auth.uid()`. An empty phone is
 * stored as null. revalidatePath('/settings') refreshes the server-rendered
 * settings page. Returns {ok:true} on success, {ok:false,error:'save'} on any
 * failure.
 */
export async function updateProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) return { ok: false, error: "save" };

  const user = await getUser();
  if (!user) return { ok: false, error: "save" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "save" };

  revalidatePath("/settings");
  return { ok: true, error: null };
}
