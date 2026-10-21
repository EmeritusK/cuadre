import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Supabase client for Server Components, Route Handlers and Server Actions. */
export function createClient(): SupabaseClient<Database> {
  const cookieStore = cookies();

  const client = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components cannot write cookies; the middleware refreshes the session.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // See set().
        }
      },
    },
  });

  // @supabase/ssr 0.0.x types its return value against an older SupabaseClient generic.
  return client as unknown as SupabaseClient<Database>;
}
