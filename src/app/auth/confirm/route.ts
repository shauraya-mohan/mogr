import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Email confirmation callback.
 *
 * Supabase sends the user here after they click the confirmation link
 * in their email. The URL contains a `token_hash` and `type` param which
 * we exchange for a session via `verifyOtp`.
 *
 * On success → redirect to the `next` param (default: /scan).
 * On failure → redirect to /verify?error=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "email" | null;
  const next = searchParams.get("next") || "/scan";

  if (token_hash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component — middleware handles refresh.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error) {
      // Verified — redirect to the scan page (or wherever `next` points).
      const url = request.nextUrl.clone();
      url.pathname = next.startsWith("/") ? next : "/scan";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Verification failed — send back to verify page with error.
    const url = request.nextUrl.clone();
    url.pathname = "/verify";
    url.search = `?error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(url);
  }

  // Missing params — redirect home.
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  return NextResponse.redirect(url);
}
