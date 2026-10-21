import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Supabase client for Client Components (Realtime subscriptions). */
export function createClient(): SupabaseClient<Database> {
  // @supabase/ssr 0.0.x types its return value against an older SupabaseClient generic.
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
  ) as unknown as SupabaseClient<Database>;
}
