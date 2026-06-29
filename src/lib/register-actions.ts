"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";

export type RegisterState = {
  ok: boolean;
  error: string | null;
  name?: string;
  serial?: string;
  certUrl?: string | null;
};

const CERT_BUCKET = "workshop-certs";
const MAX_CERT_BYTES = 5 * 1024 * 1024;

// Server-side allow-list: closes the unvalidated client drop path. The drag-drop
// UI accepts anything; this is the boundary that actually enforces type + size.
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/pdf": "pdf",
};

const fieldsSchema = z.object({
  name: z.string().trim().min(1),
  serial: z.string().trim().min(1),
});

/**
 * Persists a workshop registration: validates the signed-in caller, the text
 * fields, and the certificate file server-side, uploads the cert to the private
 * `workshop-certs` bucket under the caller's own `{uid}/` folder, upserts the
 * workshops row (one per owner), and returns a short-lived signed URL for the
 * stored certificate. Shaped for `useActionState`.
 */
export async function registerWorkshop(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const user = await getUser();
  if (!user) return { ok: false, error: "save" };

  const parsed = fieldsSchema.safeParse({
    name: formData.get("name"),
    serial: formData.get("serial"),
  });
  if (!parsed.success) return { ok: false, error: "save" };
  const { name, serial } = parsed.data;

  const cert = formData.get("cert");
  if (!(cert instanceof File) || cert.size === 0) {
    return { ok: false, error: "save" };
  }
  if (cert.size > MAX_CERT_BYTES) return { ok: false, error: "save" };
  const ext = ALLOWED_TYPES[cert.type];
  if (!ext) return { ok: false, error: "save" };

  const supabase = await createClient();
  const certPath = `${user.id}/cert.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CERT_BUCKET)
    .upload(certPath, cert, { upsert: true, contentType: cert.type });
  if (uploadError) return { ok: false, error: "save" };

  const { error: rowError } = await supabase
    .from("workshops")
    .upsert(
      { owner_id: user.id, name, serial, cert_path: certPath },
      { onConflict: "owner_id" },
    );
  if (rowError) return { ok: false, error: "save" };

  const { data: signed, error: signError } = await supabase.storage
    .from(CERT_BUCKET)
    .createSignedUrl(certPath, 3600);
  if (signError) return { ok: false, error: "save" };

  return { ok: true, error: null, name, serial, certUrl: signed.signedUrl };
}
