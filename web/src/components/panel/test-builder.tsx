"use client";

import { useEffect, useState } from "react";
import {
  generateTestAction,
  generateRagPreviewAction,
  assignAsHomeworkAction,
  listKazanimlarAction,
  type Subject,
  type Kazanim,
  type TestItem,
} from "@/app/panel/soru-olustur/actions";
import type { RetrievedQuestion } from "@/lib/gemini-tasks/generate-rag-question";
import type { GeneratedQuestion } from "@/lib/schemas/generation";
import { Markdown } from "@/components/ui/markdown";

const COUNTS = [5, 10, 15, 20];
const LEVELS = ["Kolay", "Orta", "Zor", "Karışık"];

export function TestBuilder({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [kazanimlar, setKazanimlar] = useState<Kazanim[]>([]);
  const [selectedKazanimIds, setSelectedKazanimIds] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState("Karışık");
  const [weightByRisk, setWeightByRisk] = useState(true);
  const [mcRatio, setMcRatio] = useState(70);
  const [items, setItems] = useState<TestItem[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  // RAG unification pilotu (bkz. TODO.md Track 1) — ana test akışından bağımsız, deneysel
  // bir önizleme: tek kazanım seçip retrieval'in getirdiği referans sorularla karşılaştırmalı
  // olarak Gemini'nin ürettiği tek soruyu gösterir.
  const [ragKazanimId, setRagKazanimId] = useState("");
  const [ragPending, setRagPending] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
  const [ragResult, setRagResult] = useState<{
    question: GeneratedQuestion;
    references: RetrievedQuestion[];
  } | null>(null);

  useEffect(() => {
    if (!subjectId) return;
    listKazanimlarAction(subjectId).then((list) => {
      setKazanimlar(list);
      setSelectedKazanimIds(list.map((k) => k.id));
      setRagKazanimId(list[0]?.id ?? "");
      setRagResult(null);
    });
  }, [subjectId]);

  async function handleRagPreview() {
    if (!subjectId || !ragKazanimId) return;
    setRagPending(true);
    setRagError(null);
    try {
      const result = await generateRagPreviewAction({
        subjectId,
        kazanimId: ragKazanimId,
        difficultyLabel: level,
      });
      if (result.previewMode || !result.question) {
        setRagError("Supabase henüz bağlı değil — bu bir önizleme.");
        return;
      }
      setRagResult({ question: result.question, references: result.references });
    } catch (err) {
      setRagError(err instanceof Error ? err.message : "RAG önizlemesi üretilemedi");
    } finally {
      setRagPending(false);
    }
  }

  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "";

  function toggleKazanim(id: string) {
    setSelectedKazanimIds((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id],
    );
  }

  async function handleGenerate() {
    if (!subjectId || selectedKazanimIds.length === 0) {
      setError("Bir ders seç ve en az bir kazanım işaretle");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await generateTestAction({
        subjectId,
        kazanimIds: selectedKazanimIds,
        count,
        difficultyLabel: level,
        weightByRisk,
        mcRatio: mcRatio / 100,
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
      const result = await assignAsHomeworkAction({ title: testTitle, subjectName, items });
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
  const testTitle = subjectName ? `${subjectName} Testi` : "Test";
  const testStamp = now.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-10">
    <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-5 print:hidden">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Ders
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-green"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          <div className="flex items-center justify-between">
            Kazanımlar
            <button
              type="button"
              onClick={() =>
                setSelectedKazanimIds(
                  selectedKazanimIds.length === kazanimlar.length ? [] : kazanimlar.map((k) => k.id),
                )
              }
              className="text-xs font-normal text-brand-green hover:underline"
            >
              {selectedKazanimIds.length === kazanimlar.length ? "hiçbirini seçme" : "tümünü seç"}
            </button>
          </div>
          <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-surface p-2">
            {kazanimlar.map((k) => (
              <label key={k.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={selectedKazanimIds.includes(k.id)}
                  onChange={() => toggleKazanim(k.id)}
                />
                {k.name}
              </label>
            ))}
          </div>
        </div>

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

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          <div className="flex justify-between">
            <span>Çoktan seçmeli / Açık uçlu</span>
            <span className="text-foreground/50">
              %{mcRatio} / %{100 - mcRatio}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={mcRatio}
            onChange={(e) => setMcRatio(Number(e.target.value))}
          />
        </label>

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
            Soldan ders, kazanım ve zorluk seç, testi oluştur. Önizleme burada çıkacak.
          </p>
        )}

        {items && items.length === 0 && (
          <p className="max-w-sm text-sm text-foreground/50">
            Bu kazanımlar için havuzda ya da yapay zeka üretiminde soru bulunamadı.
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
                      <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs">
                        {q.questionType === "open_ended" ? "Açık uçlu" : "Çoktan seçmeli"}
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

    <div className="print:hidden rounded-xl border border-dashed border-brand-coffee-600/40 bg-surface p-6">
      <div className="flex flex-wrap items-baseline gap-2">
        <h2 className="font-heading text-base font-semibold">RAG pilotu — tek kazanım, tek soru (deneysel)</h2>
        <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-brand-coffee-600">
          şu an sadece Matematik / Mantık için referans veri var
        </span>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm text-foreground/65">
        Seçilen kazanıma en yakın havuz sorularını (retrieval) getirir, Gemini'ye referans olarak
        verir, tek bir yeni soru ürettirir — üretilen sorunun referanslarla benzerliğini ve
        cevabın doğruluğunu burada gözle kontrol edebilirsin.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Kazanım
          <select
            value={ragKazanimId}
            onChange={(e) => setRagKazanimId(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-green"
          >
            {kazanimlar.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={handleRagPreview}
          disabled={ragPending || !ragKazanimId}
          className="rounded-full border border-brand-coffee-600 px-5 py-2.5 text-sm font-semibold text-brand-coffee-600 hover:bg-surface-muted disabled:opacity-60"
        >
          {ragPending ? "Üretiliyor…" : "RAG ile 1 soru üret"}
        </button>
      </div>

      {ragError && <p className="mt-3 text-sm text-risk-5">{ragError}</p>}

      {ragResult && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-brand-coffee-600">Üretilen soru (Gemini)</h3>
            <div className="mt-2 text-[15px] leading-relaxed">
              <Markdown>{ragResult.question.question_text}</Markdown>
            </div>
            {ragResult.question.options.length > 0 && (
              <div className="mt-1.5 grid gap-1 text-sm text-foreground/75">
                {ragResult.question.options.map((opt, i) => (
                  <div key={i}>
                    {String.fromCharCode(65 + i)}) {opt}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-sm">
              <span className="font-semibold">Doğru cevap:</span> {ragResult.question.correct_answer}
            </p>
            <p className="mt-1 text-sm text-foreground/70">{ragResult.question.explanation}</p>
            <p className="mt-1 text-xs text-foreground/50">
              Zorluk {ragResult.question.difficulty} · {ragResult.question.topic_label}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-coffee-600">
              Retrieval'in getirdiği referans sorular ({ragResult.references.length})
            </h3>
            {ragResult.references.length === 0 && (
              <p className="mt-2 text-sm text-foreground/50">
                Bu kazanım için havuzda referans soru yok — Gemini kendi müfredat bilgisiyle üretti.
              </p>
            )}
            <div className="mt-2 flex flex-col gap-3">
              {ragResult.references.map((ref) => (
                <div key={ref.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                      benzerlik {ref.similarity.toFixed(2)}
                    </span>
                    <span className="text-xs text-foreground/50">{ref.topicLabel}</span>
                  </div>
                  <p className="mt-1.5 text-foreground/80">{ref.questionText}</p>
                  {ref.options.length > 0 && (
                    <p className="mt-1 text-xs text-foreground/50">
                      Doğru cevap: {ref.correctAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
