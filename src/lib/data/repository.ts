import { isDemoMode } from "@/lib/env";

import { demoRepository } from "@/lib/data/demo-repository";
import { supabaseRepository } from "@/lib/data/supabase-repository";

export function getRepository() {
  return isDemoMode() ? demoRepository : supabaseRepository;
}
