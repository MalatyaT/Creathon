import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/roles";

export function supabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

type Profile = { role: UserRole; full_name: string };

/**
 * Sayfa (Server Component) koruması. Supabase projesi henüz bağlanmadıysa
 * (bkz. TODO.md "Sırada") sayfayı, gerçek auth olmadan, açık bir uyarıyla
 * önizleme modunda gösterir — Supabase bağlandığı an bu dal devre dışı kalır.
 */
export async function requireRole(role: UserRole, loginPath: string) {
  if (!supabaseConfigured()) {
    return {
      user: null,
      profile: { role, full_name: "" } as Profile,
      previewMode: true as const,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(loginPath);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== role) redirect(loginPath);

  return { user, profile: profile as Profile, previewMode: false as const };
}

/**
 * Server Action içinden çağrılan koruma — sayfa değil, redirect yerine hata fırlatır.
 * Supabase bağlı değilse (önizleme modu) yine de content_creator/student gibi rolleri
 * varsayarak devam eder; DB'ye yazan action'lar bunu ayrıca kontrol etmeli
 * (bkz. `supabaseConfigured()`).
 */
export async function requireRoleAction(role: UserRole) {
  if (!supabaseConfigured()) {
    return { user: null, profile: { role, full_name: "" } as Profile, previewMode: true as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Giriş yapmanız gerekiyor");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== role) throw new Error("Yetkiniz yok");

  return { user, profile: profile as Profile, previewMode: false as const };
}
