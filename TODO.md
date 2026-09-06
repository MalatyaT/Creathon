# İkiz — Yapay Zeka Destekli Sınav Koçu Platformu — Yapılacaklar Listesi

## Sıradaki adımlar (bir sonraki devam noktası)

- [ ] Deploy doğrulaması: son `vercel deploy --prod --yes` çıktısını kontrol et, canlıda `/panel/kaynak-uretici` ve `/panel/yonetici` çalıştığını doğrula.
- [ ] `/panel/veli` mock-panel deseninde eksik (bkz. aşağıdaki madde) — yapılabilir.
- [x] **Çözüldü:** `panel/ogrenci/page.tsx`'teki `createQ`/`handleGenerate` (Özel Soru Oluştur sekmesi) artık Ollama değil, RAG unification'da kurulan pgvector+Gemini yolunu (`generateRagQuestion`) kullanıyor — kullanıcının kendi isteğiyle yapıldı (Ollama, yerel modelin yüklenmesinde sık sık [4/4] adımında takılıp kalıyordu, ayrıca Türkçe matematik muhakemesinde daha önce tutarsız çıktılar verdiği zaten görülmüştü). `generateSingleQuestionAction` (`panel/ogrenci/actions.ts`) düzenlendi; kazanım listesi zaten aynı `topics` tablosundan geldiği için ingest edilen kitap konuları otomatik olarak burada da seçilebiliyor, ekstra bir bağlama gerekmedi. Artık hiçbir yerden çağrılmayan `web/src/lib/ollama.ts` ve `web/src/lib/ollama-tasks/` tamamen silindi.
- [ ] Kullanıcıdan yeni bir istek gelirse buraya eklenecek.

## UZUN VADELİ 3 ANA HEDEF (checklist — bunlar uzun sürecek, demo pivotundan bağımsız asıl ürün hedefleri)

> Mevcut kod taraması: bu üç başlığın hepsi için **kısmi/paralel scaffolding zaten var ama hiçbiri birbirine bağlı değil** — aşağıdaki checklist'ler önce "hangi yolu kalıcı kılıyoruz" kararını, sonra entegrasyonu kapsıyor.

### 1) RAG tabanlı semantik besleme ile (Kaynaklar/ PDF'leri) soru üretme

- [x] **Karar verildi ve uygulandı:** Tek kalıcı yol = **pgvector + Gemini** (embedding: `gemini-embedding-001`, 768 boyuta kısıtlanmış — `web/src/lib/gemini.ts:embedText`). Gemini vs. Ollama (qwen2.5:7b) karşılaştırıldı: Ollama Türkçe matematik/mantık muhakemesinde tutarsız/hatalı sorular üretti (sayılar sorudaki senaryoyla uyuşmuyordu, şık biçimlendirmesi bozuktu), Gemini tutarlıydı — üretim backend'i olarak **Gemini** seçildi.
- [x] **Eski/çakışan yollar kaldırıldı:** `backend/` (Python/FastAPI+Chroma+Ollama), `web/src/app/actions/ragAction.ts` (+ ondan kalan tek dangling import `panel/ogrenci/page.tsx`'te temizlendi), `web/scripts/ingest_pdfs.js`, `Kaynaklar/knowledge_base.json` (790 karakterlik sahte Matematik stub'ı içeriyordu). `web/src/lib/ollama-tasks/generate-question.ts` dokunulmadan bırakıldı — bu, RAG'dan bağımsız, hâlâ canlı olan ayrı bir özellik (`panel/ogrenci` "Soru Oluşturma" tekil önizleme akışı, `panel/ogrenci/actions.ts`).
- [x] **Matematik pilotu uçtan uca doğrulandı ("Mantık" kazanımı):** Kaynak `Kaynaklar/YKS Kaynaklar/matematik/files/search/bookText.xml` (MEB "3 Adım TYT Matematik" kitabının flipbook arama-index'i — ham PDF/OCR'dan çok daha temiz, sayfa-indeksli düz metin; 34 konu × 3 zorluk kademesi olarak yapılanmış, İçindekiler kanonik kazanım kaynağı olarak kullanıldı). `web/scripts/ingest-matematik-kazanim.ts --topic "Mantık"` ile 12 sayfadan **61 soru** çıkarılıp (`extractQuestionsFromText`, `web/src/lib/gemini-tasks/extract-questions.ts`) gerçek `topics`/`questions` satırları olarak embedding'leriyle birlikte kaydedildi. `supabase/migrations/0012_match_questions.sql` (pgvector cosine-benzerlik RPC'si) ile retrieval doğrulandı (benzerlik ~0.64-0.68 arası, gerçekten alakalı sorular döndü). Ortak retrieval+üretim modülü: `web/src/lib/gemini-tasks/generate-rag-question.ts` (`retrieveSimilarQuestions` + `generateRagQuestion`).
- [x] **UI'a bağlandı ve canlıda (dev) uçtan uca test edildi:** `/panel/soru-olustur` sayfasına, ana test akışından tamamen ayrı, "RAG pilotu — tek kazanım, tek soru (deneysel)" adında bir bölüm eklendi (`web/src/components/panel/test-builder.tsx`, server action `generateRagPreviewAction` — `web/src/app/panel/soru-olustur/actions.ts`). Kazanım seçip üretilen soruyu VE retrieval'in getirdiği referans soruları (benzerlik skoruyla) yan yana gösteriyor. Playwright ile (admin API'yle onaylı bir test öğrenci hesabı oluşturup gerçek `@supabase/ssr` `signInWithPassword` ile) gerçek bir tarayıcı oturumunda test edildi, ekran görüntüsüyle doğrulandı, konsol hatası yok.
  - **Önemli bulgu (kullanıcının sorduğu "cevap doğru mu" sorusuna doğrudan cevap):** Kazanım = "Mantık" seçilip retrieval de "Mantık" referanslarını getirince (benzerlik 0.64-0.68) üretilen soru **doğruydu ve tutarlıydı** (üç önerme üzerinden doğru hesaplanmış bir bileşik önerme sorusu, açıklama cevapla birebir örtüşüyordu). Ama test sırasında yanlışlıkla farklı bir kazanım ("Asal Sayılar" — alfabetik varsayılan) seçildiğinde, retrieval yine de (havuzda başka embedding olmadığı için) Mantık sorularını referans getirdi ve **üretilen soru hatalıydı**: "hangisinin farkı asal değildir" sorusunun bütün şıklarının farkı aslında asal çıkıyordu (geçerli bir cevap yoktu), Gemini'nin kendi açıklaması da yarıda kendini düzeltmeye çalışıyordu. **Sonuç:** RAG mekaniği (retrieval + üretim) çalışıyor, ama kazanım ile retrieval'in beslendiği veri uyuşmadığında kalite ciddi düşüyor — kalan 33 kazanım ingest edilene kadar RAG pilotu sadece "Mantık" için güvenilir.
- [ ] **Sırada:** Kalan 33 kazanım için `ingest-matematik-kazanim.ts --topic "<konu>"` tek tek çalıştırılmalı (script'teki `TOPIC_START_PAGE` tablosunda şu an ilk 17 konunun sayfa aralığı doğrulanmış durumda, geometri ağırlıklı son 17'sinin sayfa numaraları henüz teyit edilmedi — eklenmesi gerekiyor). Bu tamamlanana kadar RAG pilot UI'ı kullanıcıya (öğrenciye) açılmamalı, sadece iç test için.
- [ ] Gemini'nin üretiminde ara sıra görülen öz-düzeltme/tutarsızlık riskine karşı (yukarıdaki "Asal Sayılar" örneği) üretilen sorunun cevabının gerçekten doğru olduğunu otomatik doğrulayan bir adım (ör. ikinci bir Gemini çağrısıyla çapraz kontrol) değerlendirilebilir — şu an yok, sadece insan gözüyle kontrol var.
- [ ] Üretilen sorular şu an ingestion'da doğrudan `approved` — canlı kullanıcıya sunulacaksa (RAG referansı değil, havuz sorusu olarak) ayrı bir moderasyon adımı değerlendirilmeli.
- [ ] Diğer derslere (Kimya/Biyoloji/Coğrafya/Fizik) aynı desen uygulanabilir ama her birinin kendi `bookText.xml`-benzeri temiz kaynağı bulunmalı/doğrulanmalı — Matematik dışındakiler için henüz bakılmadı.

### 2) Atılan soruyu çözüp değerlendirme yapma (sınav kağıdı puanlama)

Şu an öğretmen panelindeki "Kağıt Puanlama" sekmesi **tamamen mock** (TODO.md'de zaten böyle işaretli) — gerçek OCR/puanlama yok, `exams`/deneme sonucu girme ekranı da hiç yok.

- [ ] Cevap kağıdı görsel/PDF yükleme UI (optik form ya da yazılı kağıt, öğretmen tarafı).
- [ ] OCR: kaynak-üretici ekranındaki (`scan-upload.tsx`) Gemini multimodal desenini tekrar kullanarak kağıttaki işaretli/yazılı cevapları yapılandırılmış JSON'a çıkarma (optik formda şık tespiti; açık uçlu/el yazısında cevap metni okuma).
- [ ] Hangi sınav/teste ait olduğunu belirleyip (mevcut `exams`/`homework`'e bağla) cevap anahtarına karşı otomatik puanlama: doğru/yanlış/boş sayımı + soru bazlı doğru-yanlış tablosu.
- [ ] Düşük OCR güven skorunda öğretmen onayı/manuel düzeltme adımı (yanlış puanlama riskine karşı kalite kapısı — mevcut kaynak-üretici moderasyon ilkesiyle aynı).
- [ ] Sonuçları yeni bir `question_attempts` tablosuna yazma (student_id, question_id, topic_id, difficulty, chosen_answer, is_correct, created_at) — **bu, Track 3'ün ihtiyaç duyduğu gerçek doğru/yanlış verisinin ilk kaynağı olacak** (şu an sadece chat frekans sinyali var, gerçek doğruluk verisi yok).
- [ ] Analiz sekmesindeki şu an kasıtlı boş bırakılan "deneme net ortalaması" ve sınıf/il/ilçe karşılaştırmasını bu gerçek veriyle doldurma.

### 3) Dijital ikiz için nöral ağ — öğrencinin yerine soru çözüp benzer hataları yapan model

Şu an `lib/twin.ts` sadece **basit sıklık tabanlı risk skoru** (chat'te bir konu tekrar sorulunca +6 puan) — gerçek doğru/yanlış verisi yok, gerçek bir tahmin modeli yok. **Bu track, Track 2'nin ürettiği `question_attempts` verisi olmadan anlamlı şekilde eğitilemez — sırada Track 2'den sonra gelmeli.**

- [ ] Veri biriktikçe soğuk-başlangıç: önce basit istatistiksel model (konu+zorluk bazlı doğru cevap oranı, IRT/Elo benzeri) — hackathon süresinde tek öğrenci başına "gerçek derin öğrenme modeli" için yeterli veri olması gerçekçi değil, bu riski şimdiden not düşüyorum.
- [ ] Asıl model: öğrenciler-arası ortak bir temel model (soru embedding'i + konu + zorluk → genel zorluk/yanlış-yapma olasılığı) + öğrenciye özgü küçük bir kişiselleştirme terimi (o öğrencinin geçmiş doğru/yanlış paterni) — tek öğrenci için sıfırdan ayrı bir ağ yerine, overfit riskini azaltan bu paylaşımlı yaklaşım öneriliyor.
- [ ] (Opsiyonel, veri yeterliyse) hangi çeldiriciye yöneldiğini de tahmin eden ikinci bir sınıflandırıcı — şu an prompt'lara elle yazılan `twinHint` ("sınır açısı hatası" gibi) metinlerinin yerini gerçek veriden türeyen bir sinyal alacak.
- [ ] Servis: `backend/` (Python/FastAPI) zaten var, model eğitimi/inference için bu kullanılabilir (Track 1 kararına bağlı — Python yolu kalkarsa bu da Node tarafına, ör. basit bir lojistik regresyon/TensorFlow.js'e taşınmalı).
- [ ] "İkiz soru çözüyor" deneyimi: üretilen/havuzdaki bir soru için modelin "bu öğrenci doğru mu yanlış mı yapardı, hangi şıkka yönelirdi" tahminini Dijital İkiz ekranında ve soru üretiminde çeldirici ağırlıklandırmada kullanma.
- [ ] Basit bir holdout/değerlendirme: modelin tahminiyle gerçek sonucu karşılaştırıp doğruluk ölçme.

## CANLI: sunum pivotu + deploy

- [x] **Sunum odaklı yeniden tasarım** (eşzamanlı bir oturumda yapıldı, ben doğrulayıp push ettim): landing page ve öğrenci paneli, tek dosyalık sekmeli, mock/örnek veriye dayalı bileşenlere dönüştürüldü (`/panel/ogrenci`) — yeşil/sarı marka paleti (`renkpaleti.png`: #FAFAFA/#15803D/#EAB308). Giriş sayfaları artık gerçek kimlik doğrulamayı atlayıp doğrudan `/panel/[rol]`'e yönlendiriyor. Eşzamanlı oturum, öğrenci panelindeki "Soru Sor" sekmesini gerçek Gemini + session kaydına bağlamak üzerinde çalışıyor (`lib/twin.ts`, `lib/supabase/admin.ts`, `panel/ogrenci/actions.ts`) — ben o dosyalara dokunmuyorum.
- [x] **Öğretmen demo paneli** (`/panel/ogretmen`, benim işim): aynı görsel dilde, 8 istenen bölüm — Soru Oluşturma, Sınav Oluşturma, Analiz, Ödevlendirme, Kağıt Puanlama (cevap kağıdı yükle → yapay zeka puanlar, mock), Kaynak Yönetme, Sınıf Yönetme, Kazanım/Müfredat Yönetme — artı genel Panel özeti.
- [x] **Vercel'e deploy edildi**: proje `3-d9/web` olarak bağlı, prod/preview/development ortamlarına `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` eklendi. Canlı URL: **https://web-liard-seven-80.vercel.app** — landing + `/panel/ogrenci` + `/panel/ogretmen` doğrulandı, konsol hatası yok.
- [x] **Kaynak Üreticisi demo paneli** (`/panel/kaynak-uretici`, benim işim): Panel/Kaynak Ekle (kitap adı+kategori+sayfa yükle → mock tarama sonucu)/Soru Değerlendirme (onay bekleyen sorular kuyruğu, Onayla/Reddet ile listeden düşüyor — gerçekten interaktif, Playwright ile doğrulandı) sekmeleri.
- [x] **Yönetici demo paneli** (`/panel/yonetici`, benim işim, kullanıcının istediği "üst yetkili" profil): Panel/Öğretmen Atama (öğretmen→sınıf atama formu, çalışıyor)/Sınıflar (sınıf bazlı özet)/Kazanım-Müfredat Yönetimi sekmeleri.
- [x] Landing page'e 4. kart eklendi ("Yönetici"), grid `sm:grid-cols-2 lg:grid-cols-4` oldu. Commit: "feat: Kaynak Üreticisi + Yönetici demo paneller, landing page 4. kart", push'landı.
- [x] `/giris/kaynak-uretici` artık çalışıyor (üstteki maddeyle 404 giderildi).
- [ ] `/giris/veli` hâlâ `/panel/veli`'ye yönlendiriyor ama bu sayfa yeni mock-panel deseninde henüz yok (404) — sadece eski gerçek-veri `/veli` route'u var. Aynı desende bir `/panel/veli` yapılmalı.
- [ ] Bu pivotla birlikte benim daha önce inşa ettiğim gerçek-veriye-bağlı sayfalar (`/panel/ikiz`, `/panel/analiz`, `/panel/odevler`, `/panel/soru-olustur`, `/panel/videolar`, `/ogretmen`, `/veli`, `/kaynak-uretici`) navigasyondan koptu ama silinmedi — hâlâ doğrudan URL ile erişilebilir ve çalışır durumda.
- [x] `vercel deploy --prod --yes` ile yeni panellerin (kaynak-uretici, yonetici) canlıya çıkarılması yapıldı (repo kökünden çalıştırıldı — proje `rootDirectory=web` ayarına sahip olduğu için `web/` içinden değil kökten deploy edilmesi gerekiyor).

---

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

## GitHub / Supabase bağlantısı

- [x] Kod, `https://github.com/MalatyaT/Creathon` (private) reposuna push edildi — tek repo, kök dizinde `web/` (Next.js), `supabase/migrations/` ve bu TODO.
- [x] Supabase projesi canlı ve tamamen bağlı: `https://nqpgvvzkpbmfeorinhfi.supabase.co`. `anon`/`service_role` key'leri ve DB şifresi `.env.local`'da (repoya girmiyor). `supabase/migrations/0001-0006` doğrudan Postgres bağlantısıyla (CLI yok, `pg` ile script) uygulandı ve doğrulandı.
- [x] Gerçek kayıt/giriş, OCR→havuz kaydı ve chatbot→kaynak referansı canlı projeye karşı uçtan uca test edildi (bkz. aşağıdaki "Bu oturumda tamamlananlar — devam" bölümü).
- [ ] Vercel'e deploy ederken aynı üç Supabase env değişkeni + `GEMINI_API_KEY` orada da tanımlanmalı.
- [ ] **Öneri:** Supabase Dashboard → Authentication → Providers → Email → "Confirm email" kapatılsın. Şu an açık; gerçek `signUp` (demo modu değil, Supabase bağlandıktan sonraki gerçek kayıt) e-posta onayı bekliyor ve **Supabase'in ücretsiz plandaki e-posta gönderme limiti çok düşük** ("email rate limit exceeded" — birkaç denemede doldu). Kapatılırsa kayıt anında oturum açılıyor, sunum için çok daha hızlı ve limit sorunu da ortadan kalkıyor.

## Bu oturumda tamamlananlar — devam (Supabase canlıya alındıktan sonra)

- [x] **Kritik RLS düzeltmesi**: `scans` tablosu sadece yükleyene (`uploaded_by = auth.uid()`) açıktı — bu yüzden chatbot'un kaynak önerisi başka bir kullanıcının taradığı sayfaları hiç göremiyordu, referans hep boş dönüyordu. `supabase/migrations/0005`: işlenmiş (`status='done'`) taramalar artık herkese okunabilir, yazma hâlâ sadece yükleyene ait. Bu düzeltmeden sonra chatbot gerçekten "📖 Test Soru Bankası, s. 12" gibi referanslar veriyor — canlı projeye karşı doğrulandı.
- [x] Kaynak Üreticisi ekranındaki "X soru havuza eklendi" başarı mesajı, `questions` state'i sıfırlanınca aynı render'da kayboluyordu (mesaj hiç görünmeden siliniyordu) — düzeltildi.
- [x] **Dijital İkiz** (`/panel/ikiz`): gerçek `twin_state` verisiyle konu risk haritası (ısı skalası) + `chat_messages`'tan gerçek "İkizin çözüm akışı" (tıkla-genişlet, kaynak referansı dahil). Her chat yanıtından sonra `lib/twin.ts` ilgili konunun risk skorunu artırıyor (basit frekans sinyali — chat doğru/yanlış bilgisi vermiyor, bu yüzden "soruldukça risk artar" yaklaşımı kullanıldı; gerçek taksonomi geldiğinde iyileştirilebilir). `twin_state` şemasına da `topic_label` serbest metin + eksik olan insert/update RLS politikaları eklendi (migration 0006).
- [x] Rakip inceleme: `okulistik.com` (WebFetch ile) — MEB uyumlu soru bankası, video dersler, ödev, optik okuma, öğretmen/veli/yönetici panelleri, yapay zekâ ile sınav analizi sunuyor. Bizim tasarım taslağımızdaki kapsamla (soru havuzu, video öneri, ödev, öğretmen/veli, AI analiz) örtüşüyor — yeni bir özellik kategorisi çıkmadı, mevcut Faz 5 planı geçerli.

### Faz 5 — kalan sekmeler (orijinal tasarımdan, öncelik sırasıyla)

Tasarım dosyasındaki tam bölümler: `Ogrenci Paneli.dc.html` satır 84 (Panel/ana sayfa), 164 (Dijital İkiz ✅), 297 (Ödevler), 380 (Soru Oluştur ✅), 453 (Videolar), 472 (Analiz), 589 (Öğretmen-Veli — artık ayrı portallar).

- [x] **Soru Oluştur** (`/panel/soru-olustur`): konu+zorluk+adet seçilince önce havuzdan çekiyor (kaynak kitap/sayfasını 📖 rozetiyle gösteriyor), yetersizse Gemini ile ("İkizimin hata desenini ağırlıklandır" işaretliyse `twin_state` risk skorunu prompta katarak) yeni soru üretip ✨ rozetiyle işaretliyor, cevap anahtarı + `window.print()` ile PDF indirme. Canlı projeye karşı doğrulandı; bu arada kaynak üreticisinin kaydettiği sorular artık doğrudan `approved` (ayrı bir öğretmen onay ekranı olmadığından, tarama-inceleme ekranının kendisi moderasyon adımı sayıldı).
- [x] **Ödevler** (`/panel/odevler`, satır 297): Soru Oluştur'daki "Ödev olarak ata" AI-üretimli soruları önce havuza yazıp `homework.question_ids`'e bağlıyor; öğrenci listesini tıkla-tamamla (reload gerektirmeden, `homework` UPDATE RLS policy'si hiç yoktu, eklendi) ve "İşlenmiş kaynaklar" etiketleriyle görüyor.
- [x] **Panel (ana sayfa)** (satır 84): gerçek hero risk ortalaması, toplam soru/ödev istatistikleri, `twin_state`'ten türetilen "İkizin bugün öne çıkardığı konular", bekleyen ödev özeti, zayıf-üç-konu bar grafiği.
- [x] **Analiz** (`/panel/analiz`, satır 472): risk ortalaması + toplam soru/konu, haftalık soru-çözme bar grafiği (`chat_messages` zaman damgalarından uygulama içinde gruplanıyor), güçlü/zayıf konular. Deneme (net ortalaması) ve sınıf/ilçe/il karşılaştırması **kasıtlı olarak boş** — deneme girişi ekranı yok, çok öğrencili gerçek karşılaştırma verisi de yok; uydurulmadı.
- [x] **Videolar** (`/panel/videolar`, satır 453): YouTube Data API bağlı değil — sahte video başlığı/kanal/süre uydurmak yerine her zayıf konu için gerçek bir YouTube arama linki veriyor (tıklayınca gerçek sonuçlar çıkıyor); gerçek, bilinen kanal isimleri (Tonguç Akademi vb.) sadece öneri metni olarak geçiyor.
- [x] **Öğretmen paneli** (`/ogretmen`): e-posta ile öğrenci ekleme (admin API + `student_links` — INSERT policy'si hiç yoktu, eklendi), sınıf risk özeti, öğrenci bazlı risk/ödev, gerçek veriden türeyen "Haftanın notları". **Önemli:** `chat_messages`'a kasıtlı olarak dokunmuyor — "sohbet kayıtları paylaşılmaz" ilkesi gereği o tablonun RLS'i öğretmene zaten kapalı; aktivite ölçütü olarak `twin_state.sample_count` kullanılıyor.
- [x] **Görsel reskin + ortak sidebar**: marka renkleri mor/turkuazdan yeşil/kahveye çevrildi (`brand-green`/`brand-coffee`, sıcak kahve tonlu arka plan); `/panel/*` altındaki tüm sayfalar artık ortak bir sol sidebar layout'unda (`app/panel/layout.tsx`) — her sayfanın kendi geri-linki/başlığı/çıkış butonu yerine tek yerden.
- [x] Bu oturumda **canlı projeye karşı bulunup düzeltilen RLS/kod hataları** (hepsi Playwright ile uçtan uca test edilerek yakalandı): `scans` sadece yükleyene açıktı (kaynak referansı hiç çalışmıyordu), `twin_state`/`homework`'te insert/update policy'si yoktu, `profiles`'ta linked-teacher okuma policy'si yoktu, `student_links`'te insert policy'si yoktu, Soru Oluştur'da havuz+AI soruları birleşirken soru numaraları atlıyordu, Kaynak Üreticisi'nin başarı mesajı render'da kayboluyordu, haftalık bar grafiğinin barları CSS yüzde-yükseklik sorunundan hiç görünmüyordu, bozuk bir lockfile `tslib` eksikliğiyle build'i kırıyordu.

**Not (eşzamanlı oturum):** `Kaynaklar/` klasöründe gerçek TYT/AYT soru bankası PDF'leri ve `supabase/migrations/0008_book_category.sql` (kitap kategorisi/ders adı sütunları) başka bir oturumun devam eden toplu OCR ingestion işi — bunlara dokunulmadı, bu oturumun commit'lerine dahil edilmedi.

### Kalan açık işler
- [ ] Vercel'e deploy + prod env değişkenleri.
- [ ] Gerçek `topics` taksonomisi + `topic_label`'ları gerçek `topic_id`'ye eşleme (şu an serbest metin).
- [ ] Kaynak eşleştirmesi (chatbot RAG) gerçek pgvector benzerlik aramasına geçmeli — havuz büyüdükçe "son N tarama" yaklaşımı yetersiz kalacak.
- [ ] Chat/Soru Oluştur yanıtlarında markdown/LaTeX render edilmiyor (düz metin olarak basılıyor) — `react-markdown` + KaTeX eklenebilir.
- [ ] Deneme (exam) sonucu girme ekranı yok — Analiz'deki "net ortalaması" ve sınıf/ilçe/il karşılaştırması bu yüzden boş.
- [ ] Veli portalı hiç başlanmadı (şema `parent` rolünü destekliyor, UI yok).
- [ ] Öğretmenin soru havuzunu onaylaması için ayrı bir ekran yok (şu an kaynak üreticisinin kendi incelemesi tek kalite kapısı).

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
