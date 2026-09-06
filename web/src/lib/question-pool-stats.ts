import type { SupabaseClient } from "@supabase/supabase-js";

export type SubjectPoolStat = {
  subjectName: string;
  total: number;
  approved: number;
  pendingReview: number;
};

export type QuestionPoolStats = {
  total: number;
  approved: number;
  pendingReview: number;
  rejected: number;
  bySubject: SubjectPoolStat[];
};

/**
 * Kaynak Yöneticisi/Yönetici panellerindeki "kaç soru var" istatistikleri artık `questions`
 * tablosundan gerçek sayılıyor (bkz. kullanıcı isteği: "genel ve soru bazlı gerçek verilerden
 * gidelim") — önceden ikisi de sabit ("946 soru" gibi) mock metindi. Grup-bazlı sayım için
 * ayrı bir RPC yazmak yerine (ölçek küçük, ~1000-2000 satır) sadece status+subject_name
 * kolonlarını çekip JS'te grupluyoruz.
 */
const PAGE_SIZE = 1000;

export async function getQuestionPoolStats(supabase: SupabaseClient): Promise<QuestionPoolStats> {
  // PostgREST varsayılan olarak tek istekte en fazla 1000 satır döndürür — havuz bunu
  // aştığı için (bkz. gerçek test: 1149 soru, ilk sürüm sessizce 1000'de kesiyordu) sayfalayarak
  // hepsini çekiyoruz.
  const rows: Array<{ status: string | null; subject_name: string | null }> = [];
  let from = 0;
  while (true) {
    const { data } = await supabase
      .from("questions")
      .select("status, subject_name")
      .range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  const bySubjectMap = new Map<string, SubjectPoolStat>();
  let approved = 0;
  let pendingReview = 0;
  let rejected = 0;

  for (const row of rows) {
    const subjectName = row.subject_name ?? "Diğer";
    const entry = bySubjectMap.get(subjectName) ?? { subjectName, total: 0, approved: 0, pendingReview: 0 };
    entry.total += 1;
    if (row.status === "approved") {
      entry.approved += 1;
      approved += 1;
    } else if (row.status === "pending_review") {
      entry.pendingReview += 1;
      pendingReview += 1;
    } else if (row.status === "rejected") {
      rejected += 1;
    }
    bySubjectMap.set(subjectName, entry);
  }

  const bySubject = Array.from(bySubjectMap.values()).sort((a, b) => b.total - a.total);

  return { total: rows.length, approved, pendingReview, rejected, bySubject };
}
