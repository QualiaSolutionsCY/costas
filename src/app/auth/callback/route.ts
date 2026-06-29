import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth / magic-link exchange seam: trades the ?code for a session cookie
// (written through the server Supabase client) then sends the user to the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
