import { supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/gemini";
import type { ExtractedQuestion } from "@/lib/schemas/extraction";

export type RelatedSource = {
  bookTitle: string;
  pageNumber: number | null;
  summary: string;
  sampleQuestions: string[];
  topicName: string | null;
};

// Bu benzerlik eşiğinin altında kalan eşleşmeler alakasız kabul edilir (bkz. TODO.md
// Track 1 — "Mantık" pilotunda gerçekten ilgili eşleşmeler 0.64-0.68 bandında çıkmıştı).
const SIMILARITY_THRESHOLD = 0.55;

/**
 * Öğrencinin sorusunu embed edip havuzdaki (pgvector, migration 0012/0013) gerçekten en
 * benzer soruyu bulur, oradan kazanım adı + kaynak kitap/sayfa bilgisini döndürür — "son N
 * taramanın özeti" gibi kaba bir sezgisel değil, gerçekten o soruya en yakın kaynak. Sadece
 * embedding'i olan (bkz. lib/finished-kazanim.ts) dersler için çalışır; eşleşme yoksa boş
 * dizi döner ve eski (son taramalar) sezgisel devreye girer.
 */
async function retrieveEmbeddedSources(questionText: string, limit: number): Promise<RelatedSource[]> {
  const supabase = await createClient();
  const queryEmbedding = await embedText(questionText);

  const { data: matches, error } = await supabase.rpc("match_questions_with_source", {
    query_embedding: queryEmbedding,
    match_count: limit,
  });
  if (error || !matches) return [];

  const relevant = (matches as Array<Record<string, unknown>>).filter(
    (m) => (m.similarity as number) >= SIMILARITY_THRESHOLD,
  );
  if (relevant.length === 0) return [];

  const scanIds = [...new Set(relevant.map((m) => m.source_scan_id as string).filter(Boolean))];
  const topicIds = [...new Set(relevant.map((m) => m.topic_id as string).filter(Boolean))];

  const [{ data: scans }, { data: topics }] = await Promise.all([
    scanIds.length
      ? supabase.from("scans").select("id, book_title, page_number, summary").in("id", scanIds)
      : Promise.resolve({ data: [] as Array<{ id: string; book_title: string | null; page_number: number | null; summary: string | null }> }),
    topicIds.length
      ? supabase.from("topics").select("id, name").in("id", topicIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const scanById = new Map((scans ?? []).map((s) => [s.id, s]));
  const topicById = new Map((topics ?? []).map((t) => [t.id, t]));

  const seenScanIds = new Set<string>();
  const sources: RelatedSource[] = [];
  for (const m of relevant) {
    const scanId = m.source_scan_id as string | null;
    if (scanId && seenScanIds.has(scanId)) continue;
    if (scanId) seenScanIds.add(scanId);

    const scan = scanId ? scanById.get(scanId) : undefined;
    const topic = m.topic_id ? topicById.get(m.topic_id as string) : undefined;
    sources.push({
      bookTitle: scan?.book_title ?? "Soru Havuzu",
      pageNumber: scan?.page_number ?? null,
      summary: scan?.summary ?? "",
      sampleQuestions: [m.question_text as string],
      topicName: topic?.name ?? (m.topic_label as string | null) ?? null,
    });
  }
  return sources;
}

/**
 * Eski sezgisel: en güncel işlenmiş taramaların özet+örnek sorularını getirir. Embedding
 * araması hiç eşleşme bulamazsa (henüz ingest edilmemiş bir ders/konu) yedek olarak kullanılır.
 */
async function retrieveRecentScanSources(limit: number): Promise<RelatedSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scans")
    .select("book_title, page_number, summary, raw_extraction")
    .not("summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => ({
    bookTitle: row.book_title ?? "Bilinmeyen kaynak",
    pageNumber: row.page_number,
    summary: row.summary ?? "",
    sampleQuestions: Array.isArray(row.raw_extraction)
      ? (row.raw_extraction as ExtractedQuestion[]).slice(0, 3).map((q) => q.question_text)
      : [],
    topicName: null,
  }));
}

export async function findRelatedSources(questionText: string, limit = 5): Promise<RelatedSource[]> {
  if (!supabaseConfigured()) return [];

  try {
    const embedded = await retrieveEmbeddedSources(questionText, limit);
    if (embedded.length > 0) return embedded;
  } catch {
    // Embedding tabanlı arama başarısız olursa (Gemini/RPC hatası) sezgisele düşülür.
  }

  return retrieveRecentScanSources(limit * 3);
}
