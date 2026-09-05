// Supabase projesi henüz bağlanmadıysa (bkz. TODO.md "Sırada") uygulama demo modunda
// çalışır: giriş/kayıt ekranları görünür ama gerçek kimlik doğrulama yapmadan doğrudan
// ilgili panele geçer. NEXT_PUBLIC_ önekli olduğu için bu değer client'ta da okunabilir
// ve build zamanında gömülür. Supabase bağlanır bağlanmaz (env değişkenleri dolunca)
// bu bayrak otomatik olarak false'a döner ve gerçek auth akışı devreye girer.
export const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;
