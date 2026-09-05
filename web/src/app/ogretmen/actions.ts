"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function linkStudentAction(email: string): Promise<{ ok: boolean; message: string }> {
  const { user, previewMode } = await requireRoleAction("teacher");
  if (previewMode || !supabaseConfigured() || !user) {
    return { ok: false, message: "Supabase henüz bağlı değil — bu bir önizleme." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { ok: false, message: error.message };

  const target = data.users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
  if (!target) return { ok: false, message: "Bu e-postayla kayıtlı bir öğrenci bulunamadı." };

  // profiles RLS bir kullanıcının sadece kendi satırını okumasına izin veriyor
  // (profiles_self) — öğretmenin başka birinin rolünü görebilmesi için admin client
  // gerekiyor, RLS'yi bu kontrol için bilinçli olarak atlıyoruz.
  const { data: profile } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", target.id)
    .single();

  if (!profile || profile.role !== "student") {
    return { ok: false, message: "Bu e-posta bir öğrenciye ait değil." };
  }

  const supabase = await createClient();
  const { error: linkError } = await supabase
    .from("student_links")
    .insert({ student_id: target.id, linked_profile_id: user.id, relation: "teacher" });

  if (linkError) {
    if (linkError.code === "23505") {
      return { ok: false, message: `${profile.full_name} zaten sınıfında.` };
    }
    return { ok: false, message: linkError.message };
  }

  return { ok: true, message: `${profile.full_name} sınıfına eklendi.` };
}
