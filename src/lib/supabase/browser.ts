"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabasePublishableKey, supabaseUrl } from "./env";

let client: SupabaseClient | null = null;

export function getBrowserSupabase() {
  if (!hasSupabaseConfig()) return null;
  client ??= createBrowserClient(supabaseUrl!, supabasePublishableKey!);
  return client;
}
