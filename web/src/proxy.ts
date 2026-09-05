import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: bu dosya eskiden `middleware.ts` idi, `proxy.ts` olarak yeniden adlandırıldı.
// Supabase oturum çerezini her istekte tazeler; sayfa/Server Action'lardaki
// auth kontrolleri hâlâ ayrıca yapılmalı (bkz. lib/supabase/server.ts kullanan route'lar).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase projesi henüz kurulmadıysa (yerel önizleme/ilk kurulum) siteyi
  // çökertmek yerine oturum yenilemeyi atla — sayfa/Server Action'lardaki
  // auth kontrolleri zaten ayrıca yapılıyor (bkz. lib/auth-guard.ts).
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Supabase geçici olarak erişilemezse isteği engelleme; korumalı sayfalar
    // yine de kendi auth kontrolünde yönlendirme yapar.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
