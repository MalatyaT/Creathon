"use client";

import { useState, type ChangeEvent } from "react";
import { extractQuestionsAction, saveQuestionsAction } from "@/app/kaynak-uretici/actions";
import type { ExtractedQuestion } from "@/lib/schemas/extraction";

export function ScanUpload() {
  const [bookTitle, setBookTitle] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pageSummary, setPageSummary] = useState("");
  const [questions, setQuestions] = useState<ExtractedQuestion[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setFile(picked);
    setQuestions(null);
    setSaveResult(null);
    setError(null);
    setPreviewUrl(picked ? URL.createObjectURL(picked) : null);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setSaveResult(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const result = await extractQuestionsAction(formData);
      setQuestions(result.questions);
      setPageSummary(result.pageSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tarama başarısız oldu");
    } finally {
      setExtracting(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<ExtractedQuestion>) {
    setQuestions((prev) =>
      prev ? prev.map((q, i) => (i === index ? { ...q, ...patch } : q)) : prev,
    );
  }

  function removeQuestion(index: number) {
    setQuestions((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSave() {
    if (!questions || questions.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveQuestionsAction({
        bookTitle: bookTitle.trim(),
        pageNumber: pageNumber.trim() ? Number(pageNumber) : null,
        summary: pageSummary.trim(),
        questions,
      });
      if (result.previewMode) {
        setSaveResult(
          "Supabase projesi henüz bağlı değil — sorular kaydedilmedi, bu bir önizleme.",
        );
      } else {
        setSaveResult(`${result.saved} soru havuza eklendi (onay bekliyor).`);
        setQuestions(null);
        setFile(null);
        setPreviewUrl(null);
        setPageSummary("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kaydetme başarısız oldu");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Kitap / kaynak adı
            <input
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="ör. Limit Yayınları YKS Matematik Soru Bankası"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Sayfa no
            <input
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="ör. 12"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand-green"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          Kitap sayfası görseli
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm"
          />
        </label>

        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Yüklenen sayfa önizlemesi"
            className="mt-4 max-h-64 rounded-lg border border-border object-contain"
          />
        )}

        <button
          onClick={handleExtract}
          disabled={!file || extracting}
          className="mt-4 rounded-full bg-brand-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-600 disabled:opacity-60"
        >
          {extracting ? "Taranıyor…" : "Sayfayı tara"}
        </button>

        {error && <p className="mt-3 text-sm text-risk-5">{error}</p>}
      </div>

      {saveResult && (
        <p className="rounded-lg bg-surface-muted px-4 py-3 text-sm text-foreground/70">
          {saveResult}
        </p>
      )}

      {questions && questions.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface-muted p-5">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Sayfa özeti{" "}
              <span className="font-normal text-foreground/50">
                (chatbot bu sayfayı ilgili sorularda önerirken kullanır)
              </span>
              <textarea
                value={pageSummary}
                onChange={(e) => setPageSummary(e.target.value)}
                rows={2}
                className="resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-brand-green"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">
              {questions.length} soru bulundu — havuza eklemeden önce gözden geçir
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 rounded-full bg-brand-coffee px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-coffee-600 disabled:opacity-60"
            >
              {saving ? "Kaydediliyor…" : "Tümünü havuza ekle"}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map((q, index) => (
              <div key={index} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                    className="w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-brand-green"
                    rows={2}
                  />
                  <button
                    onClick={() => removeQuestion(index)}
                    className="shrink-0 text-xs text-foreground/50 hover:text-risk-5"
                  >
                    kaldır
                  </button>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, optIndex) => (
                    <input
                      key={optIndex}
                      value={opt}
                      onChange={(e) => {
                        const next = [...q.options];
                        next[optIndex] = e.target.value;
                        updateQuestion(index, { options: next });
                      }}
                      className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-brand-green"
                    />
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-1.5">
                    Doğru cevap
                    <input
                      value={q.correct_answer}
                      onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                      className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center outline-none focus:border-brand-green"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    Zorluk
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={q.difficulty}
                      onChange={(e) =>
                        updateQuestion(index, { difficulty: Number(e.target.value) })
                      }
                      className="w-14 rounded-lg border border-border bg-background px-2 py-1 text-center outline-none focus:border-brand-green"
                    />
                  </label>
                  <input
                    value={q.topic_label}
                    onChange={(e) => updateQuestion(index, { topic_label: e.target.value })}
                    className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium outline-none focus:border-brand-green"
                  />
                </div>

                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
                  className="mt-3 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-sm text-foreground/70 outline-none focus:border-brand-green"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
