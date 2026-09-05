import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * service_role client — RLS'yi tamamen atlar. Sadece sunucu tarafında (Server Action/
 * Route Handler) ve sadece gerçekten gerekli olan işlemler için kullan (ör. e-postadan
 * kullanıcı arama — auth.users tabloya normal client ile erişilemez). İstemciye asla
 * sızdırma.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
