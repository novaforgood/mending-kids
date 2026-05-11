import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Resolve the logged-in user from Supabase cookies (same session as middleware / browser).
 * Do not use supabaseServer.auth.getUser() — that client uses the service role and has no session.
 */
export async function getServerSessionUser() {
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
            // Server Components may be read-only; middleware refreshes sessions.
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAdmin() {
  const user = await getServerSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.user_metadata?.role !== "admin") {
    throw new Error("Forbidden: only admins can perform this action.");
  }
  return user;
}
