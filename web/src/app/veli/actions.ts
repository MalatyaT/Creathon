"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { linkStudentByEmail } from "@/lib/linking";

export async function linkChildAction(email: string): Promise<{ ok: boolean; message: string }> {
  const { user, previewMode } = await requireRoleAction("parent");
  if (previewMode || !supabaseConfigured() || !user) {
    return { ok: false, message: "Supabase henüz bağlı değil — bu bir önizleme." };
  }

  return linkStudentByEmail({ linkerId: user.id, relation: "parent", email });
}
