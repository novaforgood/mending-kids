import { createBrowserClient } from "@supabase/ssr";

/**
 * Must use SSR browser client so the session is stored in cookies.
 * Plain createClient() keeps the session in localStorage only; middleware
 * then never sees you as logged in and sends you back to /login.
 */
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
