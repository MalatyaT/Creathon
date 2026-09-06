"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { generateQuestionsForTopic } from "@/lib/gemini-tasks/generate-questions";
import { generateRagQuestion, type RetrievedQuestion } from "@/lib/gemini-tasks/generate-rag-question";
import { listFinishedSubjectIds, listFinishedTopicIds } from "@/lib/finished-kazanim";
import type { GeneratedQuestion } from "@/lib/schemas/generation";

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  Kolay: [1, 2],
  Orta: [3, 3],
  Zor: [4, 5],
  Karışık: [1, 5],
};

// Bu 4 ders şu an gerçek taranmış kaynaklarla (bkz. Kaynaklar/) besleniyor; hepsi TYT
// düzeyinde, Coğrafya kısmı KPSS kaynaklı. AI ile üretilip havuza/ödeve eklenen sorulara
// da (kaynağı olmadığı için) bu pragmatik varsayılan kategori atanıyor.
const DEFAULT_CATEGORY_BY_SUBJECT: Record<string, string> = {
  Biyoloji: "tyt",
  Matematik: "tyt",
  Kimya: "tyt",
  Coğrafya: "kpss",
};

export type Subject = { id: string; name: string };
export type Kazanim = { id: string; name: string };

export type TestItem = {
  no: number;
  /** questions.id — havuzdan geldiyse dolu, yapay zeka ile üretildiyse null (henüz kaydedilmedi). */
  id: string | null;
  text: string;
  questionType: "multiple_choice" | "open_ended";
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicLabel: string;
  topicId: string | null;
  difficulty: number;
  sourceLabel: string | null;
};

export async function listSubjectsAction(): Promise<Subject[]> {
  const { previewMode } = await requireRoleAction("student");
  if (previewMode || !supabaseConfigured()) return [];

  const supabase = await createClient();
  const finishedSubjectIds = await listFinishedSubjectIds(supabase);
  const { data } = await supabase.from("subjects").select("id, name").order("name");
  return (data ?? []).filter((s) => finishedSubjectIds.has(s.id));
}

export async function listKazanimlarAction(subjectId: string): Promise<Kazanim[]> {
  const { previewMode } = await requireRoleAction("student");
  if (previewMode || !supabaseConfigured()) return [];

  const supabase = await createClient();
  const finishedTopicIds = await listFinishedTopicIds(supabase);
  const { data } = await supabase
    .from("topics")
    .select("id, name")
    .eq("subject_id", subjectId)
    .order("name");
  return (data ?? []).filter((t) => finishedTopicIds.has(t.id));
}

export async function generateTestAction(params: {
  subjectId: string;
  kazanimIds: string[];
  count: number;
  difficultyLabel: string;
  weightByRisk: boolean;
  mcRatio: number; // 0-1, çoktan seçmeli oranı
}): Promise<{ items: TestItem[]; previewMode: boolean }> {
  const { user, previewMode } = await requireRoleAction("student");
  const [minDiff, maxDiff] = DIFFICULTY_RANGES[params.difficultyLabel] ?? [1, 5];

  if (previewMode || !supabaseConfigured() || !user) {
    return { items: [], previewMode: true };
  }

  const supabase = await createClient();

  const { data: subjectRow } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", params.subjectId)
    .single();
  const subjectName = subjectRow?.name ?? "";

  const { data: kazanimRows } = await supabase
    .from("topics")
    .select("id, name")
    .in("id", params.kazanimIds);
  const kazanimlar = kazanimRows ?? [];
  const kazanimIdByName = new Map(kazanimlar.map((k) => [k.name, k.id]));

  const { data: poolRows } = await supabase
    .from("questions")
    .select(
      "id, question_text, question_type, options, correct_answer, explanation, difficulty, topic_label, topic_id, scans(book_title, page_number)",
    )
    .eq("status", "approved")
    .in("topic_id", params.kazanimIds)
    .gte("difficulty", minDiff)
    .lte("difficulty", maxDiff)
    .limit(params.count);

  const items: TestItem[] = (poolRows ?? []).map((q, i) => {
    const scan = Array.isArray(q.scans) ? q.scans[0] : q.scans;
    return {
      no: i + 1,
      id: q.id,
      text: q.question_text,
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

  const missing = params.count - items.length;
  if (missing > 0 && kazanimlar.length > 0) {
    // weightByRisk açıksa, öğrencinin risk skoru yüksek olan kazanımlarını sıranın başına
    // al — round-robin doldurma sırasında kalan (bölünemeyen) sorular öne, yani riskli
    // kazanımlara gider.
    let orderedKazanim = [...kazanimlar];
    let twinHint: string | undefined;
    if (params.weightByRisk) {
      const { data: twinRows } = await supabase
        .from("twin_state")
        .select("topic_label, risk_score, sample_count")
        .eq("student_id", user.id);

      const riskByKazanimId = new Map<string, number>();
      for (const k of kazanimlar) {
        const hit = (twinRows ?? []).find(
          (t) => t.topic_label && t.topic_label.toLowerCase().includes(k.name.toLowerCase()),
        );
        if (hit) riskByKazanimId.set(k.id, Number(hit.risk_score));
      }
      orderedKazanim = [...kazanimlar].sort(
        (a, b) => (riskByKazanimId.get(b.id) ?? 0) - (riskByKazanimId.get(a.id) ?? 0),
      );
      const topRisk = riskByKazanimId.get(orderedKazanim[0]?.id);
      if (topRisk) {
        twinHint = `"${orderedKazanim[0].name}" kazanımında risk skoru %${Math.round(topRisk)} — belirgin şekilde zayıf`;
      }
    }

    const kazanimAssignments = Array.from(
      { length: missing },
      (_, i) => orderedKazanim[i % orderedKazanim.length].name,
    );
    const mcCount = Math.round(missing * params.mcRatio);
    const openCount = missing - mcCount;

    const generated = await generateQuestionsForTopic({
      subject: subjectName,
      kazanimAssignments,
      difficultyLabel: params.difficultyLabel,
      mcCount,
      openCount,
      twinHint,
    });

    const baseNo = items.length;
    generated.forEach((q, i) => {
      items.push({
        no: baseNo + i + 1,
        id: null,
        text: q.question_text,
        questionType: q.question_type,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        topicLabel: q.topic_label,
        topicId: kazanimIdByName.get(q.topic_label) ?? null,
        difficulty: q.difficulty,
        sourceLabel: null,
      });
    });
  }

  return { items, previewMode: false };
}

/**
 * RAG unification pilotu (bkz. TODO.md Track 1): tek bir kazanım için, havuzdaki gerçek
 * benzer sorulara bakarak (retrieval) Gemini ile tek bir soru üretir. Şu an sadece Matematik/
 * "Mantık" kazanımı için referans veri var (bkz. `ingest-matematik-kazanim.ts`) — başka bir
 * kazanım seçilirse `references` boş döner, prompt kendi müfredat bilgisiyle üretir (bkz.
 * generate-rag-question.ts). Ana `generateTestAction` akışına kasıtlı olarak karışmıyor —
 * ayrı, gözlemlenebilir bir önizleme.
 */
export async function generateRagPreviewAction(params: {
  subjectId: string;
  kazanimId: string;
  difficultyLabel: string;
}): Promise<{
  question: GeneratedQuestion | null;
  references: RetrievedQuestion[];
  previewMode: boolean;
}> {
  const { previewMode } = await requireRoleAction("student");
  if (previewMode || !supabaseConfigured()) {
    return { question: null, references: [], previewMode: true };
  }

  const supabase = await createClient();
  const [{ data: subjectRow }, { data: kazanimRow }] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", params.subjectId).single(),
    supabase.from("topics").select("name").eq("id", params.kazanimId).single(),
  ]);
  if (!subjectRow || !kazanimRow) {
    throw new Error("Ders/kazanım bulunamadı");
  }

  const { question, references } = await generateRagQuestion({
    subject: subjectRow.name,
    kazanim: kazanimRow.name,
    difficultyLabel: params.difficultyLabel,
    questionType: "multiple_choice",
  });

  return { question, references, previewMode: false };
}

export async function assignAsHomeworkAction(payload: {
  title: string;
  subjectName: string;
  items: TestItem[];
}): Promise<{ assigned: boolean; previewMode: boolean }> {
  const { user, previewMode } = await requireRoleAction("student");
  if (previewMode || !supabaseConfigured() || !user) {
    return { assigned: false, previewMode: true };
  }

  const supabase = await createClient();
  const category = DEFAULT_CATEGORY_BY_SUBJECT[payload.subjectName] ?? "tyt";

  // Yapay zekayla üretilip henüz kaydedilmemiş sorular (id yok) — ödev olarak
  // atanabilmesi için önce havuza (approved, source: ai_generated) yazılıyor.
  const unsaved = payload.items.filter((q) => !q.id);
  let savedIds: string[] = [];
  if (unsaved.length > 0) {
    const { data: inserted, error } = await supabase
      .from("questions")
      .insert(
        unsaved.map((q) => ({
          question_text: q.text,
          question_type: q.questionType,
          options: q.options,
          correct_answer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic_label: q.topicLabel,
          topic_id: q.topicId,
          category,
          subject_name: payload.subjectName,
          source: "ai_generated" as const,
          status: "approved" as const,
          created_by: user.id,
        })),
      )
      .select("id");
    if (error) throw new Error(error.message);
    savedIds = (inserted ?? []).map((r) => r.id);
  }

  const questionIds = [
    ...payload.items.filter((q): q is TestItem & { id: string } => Boolean(q.id)).map((q) => q.id),
    ...savedIds,
  ];

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const { error: hwError } = await supabase.from("homework").insert({
    assigned_by: user.id,
    student_id: user.id,
    title: payload.title,
    question_ids: questionIds,
    due_date: dueDate.toISOString().slice(0, 10),
  });
  if (hwError) throw new Error(hwError.message);

  return { assigned: true, previewMode: false };
}
