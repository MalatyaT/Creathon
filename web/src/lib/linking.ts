import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Öğretmen ve veli paneli için ortak "e-postayla öğrenci ekle" mantığı. auth.users'a
 * (dolayısıyla profiles'a) erişim admin client gerektiriyor — normal client sadece
 * kendi profilini görebiliyor (bkz. profiles RLS).
 */
export async function linkStudentByEmail(params: {
  linkerId: string;
  relation: "teacher" | "parent";
  email: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return { ok: false, message: error.message };

  const target = data.users.find(
    (u) => u.email?.toLowerCase() === params.email.trim().toLowerCase(),
  );
  if (!target) return { ok: false, message: "Bu e-postayla kayıtlı bir öğrenci bulunamadı." };

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
    .insert({ student_id: target.id, linked_profile_id: params.linkerId, relation: params.relation });

  if (linkError) {
    if (linkError.code === "23505") {
      return { ok: false, message: `${profile.full_name} zaten listende.` };
    }
    return { ok: false, message: linkError.message };
  }

  return { ok: true, message: `${profile.full_name} eklendi.` };
}
