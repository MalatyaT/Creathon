import Link from "next/link";
import { PORTALS } from "@/lib/roles";
import { TwinMark } from "@/components/brand/twin-mark";

const RISK_PREVIEW: { topic: string; risk: 1 | 2 | 3 | 4 | 5 }[] = [
  { topic: "Türev", risk: 4 },
  { topic: "Limit", risk: 2 },
  { topic: "Optik", risk: 5 },
  { topic: "Paragraf", risk: 1 },
  { topic: "Elektrik", risk: 3 },
  { topic: "Fonksiyon", risk: 2 },
  { topic: "Genetik", risk: 4 },
  { topic: "Osmanlı Kur.", risk: 1 },
];

const RISK_COLOR: Record<number, string> = {
  1: "var(--risk-1)",
  2: "var(--risk-2)",
  3: "var(--risk-3)",
  4: "var(--risk-4)",
  5: "var(--risk-5)",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Kitap taranır",
    body: "Kaynak üreticisi kitap sayfasını yükler, Gemini sayfadaki soruları ayırıp havuza ekler.",
  },
  {
    step: "02",
    title: "İkiz soruyu çözer",
    body: "Öğrenci sorar ya da test çözer; her yanıt bir kazanıma etiketlenir.",
  },
  {
    step: "03",
    title: "Risk haritası güncellenir",
    body: "İkizin hangi kazanımda ne kadar yanıldığı, konu ağında koyulaşan noktalarla görünür.",
  },
  {
    step: "04",
    title: "Sana özel test çıkar",
    body: "Riskli konulara ağırlık veren yeni bir test, havuzdan ve ihtiyaç halinde yapay zekadan üretilir.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <TwinMark />
          <span className="font-heading text-xl font-semibold tracking-tight">
            İkiz
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/giris/ogretmen"
            className="hidden text-foreground/70 hover:text-foreground sm:inline"
          >
            Öğretmen girişi
          </Link>
          <Link
            href="/giris/kaynak-uretici"
            className="hidden text-foreground/70 hover:text-foreground sm:inline"
          >
            Kaynak üreticisi girişi
          </Link>
          <Link
            href="/giris/ogrenci"
            className="rounded-full bg-brand-green px-4 py-2 text-white hover:bg-brand-green-600"
          >
            Öğrenci girişi
          </Link>
        </nav>
      </header>

      <section className="grid gap-12 px-6 pt-10 pb-20 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div className="max-w-xl">
          <h1 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Her öğrencinin, hatasını unutmayan bir{" "}
            <span className="text-brand-green">ikizi</span> var.
          </h1>
          <p className="mt-5 text-lg text-foreground/70">
            LGS ve YKS için: sorduğun her soru, çözdüğün her test ikizinin
            risk haritasını günceller. Zayıf kazanımların netleşince, tam
            oraya göre bir test çıkar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/giris/ogrenci"
              className="rounded-full bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-brand-green-600"
            >
              Öğrenci olarak başla
            </Link>
            <Link
              href="#portallar"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface-muted"
            >
              Diğer girişler
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-heading text-sm font-semibold">
              Konu risk haritası
            </span>
            <span className="text-xs text-foreground/50">örnek görünüm</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {RISK_PREVIEW.map((node) => (
              <div
                key={node.topic}
                className="flex aspect-square flex-col items-center justify-center rounded-lg p-2 text-center"
                style={{ background: RISK_COLOR[node.risk] }}
              >
                <span className="text-[11px] font-medium leading-tight text-foreground/80">
                  {node.topic}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-foreground/50">
            <span>düşük risk</span>
            <span
              className="h-2 flex-1 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--risk-1), var(--risk-3), var(--risk-5))",
              }}
            />
            <span>yüksek risk</span>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface px-6 py-16 sm:px-10">
        <h2 className="font-heading text-2xl font-semibold">Nasıl çalışır</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step}>
              <span className="font-heading text-sm font-semibold text-brand-coffee">
                {item.step}
              </span>
              <h3 className="mt-2 font-heading text-lg font-semibold">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm text-foreground/65">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="portallar" className="px-6 py-20 sm:px-10">
        <h2 className="font-heading text-2xl font-semibold">Girişini seç</h2>
        <p className="mt-2 text-foreground/65">
          Öğrenci, öğretmen ve kaynak üreticisi ayrı panellerde çalışır.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {(Object.keys(PORTALS) as (keyof typeof PORTALS)[]).map((slug) => {
            const portal = PORTALS[slug];
            return (
              <div
                key={slug}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6"
              >
                <div>
                  <h3 className="font-heading text-lg font-semibold">
                    {portal.label}
                  </h3>
                  <p className="mt-2 text-sm text-foreground/65">
                    {portal.tagline}
                  </p>
                </div>
                <div className="mt-6 flex gap-3 text-sm font-semibold">
                  <Link
                    href={`/giris/${slug}`}
                    className="rounded-full bg-brand-green px-4 py-2 text-white hover:bg-brand-green-600"
                  >
                    Giriş yap
                  </Link>
                  <Link
                    href={`/kayit/${slug}`}
                    className="rounded-full border border-border px-4 py-2 hover:bg-surface-muted"
                  >
                    Kayıt ol
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-sm text-foreground/50 sm:px-10">
        İkiz — LGS/YKS çalışma platformu.
      </footer>
    </div>
  );
}
