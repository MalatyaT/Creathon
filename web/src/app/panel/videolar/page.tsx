import { requireRole, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { riskColor } from "@/lib/risk";

type TwinRow = { topic_label: string | null; risk_score: number; sample_count: number };

// Gerçek video verisi (başlık/kanal/süre) yok — YouTube Data API key'i bağlanmadı
// (bkz. TODO.md). Bu yüzden sahte video kartları uydurmak yerine, öğrencinin zayıf
// olduğu her konu için gerçek bir YouTube arama linki veriyoruz — tıklayınca gördüğü
// sonuçlar gerçek. Bu alanda iyi bilinen birkaç kanal ismini de arama önerisi olarak
// sunuyoruz (video linki değil, sadece arama modifikatörü).
const SUGGESTED_CHANNELS = ["Tonguç Akademi", "Hocalara Geldik", "Rehber Ders"];

function searchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export default async function VideolarPage() {
  const { user, previewMode } = await requireRole("student", "/giris/ogrenci");

  let topics: TwinRow[] = [];
  if (!previewMode && supabaseConfigured() && user) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("twin_state")
      .select("topic_label, risk_score, sample_count")
      .eq("student_id", user.id)
      .order("risk_score", { ascending: false })
      .limit(6);
    topics = data ?? [];
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-8 py-16">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Videolar</h1>
        <p className="mt-1.5 max-w-xl text-sm text-foreground/65">
          Zayıf konularına göre sıralandı. YouTube Data API henüz bağlı değil, bu yüzden
          gerçek video önerisi yerine her konu için doğrudan bir YouTube araması açıyoruz.
        </p>
      </div>

      {topics.length === 0 ? (
        <p className="text-sm text-foreground/50">
          Henüz veri yok — bota bir soru sordukça burası dolacak.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {topics.map((t) => (
            <div
              key={t.topic_label}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-heading text-[17px] font-semibold leading-tight">
                  {t.topic_label}
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: riskColor(t.risk_score) }}
                >
                  %{Math.round(t.risk_score)}
                </span>
              </div>
              <p className="text-[13px] text-foreground/60">
                Bu konuda {t.sample_count} kez sınandın, hâlâ risk taşıyor — konu anlatımı
                izlemek işine yarayabilir.
              </p>
              <a
                href={searchUrl(`${t.topic_label} konu anlatımı`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 w-fit rounded-full bg-brand-green px-4 py-2 text-xs font-semibold text-white hover:bg-brand-green-600"
              >
                YouTube&apos;da ara
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground/60">
        Bilinen kaynaklar: {SUGGESTED_CHANNELS.join(" · ")}
      </div>
    </div>
  );
}
