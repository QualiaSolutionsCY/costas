"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSessionRole } from "@/lib/session";

// Result of an admin review action, shaped for useActionState. `error` is a
// discriminated code the UI maps to localized copy; null means success.
export type AdminActionState = { ok: boolean; error: string | null };

/**
 * Approves a workshop registration. Verifies the caller is an admin
 * (app_metadata.role === 'admin') BEFORE any database access — an in-code
 * backstop to the workshops_admin_all RLS policy (0006), so a crafted
 * non-admin call gets an explicit `forbidden` result, not a silent no-op.
 * Sets status='verified' and reviewed_at, then revalidates every surface that
 * shows a workshop's verification state.
 */
export async function approveWorkshop(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if ((await getSessionRole()) !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const workshopId = String(formData.get("workshopId") ?? "");
  if (!workshopId) return { ok: false, error: "save" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workshops")
    .update({
      status: "verified",
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", workshopId);

  if (error) return { ok: false, error: "save" };

  revalidatePath("/admin");
  revalidatePath("/mechanic");
  revalidatePath("/");
  return { ok: true, error: null };
}

/**
 * Rejects a workshop registration. Same admin guard as approveWorkshop, run
 * FIRST before any DB access. Stores the rejection reason and reviewed_at,
 * then revalidates the workshop surfaces.
 */
export async function rejectWorkshop(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if ((await getSessionRole()) !== "admin") {
    return { ok: false, error: "forbidden" };
  }

  const workshopId = String(formData.get("workshopId") ?? "");
  if (!workshopId) return { ok: false, error: "save" };

  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) return { ok: false, error: "reason" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("workshops")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_at: new Date().toISOString(),
    } as never)
    .eq("id", workshopId);

  if (error) return { ok: false, error: "save" };

  revalidatePath("/admin");
  revalidatePath("/mechanic");
  revalidatePath("/");
  return { ok: true, error: null };
}
