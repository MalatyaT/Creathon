"use client";

import { useState, type ChangeEvent } from "react";
import { generateSimilarQuestionsAction } from "@/app/panel/ogretmen/actions";
import { ExamResultView } from "@/components/panel/exam-result";
import type { GeneratedQuestion } from "@/lib/schemas/generation";

const icon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

/**
 * "Referans Sorudan Üret": kullanıcı bir örnek soru görseli yükler, Gemini aynı konu/zorluk/
 * tipte N yeni orijinal soru üretir (bkz. lib/gemini-tasks/generate-similar-questions.ts).
 * Hem panel/ogretmen hem panel/ogrenci "Soru Oluşturma" sekmesinde aynı bileşen kullanılıyor.
 */
export function ReferenceQuestionGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedQuestion[] | null>(null);

  function handleFileChange(picked: File | null) {
    setFile(picked);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return picked ? URL.createObjectURL(picked) : null;
    });
    setResults(null);
    setError(null);
  }

  async function handleGenerate() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("count", String(count));
      const questions = await generateSimilarQuestionsAction(formData);
      setResults(questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Benzer sorular üretilemedi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface p-8 rounded-2xl border border-border shadow-sm">
      <h3 className="font-heading font-semibold text-xl mb-2 text-brand-green">Referans Sorudan Üret</h3>
      <p className="text-sm text-foreground/60 mb-6 max-w-2xl">
        Bir örnek/referans soru fotoğrafı yükle — yapay zeka o soruyu anlayıp aynı konu, zorluk ve
        soru tipinde, ama tamamen orijinal yeni sorular üretir. Soru sayısı opsiyonel, varsayılan 5.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background p-6 text-center cursor-pointer hover:border-brand-green transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <span className="text-foreground/40">{icon}</span>
            <span className="text-sm font-medium text-foreground/60">{file?.name ?? "Referans soru fotoğrafı yükle"}</span>
          </label>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Referans soru" className="w-full max-h-56 object-contain rounded-xl border border-border bg-background" />
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 text-foreground/60">Soru Sayısı (opsiyonel)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 5)))}
              className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={!file || loading}
            className="w-full bg-brand-green text-white font-bold py-3 rounded-xl hover:bg-brand-green-600 transition-transform active:scale-95 shadow-sm disabled:opacity-50"
          >
            {loading ? "Üretiliyor..." : `Bu Soru Tipinden ${count} Soru Üret`}
          </button>
        </div>

        <div>
          {!results ? (
            <div className="h-full flex flex-col items-center justify-center text-center min-h-[240px] text-foreground/40">
              {icon}
              <p className="mt-3 text-sm max-w-xs">Bir referans soru yükleyip ürettiğinde benzer sorular burada görünecek.</p>
            </div>
          ) : (
            <ExamResultView
              items={results.map((q) => ({
                id: null,
                questionText: q.question_text,
                questionType: q.question_type,
                options: q.options,
                correctAnswer: q.correct_answer,
                topicLabel: q.topic_label,
                difficulty: q.difficulty,
                sourceLabel: null,
              }))}
              subjectName="Referans Sorudan Üretilen"
            />
          )}
        </div>
      </div>
    </div>
  );
}
