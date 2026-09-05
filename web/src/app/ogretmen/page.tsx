import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { LinkStudentForm } from "@/components/ogretmen/link-student-form";
import { riskColor } from "@/lib/risk";

type StudentSummary = {
  id: string;
  name: string;
  avgRisk: number | null;
  topTopic: string | null;
  homeworkDone: number;
  homeworkTotal: number;
  practiceCount: number;
};

type Note = { kind: "Güçlü" | "Dikkat" | "Bilgi"; text: string };

export default async function OgretmenPage() {
  const { user, profile, previewMode } = await requireRole("teacher", "/giris/ogretmen");

  let students: StudentSummary[] = [];

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();

    const { data: links } = await supabase
      .from("student_links")
      .select("student_id")
      .eq("linked_profile_id", user.id);

    const studentIds = (links ?? []).map((l) => l.student_id);

    if (studentIds.length > 0) {
      // Not: chat_messages'a kasıtlı olarak dokunmuyoruz — "sohbet kayıtları paylaşılmaz"
      // ilkesi gereği o tablonun RLS'i zaten öğretmene kapalı (bkz. migration 0001).
      // Aktivite ölçütü olarak twin_state.sample_count (ikizin kaç kez sınandığı) kullanılıyor.
      const [{ data: profiles }, { data: twinRows }, { data: homeworkRows }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", studentIds),
        supabase
          .from("twin_state")
          .select("student_id, topic_label, risk_score, sample_count")
          .in("student_id", studentIds),
        supabase.from("homework").select("student_id, completed_at").in("student_id", studentIds),
      ]);

      const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      students = studentIds.map((id) => {
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
  }

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

  const studentsWithRisk = students.filter((s) => s.avgRisk !== null);
  const avgClassRisk = studentsWithRisk.length
    ? Math.round(
        studentsWithRisk.reduce((sum, s) => sum + (s.avgRisk ?? 0), 0) / studentsWithRisk.length,
      )
    : null;
  const totalPracticeCount = students.reduce((sum, s) => sum + s.practiceCount, 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-8 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">
          Merhaba {profile.full_name || "öğretmen"}
        </h1>
        <SignOutButton />
      </div>
      <p className="max-w-xl text-sm text-foreground/65">
        Paylaşılan özet. Sohbet kayıtları ve ham soru çözümleri paylaşılmaz.
      </p>

      <div>
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
          Sınıfına öğrenci ekle
        </div>
        <LinkStudentForm />
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-foreground/50">
          Henüz sınıfında öğrenci yok — yukarıdan bir öğrencinin e-postasını ekleyerek başla.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-11">
            <div className="min-w-[128px]">
              <div className="font-heading text-[30px] leading-none">{students.length}</div>
              <div className="my-2.5 h-[3px] w-[34px] bg-brand-green" />
              <div className="text-[13px] text-foreground/62">Öğrenci</div>
            </div>
            <div className="min-w-[128px]">
              <div className="font-heading text-[30px] leading-none">
                {avgClassRisk === null ? "—" : `%${avgClassRisk}`}
              </div>
              <div className="my-2.5 h-[3px] w-[34px] bg-risk-4" />
              <div className="text-[13px] text-foreground/62">Sınıf risk ortalaması</div>
            </div>
            <div className="min-w-[128px]">
              <div className="font-heading text-[30px] leading-none">{totalPracticeCount}</div>
              <div className="my-2.5 h-[3px] w-[34px] bg-brand-coffee" />
              <div className="text-[13px] text-foreground/62">Toplam sınama</div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Sınıfın</h2>
            <div className="flex flex-col">
              {students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-4 border-b border-border py-4 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-heading text-[15px] font-semibold">{s.name}</div>
                    <div className="mt-0.5 text-[13px] text-foreground/60">
                      {s.homeworkDone}/{s.homeworkTotal} ödev tamamlandı
                      {s.topTopic && ` · en riskli: ${s.topTopic}`}
                    </div>
                  </div>
                  {s.avgRisk !== null && (
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: riskColor(s.avgRisk) }}
                    >
                      %{s.avgRisk} risk
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {notes.length > 0 && (
            <div>
              <h2 className="mb-4 font-heading text-lg font-semibold">Haftanın notları</h2>
              <div className="flex flex-col">
                {notes.map((n, i) => (
                  <div key={i} className="flex gap-5 border-b border-border py-3.5 last:border-b-0">
                    <div
                      className={`w-20 flex-none text-[11px] font-semibold uppercase tracking-wider ${
                        n.kind === "Güçlü"
                          ? "text-brand-green"
                          : n.kind === "Dikkat"
                            ? "text-risk-5"
                            : "text-foreground/50"
                      }`}
                    >
                      {n.kind}
                    </div>
                    <div className="text-sm leading-relaxed">{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
