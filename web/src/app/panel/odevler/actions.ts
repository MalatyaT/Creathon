"use server";

import { requireRoleAction } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";

export async function toggleHomeworkAction(homeworkId: string, done: boolean) {
  const { user } = await requireRoleAction("student");
  const supabase = await createClient();

  const { error } = await supabase
    .from("homework")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", homeworkId)
    .eq("student_id", user!.id);

  if (error) throw new Error(error.message);
}
