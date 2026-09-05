import Link from "next/link";
import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { SolveFlow, type FlowItem } from "@/components/panel/solve-flow";

const RISK_COLOR = ["var(--risk-1)", "var(--risk-1)", "var(--risk-2)", "var(--risk-3)", "var(--risk-4)", "var(--risk-5)"];

function riskColor(score: number) {
  const bucket = Math.min(5, Math.max(0, Math.floor(score / 20)));
  return RISK_COLOR[bucket];
}

type TwinRow = { topic_label: string | null; risk_score: number; sample_count: number };
type MessageRow = {
  role: "user" | "assistant";
  content: string | null;
  topic_label: string | null;
  created_at: string;
};

export default async function DijitalIkizPage() {
  const { user, previewMode } = await requireRole("student", "/giris/ogrenci");

  let topics: TwinRow[] = [];
  let flow: FlowItem[] = [];
  let solvedTotal = 0;

  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();

    const { data: twinRows } = await supabase
      .from("twin_state")
      .select("topic_label, risk_score, sample_count")
      .eq("student_id", user.id)
      .order("risk_score", { ascending: false });
    topics = twinRows ?? [];

    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("student_id", user.id)
      .eq("role", "user");
    solvedTotal = count ?? 0;

    const { data: messages } = await supabase
      .from("chat_messages")
      .select("role, content, topic_label, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const chronological = (messages ?? []).slice().reverse() as MessageRow[];
    for (let i = 0; i < chronological.length - 1; i++) {
      if (chronological[i].role === "user" && chronological[i + 1].role === "assistant") {
        flow.push({
          id: `${chronological[i].created_at}`,
          question: chronological[i].content ?? "",
          topic: chronological[i + 1].topic_label ?? "",
          note: chronological[i + 1].content ?? "",
        });
        i++;
      }
    }
    flow = flow.reverse();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/panel" className="text-sm text-foreground/60 hover:text-foreground">
            ← Panel
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-semibold">Dijital İkiz</h1>
        </div>
      </div>

      <p className="max-w-xl text-sm text-foreground/70">
        İkizin, bugüne kadar sorduğun {solvedTotal} sorudan öğrendi. Hangi konuda ne kadar
        yanılıyorsa, senin de yanılma ihtimalin orada yüksek.
      </p>

      <div>
        <div className="mb-4 flex items-baseline gap-3">
          <h2 className="font-heading text-lg font-semibold">Konu risk haritası</h2>
          <span className="text-xs text-foreground/50">koyu = yanılma ihtimali yüksek</span>
        </div>

        {topics.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Henüz bir risk haritası yok — bota bir soru sordukça burası dolmaya başlayacak.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {topics.map((t) => (
              <div
                key={t.topic_label}
                className="flex min-h-[92px] flex-col justify-between rounded-lg p-3"
                style={{ background: riskColor(t.risk_score) }}
              >
                <div className="font-heading text-sm font-semibold leading-tight text-foreground/85">
                  {t.topic_label}
                </div>
                <div className="flex items-baseline justify-between text-xs text-foreground/70">
                  <span>%{Math.round(t.risk_score)} risk</span>
                  <span className="text-[10px] uppercase tracking-wide">{t.sample_count}x</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold">İkizin çözüm akışı</h2>
        <p className="mt-1 text-sm text-foreground/65">
          Son sorduğun sorular · satıra dokun, yanıtı göster.
        </p>
        <SolveFlow items={flow} />
        {flow.length === 0 && (
          <p className="mt-4 text-sm text-foreground/50">Henüz bir soru sormadın.</p>
        )}
      </div>

      <Link
        href="/panel/soru-sor"
        className="w-fit rounded-full bg-brand-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-violet-600"
      >
        Bota soru sor
      </Link>
    </div>
  );
}
