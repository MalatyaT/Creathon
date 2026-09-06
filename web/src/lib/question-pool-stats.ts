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
export async function getQuestionPoolStats(supabase: SupabaseClient): Promise<QuestionPoolStats> {
  const { data } = await supabase.from("questions").select("status, subject_name");
  const rows = data ?? [];

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
