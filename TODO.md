# İkiz — Yapay Zeka Destekli Sınav Koçu Platformu — Yapılacaklar Listesi

> Bu liste, `Yapay zeka öğrenme platformu tasarımı (1)/` klasöründeki mevcut tasarım taslağı incelenerek çıkarılmıştır. Aşağıda önce mevcut durum, sonra eklenmesi istenen (OCR + soru havuzu + Gemini API chatbot/soru üretimi) özellikler için detaylı bir yol haritası yer alıyor.

## Bu oturumda tamamlananlar (kod: `web/`, şema: `supabase/migrations/`)

- [x] Next.js 16 (TypeScript, Tailwind v4, App Router) projesi `web/` altında kuruldu.
- [x] Supabase şeması yazıldı (`supabase/migrations/0001_init.sql`, `0002_profile_on_signup.sql`): roller (`student`/`teacher`/`parent`/`content_creator`), `subjects`/`topics`, `scans`, `questions` (soru havuzu, pgvector embedding sütunu dahil), `twin_state` (risk skoru), `chat_messages`, `homework`, `exams`, RLS politikaları ve kayıt olunca `profiles`/`students` satırını otomatik oluşturan trigger.
- [x] Supabase istemcileri (`lib/supabase/client.ts`, `server.ts`) ve oturum yenileyen `proxy.ts` (Next 16'da `middleware.ts` bu adı aldı) eklendi.
- [x] Gemini SDK sarmalayıcısı (`lib/gemini.ts`): kota/aşırı yük (429/503) hatasında modeller arasında otomatik fallback yapıyor. **Not:** `gemini-2.5-*` modelleri bu hesap için artık kapalı ("no longer available to new users") — zincir güncel `gemini-flash-latest` → `gemini-pro-latest` → `gemini-flash-lite-latest` takma adlarını kullanıyor (bunlar Google'ın önerdiği modele otomatik işaret ediyor, elle güncelleme gerektirmiyor). `GEMINI_API_KEY` `.env.local`'a kaydedildi (gitignore'da, repo'ya girmiyor).
- [x] Canlı/enerjik marka yönü (mor+turkuaz "ikiz" rengi, risk ısı skalası, Space Grotesk/Inter) ile yeniden tasarlanan **landing page** (`app/page.tsx`) — role picker, "nasıl çalışır" akışı, örnek risk haritası önizlemesi.
- [x] **Ayrı giriş/kayıt akışları**: `/giris/[role]` ve `/kayit/[role]` (`ogrenci`, `ogretmen`, `kaynak-uretici`), öğrenci kaydında LGS/YKS seçimi.
- [x] **Demo modu** (`lib/demo.ts`): Supabase bağlanana kadar giriş/kayıt formları gerçek kimlik doğrulama yapmadan doğrudan ilgili panele geçiyor (sunum için) — Supabase env değişkenleri dolunca bu davranış otomatik olarak gerçek auth'a döner, kod değişikliği gerekmez.
- [x] Rol bazlı panel taslakları: `/panel` (öğrenci), `/ogretmen`, `/kaynak-uretici`.
- [x] **Kaynak Üreticisi — OCR yükleme ekranı** (`/kaynak-uretici`, `components/kaynak-uretici/scan-upload.tsx`): sayfa görseli yükle → Gemini yapılandırılmış JSON ile soruları ayırıp çözüyor (soru metni, şıklar, doğru cevap, açıklama, zorluk, konu tahmini) → düzenlenebilir liste olarak önizle → onayla → havuza ekle. Sentetik bir test sayfasıyla gerçek Gemini çağrısı doğrulandı (3/3 doğru çözüm).
- [x] **Öğrenci — Gemini chatbot** (`/panel/soru-sor`, `components/panel/chat.tsx`): metin + görsel soru sorma, adım adım çözüm, kazanım etiketi, hazır soru önerileri. Gerçek Gemini çağrısıyla uçtan uca test edildi (ör. "3 üstü 4" → doğru adım adım çözüm + "Üslü Sayılar" etiketi).
- [x] **Kaynak temelli yanıt (hafif RAG)** (`supabase/migrations/0004_source_grounding.sql`, `lib/gemini-tasks/find-related-sources.ts`): her tarama artık kitap adı + sayfa no + Gemini'nin çıkardığı kısa "sayfa özeti" ile kaydediliyor (`scans.book_title/page_number/summary`). Chatbot, yanıt üretmeden önce en güncel taramaların özet+örnek sorularını bağlam olarak alıyor ve öğrencinin sorusu gerçekten ilgiliyse yanıtta "Kitap adı, s. X" biçiminde referans veriyor (`chat_messages.source_reference`, sohbet arayüzünde 📖 rozeti) — ilgili kaynak yoksa uydurmuyor, açıkça talimatlandırıldı. Kaynak Üreticisi ekranına kitap adı/sayfa no alanları ve düzenlenebilir özet kutusu eklendi.
- [x] Playwright ile masaüstü+mobil ekran görüntüsü ve tam akış (giriş → panel → soru sor / kaynak üreticisi → kitap adı+sayfa gir → tara → özet+sorular → havuza ekle) doğrulandı; build/lint/typecheck temiz, konsol hatası yok.

**Bilinen sınır:** Supabase projesi henüz bağlı değil — OCR/chat ekranları Gemini çağrılarını gerçekten yapıyor, ama "havuza ekle", sohbet geçmişi kaydı ve kaynak referansı, Supabase env değişkenleri girilene kadar no-op/boş geçiyor (bkz. `supabaseConfigured()`) — yani kaynak referansı özelliği şu an koddan doğrulandı ama Supabase bağlanıp en az bir tarama kaydedilene kadar chatbot'ta gerçek bir referans görünmeyecek. Kaynak eşleştirmesi şu an gerçek benzerlik/embedding araması değil, en güncel N taramanın özetini bağlama koyup kararı Gemini'ye bırakıyor (`find-related-sources.ts`) — havuz büyüdükçe pgvector tabanlı gerçek benzerlik aramasına geçilmeli. `topics` taksonomisi henüz seed edilmedi; Gemini'nin verdiği konu tahmini şimdilik `topic_label` serbest metin sütununda tutuluyor, gerçek `topic_id`'ye eşleme sonraki bir adım.
**İleride (kullanıcı notu):** Ödev oluşturma (Faz 4) havuzdan soru seçerken her sorunun `source_scan_id` → `scans.book_title/page_number` bağlantısını da öğrenciye/öğretmene göstermeli ("bu ödev X kaynağının Y. sayfasına dayanıyor" gibi) — şema zaten buna hazır, sadece Faz 4'te UI'da yüzeye çıkarılmalı.

**Sırada:** Supabase projesini gerçekten oluşturup `.env.local`'daki `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY`'i doldurmak (bkz. Faz 1) — bağlanır bağlanmaz demo modu ve önizleme mesajları otomatik olarak gerçek kayıt/girişe döner.

## 0. Mevcut durumun tespiti

İncelenen dosyalar: `Ogrenci Paneli.dc.html`, `Ogrenci Paneli v1.dc.html`, `support.js`, `_ds/broadsheet-.../` (tasarım sistemi).

- Bu klasördeki içerik **Claude Design "canvas" çıktısı** — yani statik/mock bir arayüz prototipi. Gerçek bir backend, veritabanı, API veya deploy edilebilir uygulama **yok**. `support.js` sadece `.dc.html` dosyalarını render eden bir şablon motoru (uygulama mantığı içermiyor).
- Ürün konsepti netleşmiş durumda: **"İkiz"** adlı, YKS/LGS öğrencilerine yönelik bir çalışma platformu. Öğrencinin bir "dijital ikizi" var; ikiz, çözdüğü sorulardan öğrenip konu bazında **risk haritası** (hangi kazanımda ne kadar yanılıyor) çıkarıyor.
- Tasarımda 8 sekme planlanmış: **Panel, Dijital İkiz, Ödevler, Soru Sor, Soru Oluştur, Videolar, Analiz, Öğretmen–Veli**.
  - **Soru Sor** ekranı zaten "fotoğraf çek ya da yaz" diyor ve altyazıda **"Gemini API üzerinden yanıtlanır · her yanıt kazanım etiketiyle ikizine işlenir"** yazıyor — yani chatbot + OCR fikri tasarımda kavramsal olarak öngörülmüş, ama hiç bağlanmamış.
  - **Soru Oluştur** ekranı "havuzdaki sorulara ve ikizin hata desenine bakarak yeni test yazılır, PDF + cevap anahtarı iner" diyor — yani **soru havuzu** kavramı da tasarımda var ama içi boş, senin eklemek istediğin OCR ile kitap tarayıp bu havuzu doldurma fikri henüz yok.
  - Tasarım sistemi ("Broadsheet") sadece CSS token'ları + statik bileşen sayfaları; üretim uygulamasında doğrudan kullanılamaz, referans olarak taşınmalı.
- **Sonuç:** Bu bir tasarım taslağı, sıfırdan gerçek bir web uygulaması (frontend + backend + AI pipeline) inşa edilmesi gerekiyor.

---

## 1a. Ek karar (sonradan netleşti)

- [x] **Roller ayrıştırıldı:** Öğrenci (LGS/YKS ayrımı program seçimi olarak), Öğretmen, **Kaynak Üreticisi** (kitap tarayıp soru havuzunu besleyen ayrı rol) ve Veli — her birinin **ayrı giriş/kayıt akışı** olacak (tek ortak login formu değil).
- [x] **Görsel yön:** Mevcut tasarım taslağındaki "Broadsheet" (gazete/serif, sönük) stil yerine, gerçek bir "canlı öğrenim platformu" web sitesi hissi — modern, enerjik, profesyonel (amatör görünüm istenmiyor). Uygulama bu yönde yeniden tasarlanıyor; taslak sadece kavramsal referans.

## 1. Netleştirilmesi gereken kararlar (işe başlamadan önce)

- [x] **Kapsam:** Bu bir **sunum/demo** projesi (hackathon). Hız önceliklidir; "Öğretmen–Veli" gibi çok kullanıcılı roller demo için basitleştirilmiş/mock olarak da gösterilebilir.
- [x] **Telif hakkı:** Sorun yok — taranacak PDF kitaplar zaten elde bulunan, kullanım hakkı olan kaynaklar.
- [x] **Hosting/DB:** **Vercel** (Next.js) + **Supabase** (Postgres + Auth + Storage) ile deploy edilecek. Onaylandı.
- [ ] **Bütçe / Gemini model tercihi:** Varsayılan: `gemini-flash` (ucuz/hızlı, görsel destekli) günlük kullanım için; daha karmaşık soru üretimi gereken yerlerde gerekirse `gemini-pro`'ya geçilebilir. Kesinleşmemişse flash ile başlanacak.
- [ ] **OCR yaklaşımı:** Demo hızı için **Gemini'nin doğrudan multimodal görüntü anlama yeteneği** ile ilerlenecek (ayrı OCR motoruna gerek yok) — sayfa görseli doğrudan Gemini'ye gönderilip yapılandırılmış JSON (soru listesi) istenecek.

---

## 2. Mimari ve teknoloji yığını (önerilen)

- [ ] **Frontend:** Next.js (React) + TypeScript. Mevcut `Broadsheet` tasarım sistemi tokenlarını (`styles.css` içindeki `--color-*`, `--font-*`, `--space-*`, `--radius-*`) gerçek projeye taşı; `.dc.html` ekranlarındaki düzeni referans alarak gerçek React bileşenleri olarak yeniden kur (mevcut `.dc.html`/`support.js` üretim için kullanılmaz, sadece tasarım referansı).
- [ ] **Backend:** Next.js API Routes / Route Handlers (tek repo, tek dil) — ya da ayrı bir Node (Express/Fastify) servisi. OCR + AI işleri ağır olabileceğinden bu uçları **arka planda kuyruklu (async job)** çalıştıracak şekilde kur (örn. basit bir `jobs` tablosu + cron/worker, ya da Trigger.dev/Inngest).
- [ ] **Veritabanı:** PostgreSQL (Supabase). Gerekirse gömme/benzerlik araması için `pgvector` eklentisi (soru havuzunda tekrar eden/benzer soruları tespit etmek için).
- [ ] **Dosya depolama:** Taranan kitap sayfaları (görsel/PDF) ve üretilen test PDF'leri için Supabase Storage / S3.
- [ ] **Kimlik doğrulama:** Supabase Auth (öğrenci/öğretmen/veli rolleri, RLS ile veri izolasyonu).
- [ ] **Gemini API entegrasyonu:** `@google/genai` (Node) SDK. **API key kesinlikle sunucu tarafında** env variable olarak tutulmalı (`GEMINI_API_KEY`), istemciye asla gönderilmemeli.

---

## 3. Faz 1 — Temel altyapı

- [ ] Repo kurulumu (Next.js + TS + lint/format), git init, `.env.example`.
- [ ] Supabase projesi: Auth, Postgres, Storage bucket'ları (`book-scans`, `generated-pdfs`).
- [ ] Veri modeli tasarımı (ilk taslak):
  - `users` (role: student/teacher/parent), `students`, `guardians`
  - `subjects` (ders), `topics`/`outcomes` (konu/kazanım taksonomisi — YKS/LGS müfredatına göre sabit liste)
  - `questions` (soru havuzu): metin, seçenekler, doğru cevap, çözüm açıklaması, `topic_id`, `difficulty`, `source` (taranan mı, AI üretimi mi), `source_scan_id`, durum (`pending_review`/`approved`/`rejected`)
  - `scans` (yüklenen kitap sayfası/PDF, OCR durumu, ham metin)
  - `twin_state` (öğrenci bazında konu → risk skoru, zaman damgalı)
  - `chat_messages` (Soru Sor geçmişi, kazanım etiketiyle)
  - `homework`, `exams`/`denemeler`
- [ ] Rol bazlı erişim kuralları (RLS policy'leri) — öğrenci sadece kendi verisini, öğretmen/veli sadece bağlı olduğu öğrencinin özetini görebilmeli (ham sohbet/çözüm paylaşılmaz — tasarımda zaten bu ilke var: *"Paylaşılan özet. Sohbet kayıtları ve ham soru çözümleri paylaşılmaz."*).
- [ ] Temel CI: lint + typecheck + test pipeline.

---

## 4. Faz 2 — OCR ile kitap tarama → Soru Havuzu

- [ ] **Yükleme arayüzü:** Öğrenci/öğretmen kitap sayfası fotoğrafı veya PDF yükleyebilsin (çoklu sayfa desteği).
- [ ] **Ön işleme:** PDF → sayfa görsellerine dönüştürme; gerekirse kırpma/döndürme/kontrast düzeltme (`pdf-lib`/`sharp` gibi kütüphanelerle).
- [ ] **OCR/metin çıkarımı:** Gemini multimodal çağrısıyla sayfa görselini doğrudan gönderip yapılandırılmış çıktı iste (ör. JSON: `[{soru_no, soru_metni, seçenekler, cevap_anahtarı_varsa}]`). Prompt'ta Gemini'den hem OCR hem de soru sınırlarını (1, 2, 3... numaralı sorular) ayırmasını iste — ayrı bir OCR motoruna gerek kalmayabilir.
- [ ] **Yedek/ucuz yol:** Çok sayfa/yüksek hacimde maliyeti düşürmek için Tesseract.js gibi açık kaynak OCR ile önce ham metin çıkarıp, sadece segmentasyon + etiketleme için Gemini'ye gönderme seçeneğini değerlendir.
- [ ] **Kazanım/konu etiketleme:** Çıkarılan her soru için Gemini'ye "bu soru YKS/LGS müfredatındaki hangi konu/kazanıma ait?" diye sabit taksonomiye karşı sınıflandırma yaptır.
- [ ] **Zorluk tahmini:** Gemini'den 1-5 zorluk skoru + gerekçe iste (veya öğretmen manuel düzeltsin).
- [ ] **Tekrar/benzerlik kontrolü:** `pgvector` ile embedding tabanlı benzer soru tespiti, aynı sorunun havuza birden fazla girmesini engelle.
- [ ] **Moderasyon kuyruğu:** OCR+AI ile çıkarılan sorular önce `pending_review` durumunda dursun; öğretmen/admin onaylayınca `approved` olup gerçek havuza girsin (yanlış OCR/halüsinasyon riskine karşı kalite kapısı).
- [ ] **Havuz arama/filtreleme API'si:** Konuya, zorluğa, kaynağa göre sorgulanabilir hâle getir (Soru Oluştur ekranının üzerine kuracağı temel bu).

---

## 5. Faz 3 — Gemini API Chatbot ("Bota soru sor")

- [ ] **Metin + görsel soru sorma:** Öğrenci soru fotoğrafı yükleyebilsin veya yazabilsin; backend Gemini'ye gönderip adım adım çözüm istesin (mevcut tasarımdaki *"Çözüm {{curriculumName}} müfredatına göre, senin gördüğün yöntemle anlatılır"* ilkesine uygun sistem promptu yaz).
- [ ] **Sohbet geçmişi ve state:** Konuşma thread'lerini `chat_messages` tablosunda sakla; stream response (typing göstergesi tasarımda zaten var).
- [ ] **Kazanım etiketleme → dijital ikiz güncelleme:** Her yanıttan sonra hangi kazanıma dokunulduğunu tespit edip `twin_state` risk skorunu güncelleyen bir arka plan işlemi kur (bu, "Dijital İkiz" ve "Analiz" sekmelerinin canlı veri kaynağı olacak).
- [ ] **Güvenlik/guardrail:** Sistem promptunda kapsam dışı taleplere (müfredat dışı, uygunsuz içerik) karşı sınır koy; kullanıcı girişini doğrula (dosya tipi/boyut limiti, prompt injection'a karşı kullanıcı içeriğini ayrıştır).
- [ ] **Rate limiting / maliyet kontrolü:** Kullanıcı başına günlük istek limiti, API hatalarında (limit/quota) kullanıcıya anlaşılır mesaj.

---

## 6. Faz 4 — Yapay soru üretimi ve test oluşturma ("Soru Oluştur")

- [ ] **Havuzdan test derleme:** Konu + zorluk + soru sayısı seçilince havuzdan uygun soruları çek; "ikizin hata desenini ağırlıklandır" seçeneği işaretliyse öğrencinin risk skoru yüksek konulardan ağırlıklı seç.
- [ ] **AI ile yeni soru üretimi:** Havuzda yeterli soru yoksa Gemini'den, taranan kaynak metinlere/kazanım tanımına dayanarak orijinal yeni sorular + çözüm + cevap anahtarı üretmesini iste; üretileni yine moderasyon kuyruğuna düşür.
- [ ] **PDF export:** Oluşan testi PDF olarak (soru + ayrı sayfada cevap anahtarı) üret (`@react-pdf/renderer` veya `pdf-lib`).
- [ ] **Ödevlendirme entegrasyonu:** Üretilen testi öğretmenin öğrenciye/sınıfa ödev olarak atayabilmesi (Ödevler sekmesiyle bağlantı).

---

## 7. Faz 5 — Öğrenci panelinin gerçek uygulamaya taşınması

- [ ] Mevcut `.dc.html` tasarımlarındaki 8 sekmeyi (Panel, Dijital İkiz, Ödevler, Soru Sor, Soru Oluştur, Videolar, Analiz, Öğretmen–Veli) gerçek React bileşenleri olarak yeniden kur, tasarım tokenlarını koru.
- [ ] Konu ağı / risk haritası görselleştirmesi (Dijital İkiz sekmesi) için gerçek veriye bağlı bir graf/network görselleştirme bileşeni (ör. d3, visx) entegre et.
- [ ] Haftalık/aylık analiz grafikleri gerçek verilerle (Analiz sekmesi).
- [ ] Video önerileri: Gemini veya basit kural tabanlı eşleştirme ile zayıf konuya göre YouTube/kanal önerisi (tasarımda geçen Tonguç Akademi, Hocalara Geldik vb. kanallar örnek; gerçek entegrasyon YouTube Data API gerektirir).

---

## 8. Faz 6 — Öğretmen / Veli görünümü

- [ ] Öğretmen: sınıfındaki öğrencilerin özet risk haritası, ödev atama, havuza soru onaylama paneli.
- [ ] Veli: sadece haftalık özet rapor + PDF indirme (ham sohbet/çözüm paylaşılmayacak ilkesine sadık kal).
- [ ] Sınıf/ilçe/il bazlı karşılaştırma istatistikleri (tasarımda geçiyor) için agregasyon sorguları.

---

## 9. Faz 7 — Güvenlik, test, deploy

- [ ] `GEMINI_API_KEY` ve diğer sırlar sadece sunucu env'inde; asla client bundle'a sızdırma.
- [ ] Tüm kullanıcı girdileri (dosya yükleme, form) doğrulanmalı (zod ile şema doğrulama, dosya tipi/boyut kontrolü).
- [ ] Tüm public API uçlarına rate limiting.
- [ ] RLS/yetkilendirme testleri (bir öğrencinin başka öğrencinin verisine erişemediğini doğrulayan testler).
- [ ] Birim + entegrasyon testleri (OCR pipeline, soru üretim promptları, risk skor güncelleme mantığı) — özellikle AI çıktısına bağlı mantık için "golden dataset" ile regresyon testi.
- [ ] Deploy: Vercel (frontend+API) + Supabase (DB/Auth/Storage); ortam değişkenleri prod/staging ayrımı.
- [ ] Maliyet izleme: Gemini API çağrı sayısı/maliyeti için basit bir kullanım log'u/dashboard.

---

## 10. Önerilen sıralama (özet)

1. Karar netleştirme (Bölüm 1) → 2. Temel altyapı (Faz 1) → 3. OCR + Soru Havuzu (Faz 2, en özgün/riskli parça, erken doğrula) → 4. Chatbot (Faz 3) → 5. Soru/test üretimi (Faz 4) → 6. Panelin tamamının gerçek uygulamaya taşınması (Faz 5) → 7. Öğretmen/Veli (Faz 6) → 8. Sağlamlaştırma/deploy (Faz 7).

**İlk somut adım önerisi:** Bölüm 1'deki kararları netleştirip Faz 2'nin küçük bir dikey dilimini (tek bir kitap sayfası yükle → Gemini ile OCR+segmentasyon → 5 soruyu havuza yaz) uçtan uca çalışır hâle getirmek — bu, tüm mimarinin (upload, Gemini çağrısı, DB yazma) en riskli varsayımlarını erken doğrular.
