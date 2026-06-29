"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Seeded demo accounts (real auth). Shared password across both roles so the
// welcome screen can sign in with a single tap. Keep in sync with the seed.
const DEMO_ACCOUNTS = {
  owner: { email: "owner@costas.demo", redirect: "/" },
  mechanic: { email: "mechanic@costas.demo", redirect: "/mechanic" },
} as const;

const DEMO_PASSWORD = "costas123";

/**
 * Server Action for the welcome role-chooser: signs in the matching seeded
 * demo account and routes to that role's home. redirect() throws control flow,
 * so it runs after sign-in completes — never inside a try/catch that would
 * swallow it as an error.
 */
export async function demoSignIn(role: "owner" | "mechanic"): Promise<void> {
  const account = DEMO_ACCOUNTS[role];

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: account.email,
    password: DEMO_PASSWORD,
  });

  redirect(account.redirect);
}
