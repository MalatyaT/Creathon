import { createClient } from "@supabase/supabase-js";

/**
 * Service-role istemci — RLS'i bypass eder. Sadece "use server" action'ları içinden,
 * ve sadece gerçek kullanıcı oturumu olmayan demo akışları için kullan (bkz.
 * panel/ogrenci/actions.ts). Gerçek auth gerektiren yollar `lib/supabase/server.ts`
 * (cookie tabanlı, RLS aktif) istemcisini kullanmaya devam etmeli.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
