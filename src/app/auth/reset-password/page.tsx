import { createClient } from "@/lib/supabase/server";
import { changePassword } from "@/lib/account-actions";
import { ResetPasswordForm } from "./ResetPasswordForm";

// Exchanges the reset code for a session at request time — never prerender.
export const dynamic = "force-dynamic";

// Reset-completion route: the reset email links here with a ?code= param.
// We exchange that code for a session SERVER-SIDE (same PKCE seam as
// /auth/callback) so the subsequent changePassword → updateUser runs against
// an authenticated session. A missing or rejected code renders the expired
// shell instead of the form. The changePassword server action is passed down
// to the client form, which drives it through useActionState.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  let exchangeFailed = !code;
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchangeFailed = Boolean(error);
  }

  return <ResetPasswordForm action={changePassword} expired={exchangeFailed} />;
}
