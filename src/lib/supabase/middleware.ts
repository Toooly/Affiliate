import type { NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";

export function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return supabase.auth.getUser();
}
