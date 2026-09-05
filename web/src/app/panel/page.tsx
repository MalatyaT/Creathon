import Link from "next/link";
import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";

type TwinRow = { topic_label: string | null; risk_score: number; sample_count: number };
type HomeworkRow = { id: string; title: string; question_ids: string[] | null; due_date: string | null };

export default async function PanelPage() {
  const { user, profile, previewMode } = await requireRole("student", "/giris/ogrenci");

  let topTopics: TwinRow[] = [];
  let totalQuestions = 0;
  let pendingHomework: HomeworkRow[] = [];
  let homeworkDoneCount = 0;
  let homeworkTotalCount = 0;

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();

    const { data: twinRows } = await supabase
      .from("twin_state")
      .select("topic_label, risk_score, sample_count")
      .eq("student_id", user.id)
      .order("risk_score", { ascending: false })
      .limit(3);
    topTopics = twinRows ?? [];

    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("role", "user");
    totalQuestions = count ?? 0;

    const { data: homeworkRows } = await supabase
      .from("homework")
      .select("id, title, question_ids, due_date, completed_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false });

    homeworkTotalCount = homeworkRows?.length ?? 0;
    homeworkDoneCount = (homeworkRows ?? []).filter((h) => h.completed_at).length;
    pendingHomework = (homeworkRows ?? []).filter((h) => !h.completed_at).slice(0, 2);
  }

  const avgRisk = topTopics.length
    ? Math.round(topTopics.reduce((sum, t) => sum + Number(t.risk_score), 0) / topTopics.length)
    : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-14 px-8 py-16">
      <div className="flex flex-wrap items-end gap-14">
        <div>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider text-brand-green">
            Merhaba {profile.full_name || "öğrenci"}
          </div>
          <div className="font-heading text-4xl font-semibold">
            {avgRisk === null ? "—" : `%${avgRisk}`}
          </div>
          <div className="mt-2 text-sm text-foreground/55">en riskli 3 konu ortalaması</div>
        </div>
        <div className="flex flex-wrap gap-11 pb-1.5">
          <div className="min-w-[128px]">
            <div className="font-heading text-[30px] leading-none">{totalQuestions}</div>
            <div className="my-2.5 h-[3px] w-[34px] bg-brand-coffee" />
            <div className="text-[13px] text-foreground/62">Toplam soru</div>
          </div>
          <div className="min-w-[128px]">
            <div className="font-heading text-[30px] leading-none">
              {homeworkDoneCount}/{homeworkTotalCount}
            </div>
            <div className="my-2.5 h-[3px] w-[34px] bg-brand-green" />
            <div className="text-[13px] text-foreground/62">Ödev tamamlama</div>
          </div>
        </div>
      </div>

      <div className="grid gap-14 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-1.5 font-heading text-lg font-semibold">
            İkizinin bugün öne çıkardığı konular
          </h2>
          <p className="max-w-[46ch] text-sm text-foreground/62">
            Senin sorduğun sorularla eğitilen ikizin bu konularda en çok yanılıyor. Aynı tuzağa
            düşme ihtimalin yüksek.
          </p>

          {topTopics.length === 0 ? (
            <p className="mt-6 text-sm text-foreground/50">
              Henüz veri yok — bota bir soru sordukça burası dolacak.
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-6">
              {topTopics.map((t, i) => (
                <div key={t.topic_label} className="flex gap-5 items-baseline">
                  <div className="w-10 flex-none font-heading text-2xl font-semibold text-brand-coffee">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-heading text-[17px] font-semibold">{t.topic_label}</div>
                    <div className="mt-0.5 text-[13px] text-foreground/60">
                      İkizin bu konuda {t.sample_count} kez sınandı, hâlâ yanılıyor.
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-risk-5">
                        %{Math.round(t.risk_score)} risk
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex gap-2.5">
            <Link
              href="/panel/soru-sor"
              className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"
            >
              Bota soru sor
            </Link>
            <Link
              href="/panel/soru-olustur"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted"
            >
              Test oluştur
            </Link>
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-heading text-lg font-semibold">Bekleyen ödevlerin</h2>
          {pendingHomework.length === 0 ? (
            <p className="text-sm text-foreground/50">Bekleyen ödevin yok.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {pendingHomework.map((h) => (
                <div key={h.id}>
                  <div className="font-heading text-[15px] font-semibold">{h.title}</div>
                  <div className="mt-0.5 text-[13px] text-foreground/60">
                    {h.question_ids?.length ?? 0} soru
                    {h.due_date &&
                      ` · ${new Date(h.due_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "long" })}`}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-sm">
            <Link href="/panel/odevler" className="text-brand-green hover:underline">
              Tüm ödevlendirmeler
            </Link>
          </div>

          {topTopics.length > 0 && (
            <div className="mt-11">
              <h3 className="mb-4 font-heading text-base font-semibold">Zayıf üç konu</h3>
              <div className="flex flex-col gap-3.5">
                {topTopics.map((t) => (
                  <div key={t.topic_label}>
                    <div className="mb-1.5 flex justify-between text-[13px]">
                      <span>{t.topic_label}</span>
                      <span className="text-foreground/55">%{Math.round(t.risk_score)}</span>
                    </div>
                    <div className="h-[7px] bg-surface-muted">
                      <div
                        className="h-[7px] bg-risk-4"
                        style={{ width: `${t.risk_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
