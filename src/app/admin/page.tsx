import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth-actions";
import { AdminReviewList, type AdminWorkshop } from "@/components/AdminReviewList";
import { SignOutButton } from "@/components/SignOutButton";
import { LanguageToggle } from "@/components/LanguageToggle";

const CERT_BUCKET = "workshop-certs";
const SIGNED_URL_TTL = 60;

/**
 * Protected admin surface. Gates by the verified app_metadata role BEFORE any
 * workshop data is fetched — a non-admin request never receives admin data in
 * the response. Lists every pending workshop and mints a short-lived (60s)
 * signed certificate URL server-side, since the cert bucket is private.
 */
export default async function AdminPage() {
  const role = await getSessionRole();
  if (role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data } = await supabase
    .from("workshops")
    .select("id, name, serial, cert_path, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const workshops: AdminWorkshop[] = await Promise.all(
    rows.map(async (row) => {
      let certUrl: string | null = null;
      if (row.cert_path) {
        const { data: signed } = await supabase.storage
          .from(CERT_BUCKET)
          .createSignedUrl(row.cert_path, SIGNED_URL_TTL);
        certUrl = signed?.signedUrl ?? null;
      }
      return {
        id: row.id,
        name: row.name,
        serial: row.serial,
        created_at: row.created_at,
        certUrl,
      };
    }),
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-base font-bold text-surface shadow-sm">
            C
          </span>
          <span className="text-base font-semibold tracking-tight">Costas</span>
          <div className="ml-auto flex items-center gap-2">
            <LanguageToggle />
            <form action={signOut}>
              <SignOutButton />
            </form>
          </div>
        </header>

        <AdminReviewList workshops={workshops} />
      </div>
    </main>
  );
}
