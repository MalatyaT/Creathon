"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readAnswerSheet } from "@/lib/gemini-tasks/read-answer-sheet";
import { extractAnswerSheet } from "@/lib/gemini-tasks/extract-answer-sheet";
import { assessPaper } from "@/lib/gemini-tasks/assess-paper";
import { generateQuestionsForTopic } from "@/lib/gemini-tasks/generate-questions";
import { generateSimilarQuestions } from "@/lib/gemini-tasks/generate-similar-questions";
import { listFinishedSubjectIds, listFinishedTopicIds } from "@/lib/finished-kazanim";
import type { GeneratedQuestion } from "@/lib/schemas/generation";
import { bumpTwinRisk } from "@/lib/twin";

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  Kolay: [1, 2],
  Orta: [3, 3],
  Zor: [4, 5],
  Karışık: [1, 5],
};

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

export type ExamSubject = { id: string; name: string };
export type ExamKazanim = { id: string; name: string };

// "Bitmiş" (embedding'i olan, gerçekten ingest edilmiş) ders/kazanımlarla aynı kaynak —
// bkz. lib/finished-kazanim.ts. panel/soru-olustur/actions.ts'teki öğrenci-özel
// listSubjectsAction/listKazanimlarAction ile aynı mantık, ama requireRoleAction("student")
// gerektirmiyor (bu panel demo-öğretmen bypass'ıyla çalışıyor).
export async function listExamSubjects(): Promise<ExamSubject[]> {
  const supabase = createAdminClient();
  const finishedSubjectIds = await listFinishedSubjectIds(supabase);
  const { data } = await supabase.from("subjects").select("id, name").order("name");
  return (data ?? []).filter((s) => finishedSubjectIds.has(s.id));
}

export async function listExamKazanim(subjectId: string): Promise<ExamKazanim[]> {
  const supabase = createAdminClient();
  const finishedTopicIds = await listFinishedTopicIds(supabase);
  const { data } = await supabase
    .from("topics")
    .select("id, name")
    .eq("subject_id", subjectId)
    .order("name");
  return (data ?? []).filter((t) => finishedTopicIds.has(t.id));
}

export type ExamItem = {
  id: string | null;
  questionText: string;
  questionType: "multiple_choice" | "open_ended";
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicLabel: string;
  topicId: string | null;
  difficulty: number;
  sourceLabel: string | null;
};

/**
 * Öğretmen paneli "Sınav Oluşturma": panel/soru-olustur/actions.ts'teki generateTestAction
 * ile AYNI mantık (havuzdan çek, yetersizse Gemini ile tamamla) — ama o fonksiyon
 * requireRoleAction("student") + auth.uid() gerektirdiği için (öğrencinin kendi twin_state'i
 * ve kendi homework'üne yazma) burada tekrar kullanılamıyor. Bu yüzden öğretmen bypass'ıyla
 * çalışan ayrı, risk-ağırlıklandırma yapmayan (sınıf geneli, tek öğrenciye özel değil) bir
 * kopyası.
 *
 * ÖNEMLİ (kullanıcı geri bildirimiyle bulunan bug): `kazanimIds` sadece bir IN filtresi olarak
 * kullanılıp tek bir `.limit(count)` çekilirse, sonuç sıralaması garanti olmadığı için havuzun
 * pratikte tek bir kazanımda yığılmış olması (ör. hepsi "Bölme - Bölünebilme") çok olası —
 * birden fazla kazanım seçilse bile hepsi tek konudan gelebiliyordu. Şimdi her kazanım için
 * AYRI AYRI hedef sayı kadar sorgu yapılıyor (kazanimCounts), böylece her seçilen kazanım
 * gerçekten kendi payı kadar soru getiriyor; havuzda yetersiz kalan kısmı o kazanıma özel
 * Gemini üretimiyle tamamlanıyor.
 */
export async function generateExamAction(params: {
  subjectId: string;
  kazanimCounts: { kazanimId: string; count: number }[];
  difficultyLabel: string;
  mcRatio: number;
}): Promise<ExamItem[]> {
  const supabase = createAdminClient();
  const [minDiff, maxDiff] = DIFFICULTY_RANGES[params.difficultyLabel] ?? [1, 5];
  const targets = params.kazanimCounts.filter((k) => k.count > 0);

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", params.subjectId)
    .single();
  const subjectName = subjectRow?.name ?? "";

  const { data: kazanimRows } = await supabase
    .from("topics")
    .select("id, name")
    .in("id", targets.map((t) => t.kazanimId));
  const kazanimNameById = new Map((kazanimRows ?? []).map((k) => [k.id, k.name]));

  const items: ExamItem[] = [];

  for (const target of targets) {
    const kazanimName = kazanimNameById.get(target.kazanimId) ?? "";

    const { data: poolRows } = await supabase
      .from("questions")
      .select(
        "id, question_text, question_type, options, correct_answer, explanation, difficulty, topic_label, topic_id, scans(book_title, page_number)",
      )
      .eq("status", "approved")
      .eq("topic_id", target.kazanimId)
      .gte("difficulty", minDiff)
      .lte("difficulty", maxDiff)
      .limit(target.count);

    const poolItems: ExamItem[] = (poolRows ?? []).map((q) => {
      const scan = Array.isArray(q.scans) ? q.scans[0] : q.scans;
      return {
        id: q.id,
        questionText: q.question_text,
        questionType: (q.question_type as "multiple_choice" | "open_ended") ?? "multiple_choice",
        options: (q.options as string[]) ?? [],
        correctAnswer: q.correct_answer ?? "",
        explanation: q.explanation ?? "",
        topicLabel: q.topic_label ?? "",
        topicId: q.topic_id,
        difficulty: q.difficulty ?? 3,
        sourceLabel: scan?.book_title
          ? `${scan.book_title}${scan.page_number ? `, s. ${scan.page_number}` : ""}`
          : null,
      };
    });
    items.push(...poolItems);

    const missing = target.count - poolItems.length;
    if (missing > 0 && kazanimName) {
      const mcCount = Math.round(missing * params.mcRatio);
      const openCount = missing - mcCount;

      const generated = await generateQuestionsForTopic({
        subject: subjectName,
        kazanimAssignments: Array.from({ length: missing }, () => kazanimName),
        difficultyLabel: params.difficultyLabel,
        mcCount,
        openCount,
      });

      generated.forEach((q) => {
        items.push({
          id: null,
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          topicLabel: q.topic_label,
          topicId: target.kazanimId,
          difficulty: q.difficulty,
          sourceLabel: null,
        });
      });
    }
  }

  return items;
}

/**
 * Yapay zekayla üretilip henüz kaydedilmemiş sorular (id yok) önce havuza yazılır (approved,
 * ai_generated), sonra hepsi gerçek bir öğrenciye ödev olarak atanır (bkz. panel/soru-olustur/
 * actions.ts'teki assignAsHomeworkAction — aynı desen, ama assigned_by/student_id burada
 * demo öğretmen/seçilen gerçek öğrenci).
 */
export async function assignExamAsHomeworkAction(params: {
  studentId: string;
  title: string;
  subjectName: string;
  items: ExamItem[];
}): Promise<{ assigned: boolean }> {
  const supabase = createAdminClient();

  const unsaved = params.items.filter((q) => !q.id);
  let savedIds: string[] = [];
  if (unsaved.length > 0) {
    const { data: inserted, error } = await supabase
      .from("questions")
      .insert(
        unsaved.map((q) => ({
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic_label: q.topicLabel,
          topic_id: q.topicId,
          subject_name: params.subjectName,
          source: "ai_generated" as const,
          status: "approved" as const,
          created_by: DEMO_TEACHER_ID,
        })),
      )
      .select("id");
    if (error) throw new Error(error.message);
    savedIds = (inserted ?? []).map((r) => r.id);
  }

  const questionIds = [
    ...params.items.filter((q): q is ExamItem & { id: string } => Boolean(q.id)).map((q) => q.id),
    ...savedIds,
  ];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { error: hwError } = await supabase.from("homework").insert({
    assigned_by: DEMO_TEACHER_ID,
    student_id: params.studentId,
    title: params.title,
    question_ids: questionIds,
    due_date: dueDate.toISOString().slice(0, 10),
  });
  if (hwError) throw new Error(hwError.message);

  return { assigned: true };
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
  overallGrade: number;
  overallComment: string;
  persisted: boolean;
  persistError: string | null;
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

  const { data: inserted, error: insertError } = await supabase
    .from("question_attempts")
    .insert(attemptRows)
    .select("id");
  (inserted ?? []).forEach((row, i) => {
    if (results[i]) results[i].attemptId = row.id;
  });
  // question_attempts tablosu henüz canlıya uygulanmamışsa (migration 0014 bekliyor) insert
  // sessizce başarısız olabilirdi — bunu artık açıkça yüzeye çıkarıyoruz: onay butonları ve
  // dijital ikiz güncellemesi bu satırlara bağlı, o yüzden öğretmenin bunu bilmesi gerekiyor.
  const persisted = !insertError && (inserted?.length ?? 0) === attemptRows.length;
  const persistError = insertError?.message ?? null;

  const scoreTotal = results.length;
  const scoreCorrect = results.filter((r) => r.isCorrect === true).length;

  // Ön genel değerlendirme: doğru/yanlış kararını değiştirmez, sadece holistik bir not+yorum
  // ekler (bkz. assess-paper.ts) — bu adım başarısız olursa (Gemini hatası) kağıt puanlaması
  // yine de tamamlanmış sayılır, sadece genel değerlendirme geri düşer.
  let overallGrade = scoreTotal > 0 ? Math.round((scoreCorrect / scoreTotal) * 100) : 0;
  let overallComment = "";
  try {
    const assessment = await assessPaper(
      results.map((r) => ({
        questionNumber: r.questionNumber,
        questionType: r.questionType,
        studentAnswer: r.studentAnswer,
        correctAnswer: r.correctAnswer,
        isCorrect: r.isCorrect,
        confidence: r.confidence,
      })),
    );
    overallGrade = assessment.overall_grade;
    overallComment = assessment.overall_comment;
  } catch {
    // Ön değerlendirme adımı başarısız oldu — basit doğru/yanlış oranı yeterli olsun.
  }

  return { scoreCorrect, scoreTotal, questions: results, overallGrade, overallComment, persisted, persistError };
}

export type FreeformResultItem = {
  questionNumber: number;
  questionText: string;
  answerText: string;
  confidence: number;
  needsReview: boolean;
};

/**
 * "Serbest kağıt" modu: önceden var olan bir homework/cevap anahtarı OLMADAN, kağıttaki
 * soru+cevap çiftlerini kendi başına tespit edip transkript eder (ör. numarasız, ızgara
 * düzenli bir çalışma kağıdı). Bilinen bir cevap anahtarı olmadığı için doğru/yanlış kararı
 * verilmez — sadece okuma + güven skoru; düşük güven her zaman "kontrol gerekli" demektir.
 * Homework bazlı akıştan farklı olarak hiçbir şey question_attempts'e yazılmaz (bağlı bir
 * öğrenci/ödev/soru kimliği yok).
 */
export async function gradeFreeformPaperAction(formData: FormData): Promise<FreeformResultItem[]> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Bir kağıt görseli seçmelisin");

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageBase64 = buffer.toString("base64");
  const imageMimeType = file.type || "image/jpeg";

  const items = await extractAnswerSheet(imageBase64, imageMimeType);

  return items.map((item) => ({
    questionNumber: item.question_number,
    questionText: item.question_text,
    answerText: item.answer_text,
    confidence: item.confidence,
    needsReview: item.confidence < 0.5,
  }));
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

/**
 * "Referans Sorudan Üret": hem öğretmen (panel/ogretmen) hem öğrenci (panel/ogrenci, doğrudan
 * buradan import edilir — bkz. generateExamAction ile aynı paylaşım deseni) tarafında kullanılır.
 * Kullanıcı bir örnek/referans soru görseli yükler, Gemini onu anlayıp aynı konu/zorluk/tipte
 * N yeni orijinal soru üretir. Havuza yazılmaz, sadece önizleme/PDF için — DB'ye ihtiyaç yok.
 */
export async function generateSimilarQuestionsAction(formData: FormData): Promise<GeneratedQuestion[]> {
  const file = formData.get("file");
  const countRaw = Number(formData.get("count"));
  const count = Math.min(20, Math.max(1, countRaw || 5));
  if (!(file instanceof File) || file.size === 0) throw new Error("Bir referans soru görseli seçmelisin");

  const buffer = Buffer.from(await file.arrayBuffer());
  const imageBase64 = buffer.toString("base64");
  const imageMimeType = file.type || "image/jpeg";

  return generateSimilarQuestions({ imageBase64, mimeType: imageMimeType, count });
}
