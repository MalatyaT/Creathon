import { supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import type { ExtractedQuestion } from "@/lib/schemas/extraction";

export type RelatedSource = {
  bookTitle: string;
  pageNumber: number | null;
  summary: string;
  sampleQuestions: string[];
};

/**
 * Taranan kaynaklardan (henüz gerçek embedding/benzerlik araması yok) en güncel
 * birkaç tanesini özet+örnek sorularıyla getirir. Sohbet promptuna bağlam olarak
 * eklenip ilgisi olup olmadığına Gemini'nin kendisi karar verir (bkz.
 * answer-question.ts) — Supabase bağlı değilse veya hiç onaylı tarama yoksa boş
 * dizi döner, chatbot da referans vermez.
 */
export async function findRelatedSources(limit = 15): Promise<RelatedSource[]> {
  if (!supabaseConfigured()) return [];

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
      ? (row.raw_extraction as ExtractedQuestion[])
          .slice(0, 3)
          .map((q) => q.question_text)
      : [],
  }));
}
