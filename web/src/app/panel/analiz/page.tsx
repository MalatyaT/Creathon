import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { riskColor } from "@/lib/risk";

type TwinRow = { topic_label: string | null; risk_score: number; sample_count: number };

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Pazartesi = 0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildWeeklyBuckets(timestamps: string[], weekCount: number) {
  const now = new Date();
  const weekStarts: Date[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const w = startOfWeek(now);
    w.setDate(w.getDate() - i * 7);
    weekStarts.push(w);
  }

  const counts = weekStarts.map(() => 0);
  for (const ts of timestamps) {
    const d = new Date(ts);
    for (let i = weekStarts.length - 1; i >= 0; i--) {
      if (d >= weekStarts[i]) {
        counts[i]++;
        break;
      }
    }
  }

  const max = Math.max(1, ...counts);
  return weekStarts.map((w, i) => ({
    label: `${w.getDate()}/${w.getMonth() + 1}`,
    count: counts[i],
    heightPct: Math.round((counts[i] / max) * 100),
  }));
}

export default async function AnalizPage() {
  const { user, previewMode } = await requireRole("student", "/giris/ogrenci");

  let topics: TwinRow[] = [];
  let totalQuestions = 0;
  let weeks: { label: string; count: number; heightPct: number }[] = [];

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();

    const { data: twinRows } = await supabase
      .from("twin_state")
      .select("topic_label, risk_score, sample_count")
      .eq("student_id", user.id)
      .order("risk_score", { ascending: false });
    topics = twinRows ?? [];

    const { data: messageDates, count } = await supabase
      .from("chat_messages")
      .select("created_at", { count: "exact" })
      .eq("student_id", user.id)
      .eq("role", "user")
      .order("created_at", { ascending: true })
      .limit(500);
    totalQuestions = count ?? 0;
    weeks = buildWeeklyBuckets((messageDates ?? []).map((m) => m.created_at), 8);
  }

  const avgRisk = topics.length
    ? Math.round(topics.reduce((sum, t) => sum + Number(t.risk_score), 0) / topics.length)
    : null;
  const riskiest = topics[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-8 py-16">
      <h1 className="font-heading text-2xl font-semibold">Analiz</h1>

      <div className="flex flex-wrap items-end gap-12">
        <div>
          <div className="mb-3.5 text-[11px] font-semibold uppercase tracking-wider text-brand-green">
            Genel risk ortalaması
          </div>
          <div className="font-heading text-4xl font-semibold">
            {avgRisk === null ? "—" : `%${avgRisk}`}
          </div>
        </div>
        <div className="flex flex-wrap gap-11 pb-1.5">
          <div className="min-w-[128px]">
            <div className="font-heading text-[30px] leading-none">{totalQuestions}</div>
            <div className="my-2.5 h-[3px] w-[34px] bg-brand-coffee" />
            <div className="text-[13px] text-foreground/62">Toplam soru</div>
          </div>
          <div className="min-w-[128px]">
            <div className="font-heading text-[30px] leading-none">{topics.length}</div>
            <div className="my-2.5 h-[3px] w-[34px] bg-brand-green" />
            <div className="text-[13px] text-foreground/62">İzlenen konu</div>
          </div>
          <div className="min-w-[128px]">
            <div className="font-heading text-[30px] leading-none">
              {riskiest ? `%${Math.round(riskiest.risk_score)}` : "—"}
            </div>
            <div className="my-2.5 h-[3px] w-[34px] bg-risk-4" />
            <div className="text-[13px] text-foreground/62">
              {riskiest ? riskiest.topic_label : "En riskli konu"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-5 font-heading text-lg font-semibold">Hafta hafta çözülen soru</h2>
        {totalQuestions === 0 ? (
          <p className="text-sm text-foreground/50">Henüz veri yok — bota bir soru sordukça burası dolacak.</p>
        ) : (
          <div className="flex items-end gap-3">
            {weeks.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[11px] text-foreground/55">{w.count}</div>
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t bg-brand-green"
                    style={{ height: `${Math.max(4, w.heightPct)}%` }}
                  />
                </div>
                <div className="text-[11px] text-foreground/55">{w.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-5 font-heading text-lg font-semibold">Güçlü ve zayıf konular</h2>
        {topics.length === 0 ? (
          <p className="text-sm text-foreground/50">Henüz veri yok.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {topics.map((t) => (
              <div key={t.topic_label}>
                <div className="mb-1.5 flex justify-between text-[13px]">
                  <span>{t.topic_label}</span>
                  <span className="text-foreground/55">%{Math.round(t.risk_score)}</span>
                </div>
                <div className="h-[7px] bg-surface-muted">
                  <div
                    className="h-[7px]"
                    style={{ width: `${t.risk_score}%`, background: riskColor(t.risk_score) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground/60">
        Deneme (net ortalaması) ve sınıf/ilçe/il karşılaştırması, deneme sonucu girişi
        eklendiğinde burada görünecek.
      </div>
    </div>
  );
}
