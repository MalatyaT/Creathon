import { createClient } from "@/lib/supabase/server";

const RISK_START = 55;
const RISK_STEP = 6;

/**
 * Öğrenci bir konuda soru sorduğunda ikizin risk haritasını günceller. Chat şu an
 * doğru/yanlış sinyali vermiyor (Q&A, sınav değil), o yüzden basit bir frekans sinyali
 * kullanılıyor: aynı konu tekrar sorulduğunda risk artar. Gerçek `topics` taksonomisi
 * henüz seed edilmediği için `topic_label` (serbest metin) üzerinden eşleşiyor
 * (bkz. migration 0006) — topic_id ileride gerçek taksonomiye bağlanınca bu fonksiyon
 * onu da dolduracak şekilde genişletilebilir.
 */
export async function bumpTwinRisk(studentId: string, topicLabel: string) {
  const label = topicLabel.trim();
  if (!label) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("twin_state")
    .select("id, risk_score, sample_count")
    .eq("student_id", studentId)
    .eq("topic_label", label)
    .is("topic_id", null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("twin_state")
      .update({
        risk_score: Math.min(100, Number(existing.risk_score) + RISK_STEP),
        sample_count: existing.sample_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("twin_state").insert({
      student_id: studentId,
      topic_label: label,
      risk_score: RISK_START,
      sample_count: 1,
    });
  }
}
