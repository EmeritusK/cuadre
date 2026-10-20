import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Supabase client for Client Components (Realtime subscriptions). */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
