"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readAnswerSheet } from "@/lib/gemini-tasks/read-answer-sheet";
import { bumpTwinRisk } from "@/lib/twin";

// Bu panel (panel/ogretmen) tasarım gereği gerçek girişi atlıyor (bkz. panel/ogrenci/
// actions.ts'teki aynı desen) — sabit bir demo öğretmen hesabına (Test Öğretmen, zaten
// Supabase'de kayıtlı ve Test Öğrenci'ye linked_profile_id ile bağlı) yazıyoruz, RLS'i
// service-role istemciyle bypass ediyoruz.
const DEMO_TEACHER_ID = "81342702-27a2-409c-9a4d-ba0b35020792";

export type LinkedStudent = { id: string; name: string };

export async function listLinkedStudents(): Promise<LinkedStudent[]> {
  const supabase = createAdminClient();
  const { data: links } = await supabase
    .from("student_links")
    .select("student_id")
    .eq("linked_profile_id", DEMO_TEACHER_ID)
    .eq("relation", "teacher");

  const studentIds = (links ?? []).map((l) => l.student_id);
  if (studentIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", studentIds);

  return (profiles ?? []).map((p) => ({ id: p.id, name: p.full_name || "İsimsiz öğrenci" }));
}

export type HomeworkOption = { id: string; title: string; questionCount: number };

export async function listStudentHomework(studentId: string): Promise<HomeworkOption[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("homework")
    .select("id, title, question_ids")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    questionCount: (h.question_ids ?? []).length,
  }));
}

export type GradedQuestion = {
  attemptId: string;
  questionNumber: number;
  questionText: string;
  questionType: "multiple_choice" | "open_ended";
  correctAnswer: string;
  studentAnswer: string;
  confidence: number;
  isCorrect: boolean | null;
  needsReview: boolean;
};

export type GradePaperResult = {
  scoreCorrect: number;
  scoreTotal: number;
  questions: GradedQuestion[];
};

export async function gradePaperAction(formData: FormData): Promise<GradePaperResult> {
  const studentId = String(formData.get("studentId") ?? "");
  const homeworkId = String(formData.get("homeworkId") ?? "");
  const file = formData.get("file");
  if (!studentId || !homeworkId) throw new Error("Öğrenci/ödev seçilmedi");
  if (!(file instanceof File) || file.size === 0) throw new Error("Bir cevap kağıdı görseli seçmelisin");

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageBase64 = buffer.toString("base64");
  const imageMimeType = file.type || "image/jpeg";

  const supabase = createAdminClient();

  const { data: homework } = await supabase
    .from("homework")
    .select("question_ids")
    .eq("id", homeworkId)
    .single();
  if (!homework || homework.question_ids.length === 0) {
    throw new Error("Bu ödevde soru bulunamadı");
  }

  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, question_text, question_type, correct_answer, topic_id, topic_label")
    .in("id", homework.question_ids);
  if (!questionRows) throw new Error("Sorular yüklenemedi");

  // Sırayı homework.question_ids'teki (kağıttaki soru sırasıyla eşleşen) sıraya göre koru.
  type QuestionRow = (typeof questionRows)[number];
  const questionById = new Map(questionRows.map((q) => [q.id, q]));
  const ordered: QuestionRow[] = (homework.question_ids as string[])
    .map((id) => questionById.get(id))
    .filter((q): q is QuestionRow => Boolean(q));

  const readAnswers = await readAnswerSheet(
    imageBase64,
    imageMimeType,
    ordered.map((q, i) => ({
      number: i + 1,
      questionType: (q.question_type as "multiple_choice" | "open_ended") ?? "multiple_choice",
    })),
  );
  const answerByNumber = new Map(readAnswers.map((a) => [a.question_number, a]));

  const results: GradedQuestion[] = [];
  const attemptRows: Array<{
    student_id: string;
    homework_id: string;
    question_id: string;
    chosen_answer: string | null;
    is_correct: boolean | null;
    needs_review: boolean;
    graded_by: string;
  }> = [];

  for (let i = 0; i < ordered.length; i++) {
    const q = ordered[i];
    const questionNumber = i + 1;
    const read = answerByNumber.get(questionNumber);
    const isMultipleChoice = (q.question_type ?? "multiple_choice") === "multiple_choice";

    const studentAnswer = isMultipleChoice ? (read?.marked_option ?? "") : (read?.transcribed_answer ?? "");
    const confidence = read?.confidence ?? 0;

    let isCorrect: boolean | null = null;
    let needsReview = false;
    if (isMultipleChoice) {
      if (!studentAnswer || confidence < 0.5) {
        needsReview = true;
      } else {
        isCorrect = studentAnswer.trim().toUpperCase() === (q.correct_answer ?? "").trim().toUpperCase();
      }
    } else {
      needsReview = true; // açık uçlu: AI sadece transkript eder, öğretmen elle onaylar
    }

    attemptRows.push({
      student_id: studentId,
      homework_id: homeworkId,
      question_id: q.id,
      chosen_answer: studentAnswer || null,
      is_correct: isCorrect,
      needs_review: needsReview,
      graded_by: DEMO_TEACHER_ID,
    });

    results.push({
      attemptId: "", // insert sonrası doldurulacak
      questionNumber,
      questionText: q.question_text,
      questionType: isMultipleChoice ? "multiple_choice" : "open_ended",
      correctAnswer: q.correct_answer ?? "",
      studentAnswer,
      confidence,
      isCorrect,
      needsReview,
    });

    if (isCorrect === false) {
      await bumpTwinRisk(supabase, studentId, q.topic_label || "Genel");
    }
  }

  const { data: inserted } = await supabase.from("question_attempts").insert(attemptRows).select("id");
  (inserted ?? []).forEach((row, i) => {
    if (results[i]) results[i].attemptId = row.id;
  });

  const scoreTotal = results.length;
  const scoreCorrect = results.filter((r) => r.isCorrect === true).length;

  return { scoreCorrect, scoreTotal, questions: results };
}

export async function confirmOpenEndedAttempt(params: {
  attemptId: string;
  isCorrect: boolean;
}): Promise<void> {
  const supabase = createAdminClient();
  const { data: attempt } = await supabase
    .from("question_attempts")
    .update({ is_correct: params.isCorrect, needs_review: false })
    .eq("id", params.attemptId)
    .select("student_id, question_id")
    .single();

  if (attempt && !params.isCorrect) {
    const { data: question } = await supabase
      .from("questions")
      .select("topic_label")
      .eq("id", attempt.question_id)
      .single();
    await bumpTwinRisk(supabase, attempt.student_id, question?.topic_label || "Genel");
  }
}
