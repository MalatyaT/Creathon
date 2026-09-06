// Tek-kazanım ingestion pilotu (RAG unification, Track 1 — bkz. TODO.md).
// Kaynak: Kaynaklar/YKS Kaynaklar/matematik/files/search/bookText.xml — "3 Adım TYT
// Matematik" kitabının flipbook-arama index'inden çıkan temiz, sayfa-indeksli düz metin
// (ham PDF/OCR'dan çok daha temiz). Kitabın kendi İçindekiler'i güvenilir bir kazanım
// taksonomisi kaynağı olduğu için Gemini'nin serbest topic_label tahminine güvenmek yerine
// her sayfaya BURADAN kanonik konu adı atanıyor.
//
// Kullanım: npx tsx scripts/ingest-matematik-kazanim.ts --topic "Mantık"
import { loadEnvLocal } from "./lib/load-env";
loadEnvLocal();

import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/gemini";
import { extractQuestionsFromText } from "@/lib/gemini-tasks/extract-questions";

const BOOK_TITLE = "3 Adım TYT Matematik";
const BOOK_TEXT_PATH = path.join(
  __dirname,
  "..",
  "..",
  "Kaynaklar",
  "YKS Kaynaklar",
  "matematik",
  "files",
  "search",
  "bookText.xml",
);

// Kitabın kendi cevap anahtarı bölümünden (bookText.xml, sayfa 217-220 — tüm 34 konuyu
// sırasıyla listeliyor) VE her sayfanın başlığından ("MATEMATİK TYT N. ADIM <konu>")
// tek tek doğrulanmış konu → başlangıç sayfası eşlemesi. Her konu tam 6 sayfa sürüyor
// (1./2./3. ADIM'ın her biri 2 sayfa: TYT N. başlık sayfası + devamı) — ÖNEMLİ: ilk
// sürümde bu yanlışlıkla 12 sayfa varsayılmıştı, bu da "Mantık" ingestion'ının aslında
// bir sonraki konunun (Kümeler) içeriğini de "Mantık" diye etiketlemesine yol açmıştı;
// o veri silinip (bkz. TODO.md) doğru aralıkla yeniden ingest edildi.
const TOPIC_START_PAGE: Record<string, number> = {
  "Mantık": 13,
  "Kümeler": 19,
  "Temel Kavramlar, Sayı Basamakları, Sayı Kümeleri-1": 25,
  "Temel Kavramlar, Sayı Basamakları, Sayı Kümeleri-2": 31,
  "Bölme - Bölünebilme Kuralları": 37,
  "EBOB - EKOK, Periyodik Olarak Tekrar Eden Durumlar": 43,
  "Birinci Dereceden Denklem ve Eşitsizlikler-1": 49,
  "Birinci Dereceden Denklem ve Eşitsizlikler-2": 55,
  "Mutlak Değer": 61,
  "Üslü ve Köklü İfadeler - 1": 67,
  "Üslü ve Köklü İfadeler - 2": 73,
  "Oran ve Orantı": 79,
  "Sayı, Kesir, Yaş, İşçi Problemleri - 1": 85,
  "Sayı, Kesir, Yaş, İşçi Problemleri - 2": 91,
  "Kar-Zarar, Yüzde, Karışım, Hareket Problemleri-1": 97,
  "Kar-Zarar, Yüzde, Karışım, Hareket Problemleri-2": 103,
  "Veri - 1": 109,
  "Veri - 2": 115,
  "Permütasyon, Kombinasyon, Binom": 121,
  "Olasılık": 127,
  "Fonksiyon Kavramı ve Özellikleri": 133,
  "Polinomlar ve Çarpanlara Ayırma": 139,
  "İkinci Dereceden Denklemler, Karmaşık Sayılar": 145,
  "Üçgende Temel Kavramlar, Üçgen Eşitsizliği, Üçgenin Yardımcı Elemanları": 151,
  "Üçgende Eşlik ve Benzerlik": 157,
  "Üçgenler": 163,
  "Dik Üçgen ve Trigonometri": 169,
  "Üçgenin Alanı": 175,
  "Çokgen ve Dörtgenlerin Özellikleri": 181,
  "Yamuk, Paralelkenar": 187,
  "Eşkenar Dörtgen, Dikdörtgen": 193,
  "Kare, Deltoid": 199,
  "Dörtgenler": 205,
  "Katı Cisimler - Prizmalar": 211,
};
const TOPIC_ORDER = Object.keys(TOPIC_START_PAGE);
const PAGE_SPAN = 6;

function parseArgs() {
  const args = process.argv.slice(2);
  const topicIdx = args.indexOf("--topic");
  const topic = topicIdx !== -1 ? args[topicIdx + 1] : "Mantık";
  return { topic };
}

function parseBookPages(): Map<number, string> {
  const raw = fs.readFileSync(BOOK_TEXT_PATH, "utf-8");
  const pages = new Map<number, string>();
  const pageRegex = /<page Index="(\d+)"><!\[CDATA\[([\s\S]*?)\]\]><\/page>/g;
  let match: RegExpExecArray | null;
  while ((match = pageRegex.exec(raw)) !== null) {
    pages.set(Number(match[1]), match[2]);
  }
  return pages;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { topic } = parseArgs();
  const startPage = TOPIC_START_PAGE[topic];
  if (startPage === undefined) {
    throw new Error(
      `"${topic}" için doğrulanmış sayfa aralığı yok. Desteklenen konular: ${TOPIC_ORDER.join(", ")}`,
    );
  }
  const endPage = startPage + PAGE_SPAN - 1;

  console.log(`Konu: "${topic}" — sayfa ${startPage}-${endPage}`);
  const pages = parseBookPages();
  const supabase = createAdminClient();

  const { data: subject, error: subjectError } = await supabase
    .from("subjects")
    .select("id")
    .eq("name", "Matematik")
    .maybeSingle();
  if (subjectError || !subject) {
    throw new Error(
      `"Matematik" dersi subjects tablosunda bulunamadı (migration 0010 uygulanmış mı?): ${subjectError?.message ?? ""}`,
    );
  }

  const { data: existingTopic } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subject.id)
    .eq("name", topic)
    .maybeSingle();

  let topicId = existingTopic?.id as string | undefined;
  if (!topicId) {
    const { data: newTopic, error: topicError } = await supabase
      .from("topics")
      .insert({ subject_id: subject.id, name: topic })
      .select("id")
      .single();
    if (topicError || !newTopic) throw new Error(`Kazanım (topic) oluşturulamadı: ${topicError?.message}`);
    topicId = newTopic.id;
    console.log(`Yeni topics satırı oluşturuldu: ${topicId}`);
  } else {
    console.log(`Mevcut topics satırı kullanılıyor: ${topicId}`);
    // Toplu (33 konu) koşuda kota bitip script yarıda kesilirse, yeniden çalıştırıldığında
    // zaten işlenmiş konuları atlasın diye: bu kazanımda halihazırda soru varsa bir daha işleme.
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId);
    if (count && count > 0) {
      console.log(`"${topic}" için zaten ${count} soru var — atlanıyor (yeniden ingest edilmedi).`);
      return;
    }
  }

  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "content_creator")
    .limit(1)
    .maybeSingle();
  const { data: anyProfile } = creatorProfile
    ? { data: creatorProfile }
    : await supabase.from("profiles").select("id").limit(1).maybeSingle();
  const uploaderId = (creatorProfile ?? anyProfile)?.id as string | undefined;
  if (!uploaderId) {
    throw new Error(
      "profiles tablosunda hiç satır yok — scans.uploaded_by NOT NULL olduğu için en az bir kullanıcının " +
        "(tercihen content_creator rolüyle) uygulamada bir kez kayıt olmuş/giriş yapmış olması gerekiyor.",
    );
  }

  // Önceki yarım kalmış bir çalıştırmadan kalan boş bir scan varsa onu tekrar kullan
  // (script bir sayfa/soru ortasında hata verip durursa aynı konu için tekrar
  // koşulduğunda scans tablosunu gereksiz çoğaltmasın diye).
  const { data: existingScan } = await supabase
    .from("scans")
    .select("id")
    .eq("book_title", BOOK_TITLE)
    .eq("page_number", startPage)
    .maybeSingle();

  let scanId = existingScan?.id as string | undefined;
  if (scanId) {
    console.log(`Mevcut scans satırı yeniden kullanılıyor: ${scanId}`);
  } else {
    const { data: scan, error: scanError } = await supabase
      .from("scans")
      .insert({
        uploaded_by: uploaderId,
        storage_path: `book-ingestion/${BOOK_TEXT_PATH}`,
        status: "done",
        book_title: BOOK_TITLE,
        page_number: startPage,
        summary: `${topic} konusu — otomatik kitap ingestion (bkz. ingest-matematik-kazanim.ts)`,
        category: "tyt",
        subject_name: "Matematik",
        processed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (scanError || !scan) throw new Error(`scans satırı oluşturulamadı: ${scanError?.message}`);
    scanId = scan.id;
    console.log(`scans satırı oluşturuldu: ${scanId}`);
  }

  let savedCount = 0;
  for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
    const pageText = pages.get(pageIndex)?.trim();
    if (!pageText || pageText.length < 200) {
      console.log(`  sayfa ${pageIndex}: çok kısa/boş, atlandı`);
      continue;
    }

    console.log(`  sayfa ${pageIndex}: Gemini ile çıkarılıyor...`);
    const { questions } = await extractQuestionsFromText(pageText);
    if (questions.length === 0) {
      console.log(`  sayfa ${pageIndex}: soru bulunamadı`);
      await sleep(2500);
      continue;
    }

    for (const q of questions) {
      const embedding = await embedText(`${q.question_text} ${topic}`);
      const { error: insertError } = await supabase.from("questions").insert({
        topic_id: topicId,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        source: "scan",
        source_scan_id: scanId,
        status: "approved",
        created_by: uploaderId,
        category: "tyt",
        subject_name: "Matematik",
        question_type: "multiple_choice",
        topic_label: topic,
        embedding,
      });
      if (insertError) {
        console.error(`  soru kaydedilemedi: ${insertError.message}`);
        continue;
      }
      savedCount++;
      await sleep(800);
    }

    await sleep(2500); // Gemini free-tier rate limit'e takılmamak için (kota zayıf, temkinli tempo)
  }

  console.log(`\nToplam ${savedCount} soru kaydedildi (embedding dahil).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
