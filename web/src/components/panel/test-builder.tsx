"use client";

import { useState } from "react";
import {
  generateTestAction,
  assignAsHomeworkAction,
  type TestItem,
} from "@/app/panel/soru-olustur/actions";
import { Markdown } from "@/components/ui/markdown";

const COUNTS = [5, 10, 15, 20];
const LEVELS = ["Kolay", "Orta", "Zor", "Karışık"];

export function TestBuilder({ topics }: { topics: string[] }) {
  const [topic, setTopic] = useState(topics[0] ?? "");
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState("Karışık");
  const [weightByRisk, setWeightByRisk] = useState(true);
  const [items, setItems] = useState<TestItem[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Bir konu yaz ya da seç");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await generateTestAction({
        topic: topic.trim(),
        count,
        difficultyLabel: level,
        weightByRisk,
      });
      setItems(result.items);
      setPreviewMode(result.previewMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test oluşturulamadı");
    } finally {
      setPending(false);
    }
  }

  async function handleAssign() {
    if (!items || items.length === 0) return;
    setAssigning(true);
    setAssignResult(null);
    try {
      const result = await assignAsHomeworkAction({ title: testTitle, items });
      setAssignResult(
        result.previewMode
          ? "Supabase henüz bağlı değil — bu bir önizleme."
          : "Ödev olarak eklendi — Ödevler sekmesinden takip edebilirsin.",
      );
    } catch (err) {
      setAssignResult(err instanceof Error ? err.message : "Ödev olarak atanamadı");
    } finally {
      setAssigning(false);
    }
  }

  const now = new Date();
  const testTitle = topic ? `${topic} Testi` : "Test";
  const testStamp = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-5 print:hidden">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Konu
          <input
            list="topic-suggestions"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ör. Yazım Kuralları"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-green"
          />
          <datalist id="topic-suggestions">
            {topics.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Soru sayısı
          <div className="flex flex-wrap gap-1.5">
            {COUNTS.map((c) => (
              <button
                key={c}
                onClick={() => setCount(c)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  count === c
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Zorluk
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  level === l
                    ? "border-brand-green bg-brand-green text-white"
                    : "border-border hover:bg-surface-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={weightByRisk}
            onChange={(e) => setWeightByRisk(e.target.checked)}
          />
          İkizimin hata desenini ağırlıklandır
        </label>

        <button
          onClick={handleGenerate}
          disabled={pending}
          className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"
        >
          {pending ? "Oluşturuluyor…" : "Testi oluştur"}
        </button>

        {error && <p className="text-sm text-risk-5">{error}</p>}
        {previewMode && (
          <p className="text-sm text-foreground/60">
            Supabase henüz bağlı değil — bu bir önizleme.
          </p>
        )}
      </div>

      <div>
        {!items && (
          <p className="max-w-sm text-sm text-foreground/50">
            Soldan konu ve zorluk seç, testi oluştur. Önizleme burada çıkacak.
          </p>
        )}

        {items && items.length === 0 && (
          <p className="max-w-sm text-sm text-foreground/50">
            Bu konu için havuzda ya da yapay zeka üretiminde soru bulunamadı.
          </p>
        )}

        {items && items.length > 0 && (
          <div id="test-print-area">
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-heading text-lg font-semibold">{testTitle}</h2>
              <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-brand-coffee-600">
                {items.length} soru · {level}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground/50">{testStamp}</p>

            <div className="mt-7 flex flex-col gap-6">
              {items.map((q) => (
                <div key={q.no} className="flex gap-4">
                  <div className="w-7 shrink-0 font-heading text-sm font-semibold text-brand-green">
                    {q.no}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] leading-relaxed">
                      <Markdown>{q.text}</Markdown>
                    </div>
                    {q.options.length > 0 && (
                      <div className="mt-1.5 grid gap-1 text-sm text-foreground/75 sm:grid-cols-2">
                        {q.options.map((opt, i) => (
                          <div key={i}>
                            {String.fromCharCode(65 + i)}) {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">
                        {q.topicLabel}
                      </span>
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">
                        Zorluk {q.difficulty}
                      </span>
                      {q.sourceLabel ? (
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-brand-green">
                          📖 {q.sourceLabel}
                        </span>
                      ) : (
                        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-brand-coffee-600">
                          ✨ yapay zeka
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 break-before-page">
              <h3 className="font-heading text-base font-semibold">Cevap Anahtarı</h3>
              <div className="mt-3 grid grid-cols-5 gap-2 text-sm sm:grid-cols-8">
                {items.map((q) => (
                  <div key={q.no}>
                    {q.no}. {q.correctAnswer || "—"}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600"
              >
                PDF olarak indir
              </button>
              <button
                onClick={handleGenerate}
                disabled={pending}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted"
              >
                Yeniden üret
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning}
                className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-muted disabled:opacity-60"
              >
                {assigning ? "Atanıyor…" : "Ödev olarak ata"}
              </button>
            </div>
            {assignResult && (
              <p className="mt-3 text-sm text-foreground/65 print:hidden">{assignResult}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
