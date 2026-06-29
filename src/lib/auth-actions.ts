"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// State shape consumed by useActionState on the login screen.
export type SignInState = { error: boolean };

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Server Action for useActionState: validates the submitted credentials,
 * signs in via Supabase, and routes by the verified app_metadata role.
 *
 * Authorization is read ONLY from app_metadata (server-controlled), never
 * from user_metadata. redirect() throws control flow, so it is called outside
 * the try/catch — a redirect must not be swallowed as a sign-in error.
 */
export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: true };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: true };
  }

  const role = (data.user.app_metadata as { role?: unknown } | undefined)?.role;

  redirect(role === "mechanic" ? "/mechanic" : "/");
}

/**
 * Server Action: ends the current session and returns the user to the login
 * screen. redirect() throws, so it runs after sign-out completes.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
