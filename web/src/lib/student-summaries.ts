import type { SupabaseClient } from "@supabase/supabase-js";

export type StudentSummary = {
  id: string;
  name: string;
  avgRisk: number | null;
  topTopic: string | null;
  homeworkDone: number;
  homeworkTotal: number;
  practiceCount: number;
};

export type Note = { kind: "Güçlü" | "Dikkat" | "Bilgi"; text: string };

/**
 * Öğretmen/veli panelinde ortak: linked_profile_id = linkerId olan öğrencilerin özetini
 * getirir. chat_messages'a kasıtlı olarak dokunmuyoruz — "sohbet kayıtları paylaşılmaz"
 * ilkesi gereği o tablonun RLS'i öğretmen/veliye zaten kapalı (bkz. migration 0001);
 * aktivite ölçütü olarak twin_state.sample_count kullanılıyor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getLinkedStudentSummaries(supabase: SupabaseClient<any>, linkerId: string) {
  const { data: links } = await supabase
    .from("student_links")
    .select("student_id")
    .eq("linked_profile_id", linkerId);

  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return [] as StudentSummary[];

  const [{ data: profiles }, { data: twinRows }, { data: homeworkRows }] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase
      .from("twin_state")
      .select("student_id, topic_label, risk_score, sample_count")
      .in("student_id", studentIds),
    supabase.from("homework").select("student_id, completed_at").in("student_id", studentIds),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return studentIds.map((id): StudentSummary => {
    const twin = (twinRows ?? []).filter((t) => t.student_id === id);
    const avgRisk = twin.length
      ? Math.round(twin.reduce((s, t) => s + Number(t.risk_score), 0) / twin.length)
      : null;
    const top = twin.slice().sort((a, b) => b.risk_score - a.risk_score)[0];
    const hw = (homeworkRows ?? []).filter((h) => h.student_id === id);

    return {
      id,
      name: nameById.get(id) || "İsimsiz öğrenci",
      avgRisk,
      topTopic: top?.topic_label ?? null,
      homeworkDone: hw.filter((h) => h.completed_at).length,
      homeworkTotal: hw.length,
      practiceCount: twin.reduce((sum, t) => sum + (t.sample_count ?? 0), 0),
    };
  });
}

export function computeStudentNotes(students: StudentSummary[]): Note[] {
  const notes: Note[] = [];
  for (const s of students) {
    if (s.homeworkTotal > 0 && s.homeworkDone / s.homeworkTotal >= 0.8) {
      notes.push({
        kind: "Güçlü",
        text: `${s.name}: ödev tamamlama oranı %${Math.round((s.homeworkDone / s.homeworkTotal) * 100)}.`,
      });
    }
    if (s.avgRisk !== null && s.avgRisk >= 70 && s.topTopic) {
      notes.push({ kind: "Dikkat", text: `${s.name}: ${s.topTopic} konusunda risk %${s.avgRisk}.` });
    }
    if (s.practiceCount > 0) {
      notes.push({ kind: "Bilgi", text: `${s.name}: ikizi toplam ${s.practiceCount} kez sınandı.` });
    }
  }
  return notes;
}

export function averageRisk(students: StudentSummary[]): number | null {
  const withRisk = students.filter((s) => s.avgRisk !== null);
  if (!withRisk.length) return null;
  return Math.round(withRisk.reduce((sum, s) => sum + (s.avgRisk ?? 0), 0) / withRisk.length);
}
