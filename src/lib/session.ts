import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SessionRole = "owner" | "mechanic";

/**
 * Returns the verified JWT claims for the current request, or null when there
 * is no authenticated session. Uses getClaims(), which verifies the JWT
 * locally (asymmetric signing keys) without a network round-trip.
 */
async function getClaims() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  return data.claims;
}

/**
 * The authenticated user's identity (subject + email) derived from verified
 * JWT claims, or null when unauthenticated. Safe for authorization because the
 * claims are cryptographically verified by getClaims().
 */
export async function getUser() {
  const claims = await getClaims();
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: claims.email ?? null,
  };
}

/**
 * The current user's role, read ONLY from app_metadata (server-controlled).
 * Never read from user_metadata, which is user-editable and would allow an
 * auth bypass. Returns null when unauthenticated or when no valid role is set.
 */
export async function getSessionRole(): Promise<SessionRole | null> {
  const claims = await getClaims();
  const role = (claims?.app_metadata as { role?: unknown } | undefined)?.role;
  return role === "owner" || role === "mechanic" ? role : null;
}
