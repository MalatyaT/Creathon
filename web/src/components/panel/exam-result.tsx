"use client";

import { useState, type ReactNode } from "react";
import { TwinMark } from "@/components/brand/twin-mark";

export type PrintableExamItem = {
  id: string | null;
  questionText: string;
  questionType: "multiple_choice" | "open_ended";
  options: string[];
  correctAnswer: string;
  topicLabel: string;
  difficulty: number;
  sourceLabel: string | null;
};

/** İlk soruya kalan puanı (bölünemeyen artığı) veren eşit dağılım — toplam her zaman 100. */
function splitEqually(count: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(100 / count);
  const remainder = 100 - base * count;
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}

/**
 * Sınav sonucu görünümü + PDF export — hem öğretmen (panel/ogretmen "Sınav Oluştur") hem
 * öğrenci (panel/ogrenci "Sınav ve Denemeler") tarafında aynı bileşen kullanılıyor
 * (kullanıcı isteği: "öğrencide olan kısmı fakelemek yerine bu şekilde kullan"). PDF için
 * ayrı bir kütüphane yerine `window.print()` + Tailwind `print:` varyantı kullanılıyor (bkz.
 * test-builder.tsx'teki aynı desen) — basit, bağımlılıksız.
 */
export function ExamResultView({
  items,
  subjectName,
  actions,
}: {
  items: PrintableExamItem[];
  subjectName: string;
  actions?: ReactNode;
}) {
  const [points, setPoints] = useState<number[]>(() => splitEqually(items.length));
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);

  function updatePoint(index: number, value: number) {
    setPoints((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  const totalPoints = points.reduce((sum, p) => sum + p, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-5 print:hidden">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={includeAnswerKey}
            onChange={(e) => setIncludeAnswerKey(e.target.checked)}
            className="w-4 h-4 accent-brand-green rounded cursor-pointer"
          />
          Cevap anahtarını dahil et
        </label>
        <span className={`text-sm font-semibold ${totalPoints === 100 ? "text-brand-green" : "text-brand-yellow-700"}`}>
          Toplam: {totalPoints} puan{totalPoints !== 100 ? " (100 değil)" : ""}
        </span>
        <button
          onClick={() => window.print()}
          className="ml-auto rounded-full bg-brand-green px-5 py-2 text-sm font-semibold text-white hover:bg-brand-green-600 shadow-sm"
        >
          PDF olarak indir
        </button>
        {actions}
      </div>

      <div id="exam-print-area">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-brand-green">
          <TwinMark size={140} text />
          <div className="text-right text-sm text-foreground/60">
            <div className="font-semibold text-foreground">{subjectName} Sınavı</div>
            <div>{new Date().toLocaleDateString("tr-TR")}</div>
            <div>Ad Soyad: ________________</div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {items.map((q, i) => (
            <div key={q.id ?? i} className="flex gap-4">
              <div className="w-7 shrink-0 font-heading text-sm font-semibold text-brand-green">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[15px] leading-relaxed">{q.questionText}</div>
                  <div className="shrink-0 flex items-center gap-1 print:hidden">
                    <input
                      type="number"
                      min={0}
                      value={points[i] ?? 0}
                      onChange={(e) => updatePoint(i, Number(e.target.value) || 0)}
                      className="w-14 rounded border border-border px-1.5 py-0.5 text-xs text-right outline-none focus:border-brand-green"
                    />
                    <span className="text-xs text-foreground/50">puan</span>
                  </div>
                  <div className="hidden print:block shrink-0 text-xs text-foreground/60 whitespace-nowrap">({points[i] ?? 0} puan)</div>
                </div>
                {q.options.length > 0 && (
                  <div className="mt-1.5 grid gap-1 text-sm text-foreground/75 sm:grid-cols-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi}>{String.fromCharCode(65 + oi)}) {opt}</div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5 print:hidden">
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">{q.topicLabel}</span>
                  <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">Zorluk {q.difficulty}</span>
                  {q.sourceLabel ? (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-brand-green">📖 {q.sourceLabel}</span>
                  ) : (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-brand-yellow-700">✨ yapay zeka</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {includeAnswerKey && (
          <div className="mt-10 break-before-page">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border">
              <TwinMark size={28} />
              <span className="font-heading font-semibold text-sm text-brand-green">İkiz Eğitim — Cevap Anahtarı</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-sm sm:grid-cols-8">
              {items.map((q, i) => (
                <div key={q.id ?? i}>{i + 1}. {q.correctAnswer || "—"}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
