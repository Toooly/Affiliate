"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseConfiguration, env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  assertSupabaseConfiguration("Il client browser Supabase");
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
