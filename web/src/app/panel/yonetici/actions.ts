"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionPoolStats, type QuestionPoolStats } from "@/lib/question-pool-stats";

// Bu panel (panel/yonetici) tasarım gereği gerçek girişi atlıyor (bkz. panel/ogrenci/
// actions.ts'teki aynı desen) — service-role istemciyle RLS bypass edilir.
export async function getPoolStats(): Promise<QuestionPoolStats> {
  const supabase = createAdminClient();
  return getQuestionPoolStats(supabase);
}
