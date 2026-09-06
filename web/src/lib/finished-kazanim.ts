import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "Bitmiş" kazanım = pgvector embedding'i olan en az bir soruya sahip topic — yani
 * gerçekten kitap-ingestion'dan geçmiş, RAG retrieval'inin güvenilir çalıştığı kazanım
 * (bkz. TODO.md Track 1, "Asal Sayılar" örneği: embedding'i olmayan bir kazanım seçilince
 * retrieval yanlış konudan referans getirip hatalı soru üretiyordu). Sitede sadece bu
 * kazanımlar ve bunlara sahip dersler gösterilir, geri kalanı boş/yarım taksonomi taslağı.
 */
export async function listFinishedTopicIds(supabase: SupabaseClient): Promise<Set<string>> {
  const { data } = await supabase
    .from("questions")
    .select("topic_id")
    .not("embedding", "is", null)
    .not("topic_id", "is", null);
  return new Set((data ?? []).map((row) => row.topic_id as string));
}

export async function listFinishedSubjectIds(supabase: SupabaseClient): Promise<Set<string>> {
  const finishedTopicIds = await listFinishedTopicIds(supabase);
  if (finishedTopicIds.size === 0) return new Set();

  const { data } = await supabase
    .from("topics")
    .select("subject_id")
    .in("id", Array.from(finishedTopicIds));
  return new Set((data ?? []).map((row) => row.subject_id as string));
}
