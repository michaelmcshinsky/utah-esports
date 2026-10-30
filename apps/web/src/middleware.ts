import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { legacyRedirect } from "@/src/lib/legacy-redirects";
import { rateLimit } from "@/src/lib/rate-limit";

/**
 * Keeps the Supabase auth session fresh on every navigation and preserves
 * legacy Jekyll URLs with permanent redirects.
 * Gracefully no-ops when Supabase env vars are absent (local dev).
 */
async function refreshSession(request: NextRequest): Promise<NextResponse> {
  const legacy = legacyRedirect(request.nextUrl.pathname, request.nextUrl.origin);
  if (legacy) return legacy;

  const rateLimitResponse = rateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  await supabase.auth.getUser();
  return supabaseResponse;
}

export default async function middleware(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/calendar|api/out|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
