import { createClient } from "@supabase/supabase-js";

import { assertSupabaseConfiguration, env } from "@/lib/env";

export function createSupabaseAdminClient() {
  assertSupabaseConfiguration("Le operazioni admin Supabase");
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
