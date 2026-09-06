"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TwinMark } from "@/components/brand/twin-mark";
import { Markdown } from "@/components/ui/markdown";
import {
  approveQuestion,
  getPoolStats,
  listPendingQuestions,
  rejectQuestion,
  type PendingQuestion as RealPendingQuestion,
} from "@/app/panel/kaynak-uretici/actions";
import type { QuestionPoolStats } from "@/lib/question-pool-stats";

const icons = {
  panel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  add: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  review: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/></svg>,
};

const navItems = [
  { id: "panel", label: "Panel (Genel)", icon: icons.panel },
  { id: "add", label: "Kaynak Ekle", icon: icons.add },
  { id: "review", label: "Soru Değerlendirme", icon: icons.review },
];

const RESOURCES = [
  { title: "3D TYT Matematik Soru Bankası", category: "TYT", pages: 212, questions: 486, added: "3 gün önce" },
  { title: "Endemik Fizik Föy", category: "AYT", pages: 64, questions: 140, added: "1 hafta önce" },
  { title: "Bilfen LGS Soru Bankası", category: "LGS", pages: 180, questions: 320, added: "2 hafta önce" },
];

export default function KaynakUreticiPanel() {
  const [activeTab, setActiveTab] = useState("panel");

  const [bookTitle, setBookTitle] = useState("");
  const [category, setCategory] = useState("TYT");
  const [pageFile, setPageFile] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState(false);

  // Soru Değerlendirme + Panel istatistikleri artık gerçek `questions` tablosundan
  // (bkz. panel/kaynak-uretici/actions.ts) — önceden ikisi de mock'tu.
  const [queue, setQueue] = useState<RealPendingQuestion[]>([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [poolStats, setPoolStats] = useState<QuestionPoolStats | null>(null);

  function refreshPoolStats() {
    getPoolStats().then(setPoolStats);
  }

  useEffect(() => {
    listPendingQuestions().then((list) => {
      setQueue(list);
      setQueueLoading(false);
    });
    refreshPoolStats();
  }, []);

  async function resolveQuestion(id: string, decision: "approve" | "reject") {
    setQueue((q) => q.filter((item) => item.id !== id));
    if (decision === "approve") await approveQuestion(id);
    else await rejectQuestion(id);
    refreshPoolStats();
  }

  const renderContent = () => {
    switch (activeTab) {
      case "panel":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Hoş geldin, Selin Yayıncı</h1>
            <p className="text-foreground/60 mb-8">
              <span className="font-semibold text-brand-green">6 kaynak</span> taradın, havuza <span className="font-semibold text-brand-green">{poolStats ? poolStats.total : "…"} soru</span> kattın. İşte bugünün özeti:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-green uppercase tracking-wider">Kaynak</span>
                <div className="text-5xl font-bold mt-4">6</div>
                <div className="h-1.5 w-12 bg-brand-green mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">TYT/AYT/LGS karışık</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-brand-yellow-600 uppercase tracking-wider">Bekleyen Değerlendirme</span>
                <div className="text-5xl font-bold mt-4">{queueLoading ? "…" : queue.length}</div>
                <div className="h-1.5 w-12 bg-brand-yellow mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Onay bekleyen soru</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Toplam Soru</span>
                <div className="text-5xl font-bold mt-4">{poolStats ? poolStats.total : "…"}</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">{poolStats ? `${poolStats.approved} onaylı` : "Havuzdaki gerçek soru sayısı"}</span>
              </div>
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Ders Sayısı</span>
                <div className="text-5xl font-bold mt-4">{poolStats ? poolStats.bySubject.length : "…"}</div>
                <div className="h-1.5 w-12 bg-border mt-4 mb-3 rounded-full" />
                <span className="text-sm text-foreground/60">Havuzda soru içeren ders</span>
              </div>
            </div>

            {poolStats && poolStats.bySubject.length > 0 && (
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm mb-10">
                <h3 className="font-heading font-semibold text-lg mb-4">Ders Bazında Soru Havuzu</h3>
                <div className="space-y-3">
                  {poolStats.bySubject.map((s) => (
                    <div key={s.subjectName} className="flex items-center gap-4">
                      <div className="w-28 shrink-0 text-sm font-medium">{s.subjectName}</div>
                      <div className="flex-1 h-2.5 bg-surface-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-brand-green" style={{ width: `${poolStats.total ? (s.total / poolStats.total) * 100 : 0}%` }} />
                      </div>
                      <div className="w-32 shrink-0 text-xs text-foreground/60 text-right">{s.total} soru ({s.approved} onaylı)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-bl-full" />
                <h3 className="font-heading font-semibold text-xl mb-2 relative z-10">Son eklediğin kaynaklar</h3>
                <p className="text-sm text-foreground/60 mb-6 relative z-10">Taranan sayfa ve çıkarılan soru sayısı.</p>
                <div className="space-y-4 relative z-10">
                  {RESOURCES.map((r, i) => (
                    <div key={i} className="p-4 rounded-xl bg-background border border-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{r.title}</div>
                          <div className="text-xs text-foreground/60 mt-1">{r.pages} sayfa · {r.questions} soru</div>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-brand-green/10 text-brand-green">{r.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab("add")} className="mt-6 text-sm text-brand-green font-medium hover:underline">
                  Yeni kaynak ekle →
                </button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="font-heading font-semibold text-xl mb-5">Bekleyen değerlendirmeler</h3>
                <div className="space-y-4">
                  {queue.slice(0, 3).map((q) => (
                    <div key={q.id} className="p-4 rounded-xl bg-background border border-border hover:border-brand-yellow/50 transition-colors cursor-pointer" onClick={() => setActiveTab("review")}>
                      <div className="font-semibold text-sm line-clamp-1">{q.questionText}</div>
                      <div className="text-xs text-foreground/60 mt-1">
                        {q.topicLabel ?? q.subjectName ?? "Konu yok"}{q.bookTitle ? ` · ${q.bookTitle}${q.pageNumber ? `, s. ${q.pageNumber}` : ""}` : ""}
                      </div>
                    </div>
                  ))}
                  {!queueLoading && queue.length === 0 && (
                    <p className="text-sm text-foreground/50">Bekleyen soru yok, tebrikler!</p>
                  )}
                </div>
                <button onClick={() => setActiveTab("review")} className="mt-5 text-sm text-brand-green font-medium hover:underline">
                  Soru değerlendirmeye git →
                </button>
              </div>
            </div>
          </div>
        );

      case "add":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Kaynak Ekle</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Kitap sayfasının fotoğrafını yükle — yapay zeka soruları ayırıp çözer, kazanım ve zorluk etiketler. Sonuçlar önce senin gözden geçirmene, sonra Soru Değerlendirme kuyruğuna düşer.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm space-y-5 h-fit">
                <div>
                  <label className="block text-sm font-semibold mb-2">Kitap / Kaynak Adı</label>
                  <input
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-brand-green"
                    placeholder="ör. Limit Yayınları YKS Matematik"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Kategori</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-green">
                      <option>TYT</option><option>AYT</option><option>LGS</option><option>KPSS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Sayfa No</label>
                    <input type="number" min={1} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-green" placeholder="ör. 64" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Sayfa Görseli</label>
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-8 text-center cursor-pointer hover:border-brand-green transition-colors">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setPageFile(e.target.files?.[0]?.name ?? null)} />
                    <span className="text-foreground/40">{icons.add}</span>
                    <span className="text-sm font-medium text-foreground/60">{pageFile ?? "Fotoğraf yükle ya da sürükle"}</span>
                  </label>
                </div>
                <button
                  onClick={() => setScanResult(true)}
                  disabled={!pageFile || !bookTitle}
                  className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm disabled:opacity-50"
                >
                  Sayfayı Tara
                </button>
              </div>

              <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
                {!scanResult ? (
                  <div className="h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center text-foreground/30 mb-4">{icons.add}</div>
                    <p className="text-sm text-foreground/50 max-w-xs">Bir sayfa yükleyip taradığında çıkarılan sorular burada önizlenecek.</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading font-semibold text-lg">3 soru bulundu</h3>
                      <span className="bg-brand-green/10 text-brand-green px-3 py-1 rounded-full text-xs font-bold">{category}</span>
                    </div>
                    <div className="space-y-5">
                      {[
                        { no: 1, text: "Bir sayının 3 katının 5 fazlası 26 olduğuna göre, bu sayı kaçtır?", topic: "Denklemler" },
                        { no: 2, text: "lim(x→2) (x²-4)/(x-2) limitinin değeri nedir?", topic: "Limit" },
                        { no: 3, text: "f(x) = x³ - 3x fonksiyonunun azalan olduğu aralık nedir?", topic: "Türev" },
                      ].map((q) => (
                        <div key={q.no} className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
                          <div className="w-7 shrink-0 font-heading text-sm font-semibold text-brand-green">{q.no}</div>
                          <div>
                            <div className="text-[15px] leading-relaxed">{q.text}</div>
                            <span className="mt-2 inline-block rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-foreground/60">{q.topic}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab("review")}
                      className="w-full mt-6 bg-brand-yellow hover:bg-brand-yellow-600 text-foreground font-bold py-3 rounded-xl text-sm shadow-sm"
                    >
                      Değerlendirme Kuyruğuna Gönder
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div>
            <h1 className="text-3xl font-heading font-semibold mb-2 tracking-tight">Soru Değerlendirme</h1>
            <p className="text-foreground/60 mb-8 max-w-2xl">
              Taranan sorular havuza girmeden önce burada onaylanır — yapay zekanın yanlış okuduğu ya da yanlış çözdüğü sorular elenir.
            </p>

            {queueLoading ? (
              <div className="bg-surface p-12 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-foreground/60">Yükleniyor...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="bg-surface p-12 rounded-2xl border border-border shadow-sm text-center">
                <p className="text-foreground/60">Bekleyen soru kalmadı — hepsi değerlendirildi.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {queue.map((q) => (
                  <div key={q.id} className="bg-surface p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="text-[15px] leading-relaxed font-medium">
                        <Markdown>{q.questionText}</Markdown>
                      </div>
                      <span className="shrink-0 text-xs text-foreground/50">
                        {q.bookTitle ? `${q.bookTitle}${q.pageNumber ? `, s. ${q.pageNumber}` : ""}` : "Kaynak yok"}
                      </span>
                    </div>
                    {q.options.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                        {q.options.map((opt, i) => {
                          const letter = String.fromCharCode(65 + i);
                          const isCorrect = letter === q.correctAnswer.trim().toUpperCase();
                          return (
                            <div
                              key={i}
                              className={`flex gap-1 text-sm px-3 py-2 rounded-lg border ${isCorrect ? "border-brand-green bg-brand-green/5 font-semibold text-brand-green" : "border-border bg-background text-foreground/70"}`}
                            >
                              <span className="shrink-0">{letter})</span>
                              <Markdown>{opt}</Markdown>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium">{q.topicLabel ?? q.subjectName ?? "Konu yok"}</span>
                      <div className="flex gap-3">
                        <button onClick={() => resolveQuestion(q.id, "reject")} className="text-sm font-semibold text-red-600 hover:underline">Reddet</button>
                        <button onClick={() => resolveQuestion(q.id, "approve")} className="bg-brand-green text-white font-bold px-5 py-2 rounded-full text-sm hover:bg-brand-green-600 shadow-sm">Onayla</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      <aside className="w-[280px] flex-none flex flex-col bg-surface border-r border-border shadow-sm relative z-20">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 mb-2 hover:opacity-80 transition-opacity">
            <TwinMark variant="egitim" />
          </Link>
          <div className="text-[10px] tracking-widest uppercase text-brand-yellow-600 font-bold ml-9">Kaynak Üreticisi</div>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 px-4 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all font-medium text-sm border outline-none focus-visible:ring-2 focus-visible:ring-brand-green ${
                  isActive
                    ? "bg-brand-yellow/10 text-brand-yellow-700 border-brand-yellow/20 shadow-sm"
                    : "text-foreground/70 hover:bg-surface-muted border-transparent hover:text-foreground"
                }`}
              >
                <span className={`${isActive ? "text-brand-yellow-600" : "text-foreground/40"} transition-colors`}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-surface-muted/30">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-muted cursor-pointer transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-brand-green-600 text-white flex items-center justify-center font-bold shadow-sm">
              SY
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-foreground">Selin Yayıncı</div>
              <div className="text-xs text-foreground/50 truncate font-medium">Kaynak Üreticisi</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto relative bg-background">
        <div className="max-w-6xl mx-auto p-8 lg:p-12 pb-24">{renderContent()}</div>
      </main>
    </div>
  );
}
