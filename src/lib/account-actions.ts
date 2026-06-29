"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared state shape consumed by useActionState across the auth-lifecycle
 * surfaces (signup, forgot-password, reset-completion, settings security).
 * `ok` flips true on a successful no-redirect mutation; `error` carries a
 * machine-readable token the page maps to a bilingual message via i18n.
 */
export type AccountState = { ok: boolean; error: string | null };
// NOTE: the initial state is inlined at each useActionState call site — a
// "use server" file may only export async functions (not objects), per Next 16.

const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"] });

const emailSchema = z.object({ email: z.string().email() });

const changePasswordSchema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"] });

/**
 * Self-service registration. There is NO service-role key in this environment,
 * so we never call any service-role admin endpoint; the DB BEFORE-INSERT trigger
 * (0007_signup_role_trigger.sql) stamps app_metadata.role = 'owner' and
 * auto-confirms the email, which makes the returned session immediately usable.
 *
 * On a mismatched confirm we return `error: "mismatch"`; a duplicate email maps
 * to `error: "exists"`; any other failure to `error: "save"`. redirect() throws
 * control flow, so it runs OUTSIDE the try/catch — it must not be swallowed.
 */
export async function signUp(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const mismatch =
      typeof raw.password === "string" &&
      typeof raw.confirm === "string" &&
      raw.password !== raw.confirm;
    return { ok: false, error: mismatch ? "mismatch" : "save" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const duplicate =
      error.code === "user_already_exists" ||
      /already|registered|exists/i.test(error.message);
    return { ok: false, error: duplicate ? "exists" : "save" };
  }

  // Trigger has stamped role=owner + auto-confirmed; session is usable.
  redirect("/");
}

/**
 * Sends a password-reset email. Always returns ok on a valid-format email so a
 * caller can never enumerate which addresses have accounts — Supabase errors
 * (including "user not found") are intentionally swallowed. Only a malformed
 * email returns an error. NEXT_PUBLIC_SITE_URL is optional: when unset we omit
 * redirectTo and let Supabase use its configured Site URL.
 */
export async function requestPasswordReset(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const options = siteUrl
    ? { redirectTo: `${siteUrl}/auth/reset-password` }
    : undefined;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, options);

  // Do not leak whether the address exists.
  return { ok: true, error: null };
}

/**
 * Sets a new password for the CURRENT session (used by the reset-completion
 * route after exchangeCodeForSession, and by the Phase 2 settings security
 * surface). Return-based — callers redirect on `ok` — so it stays reusable.
 */
export async function changePassword(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const password = formData.get("password");
    const confirm = formData.get("confirm");
    const mismatch =
      typeof password === "string" &&
      typeof confirm === "string" &&
      password !== confirm;
    return { ok: false, error: mismatch ? "mismatch" : "save" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, error: "save" };
  }

  return { ok: true, error: null };
}
