"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionPoolStats, type QuestionPoolStats } from "@/lib/question-pool-stats";

// Bu panel (panel/kaynak-uretici) tasarım gereği gerçek girişi atlıyor (bkz. panel/ogrenci/
// actions.ts'teki aynı desen) — service-role istemciyle RLS bypass edilir.

export async function getPoolStats(): Promise<QuestionPoolStats> {
  const supabase = createAdminClient();
  return getQuestionPoolStats(supabase);
}

export type PendingQuestion = {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  topicLabel: string | null;
  subjectName: string | null;
  bookTitle: string | null;
  pageNumber: number | null;
  createdAt: string;
};

export async function listPendingQuestions(): Promise<PendingQuestion[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("questions")
    .select(
      "id, question_text, options, correct_answer, topic_label, subject_name, created_at, scans(book_title, page_number)",
    )
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  return (data ?? []).map((q) => {
    const scan = Array.isArray(q.scans) ? q.scans[0] : q.scans;
    return {
      id: q.id,
      questionText: q.question_text,
      options: (q.options as string[]) ?? [],
      correctAnswer: q.correct_answer ?? "",
      topicLabel: q.topic_label,
      subjectName: q.subject_name,
      bookTitle: scan?.book_title ?? null,
      pageNumber: scan?.page_number ?? null,
      createdAt: q.created_at,
    };
  });
}

export async function approveQuestion(id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("questions").update({ status: "approved" }).eq("id", id);
}

export async function rejectQuestion(id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("questions").update({ status: "rejected" }).eq("id", id);
}
