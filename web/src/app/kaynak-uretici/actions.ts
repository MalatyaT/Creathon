"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { extractQuestionsFromImage } from "@/lib/gemini-tasks/extract-questions";
import type { ExtractedQuestion } from "@/lib/schemas/extraction";

export async function extractQuestionsAction(formData: FormData): Promise<{
  pageSummary: string;
  questions: ExtractedQuestion[];
}> {
  await requireRoleAction("content_creator");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Bir sayfa görseli seçmelisin");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { page_summary, questions } = await extractQuestionsFromImage(
    buffer.toString("base64"),
    file.type || "image/png",
  );

  return { pageSummary: page_summary, questions };
}

export async function saveQuestionsAction(payload: {
  bookTitle: string;
  pageNumber: number | null;
  summary: string;
  questions: ExtractedQuestion[];
}): Promise<{ saved: number; previewMode: boolean }> {
  const { user, previewMode } = await requireRoleAction("content_creator");
  const { bookTitle, pageNumber, summary, questions } = payload;

  if (previewMode || !supabaseConfigured()) {
    return { saved: 0, previewMode: true };
  }

  const supabase = await createClient();

  const { data: scan, error: scanError } = await supabase
    .from("scans")
    .insert({
      uploaded_by: user!.id,
      storage_path: "",
      status: "done",
      book_title: bookTitle || null,
      page_number: pageNumber,
      summary: summary || null,
      raw_extraction: questions,
      processed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scanError || !scan) {
    throw new Error(scanError?.message ?? "Tarama kaydı oluşturulamadı");
  }

  const rows = questions.map((q) => ({
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    topic_label: q.topic_label,
    source: "scan" as const,
    source_scan_id: scan.id,
    // Kaynak üreticisi zaten bu ekranda her soruyu düzenleyip onayladı (moderasyon adımı
    // burada gerçekleşti) — ayrı bir öğretmen onay ekranı olmadığı için doğrudan
    // 'approved' işaretleniyor ki Soru Oluştur havuzdan hemen çekebilsin.
    status: "approved" as const,
    created_by: user!.id,
  }));

  const { error: insertError } = await supabase.from("questions").insert(rows);
  if (insertError) throw new Error(insertError.message);

  return { saved: rows.length, previewMode: false };
}
