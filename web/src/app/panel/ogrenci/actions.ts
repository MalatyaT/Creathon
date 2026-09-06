"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { answerStudentQuestion, type ChatTurn } from "@/lib/gemini-tasks/answer-question";
import { findRelatedSources } from "@/lib/gemini-tasks/find-related-sources";
import { generateRagQuestion } from "@/lib/gemini-tasks/generate-rag-question";
import { listFinishedSubjectIds, listFinishedTopicIds } from "@/lib/finished-kazanim";
import { bumpTwinRisk } from "@/lib/twin";
import type { ChatAnswer } from "@/lib/schemas/chat";
import type { GeneratedQuestion } from "@/lib/schemas/generation";

// Bu panel (panel/ogrenci) tasarım gereği gerçek girişi atlıyor (bkz. giris/[role]/page.tsx),
// bu yüzden gerçek auth.uid() yok — sabit bir demo öğrenci hesabına (ogrenci-test@ikiz.local,
// zaten Supabase'de kayıtlı gerçek bir profil/student satırı) yazıyoruz ve RLS'i service-role
// istemciyle bypass ediyoruz. Gerçek girişi olan /panel/soru-sor yolu bundan etkilenmez, o
// kendi cookie tabanlı istemcisiyle auth.uid() üzerinden çalışmaya devam ediyor.
const DEMO_STUDENT_ID = "e955ea74-e05e-4ee4-ad55-3cb43e10a863";

export type ChatSessionSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  topicLabel: string | null;
  sourceReference: string | null;
  createdAt: string;
};

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("student_id", DEMO_STUDENT_ID)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function createChatSession(): Promise<{ id: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ student_id: DEMO_STUDENT_ID })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Oturum oluşturulamadı");
  return { id: data.id };
}

export async function getChatMessages(sessionId: string): Promise<ChatMessageRecord[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, topic_label, source_reference, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    role: row.role as "user" | "assistant",
    content: row.content ?? "",
    topicLabel: row.topic_label,
    sourceReference: row.source_reference,
    createdAt: row.created_at,
  }));
}

function deriveTitle(topicLabel: string, question: string) {
  const base = topicLabel.trim() || question.trim();
  return base.length > 48 ? `${base.slice(0, 48)}…` : base;
}

export async function sendChatMessage(params: {
  sessionId: string;
  history: ChatTurn[];
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<ChatAnswer> {
  const supabase = createAdminClient();
  const { sessionId, ...answerParams } = params;

  const sources = await findRelatedSources(params.question);
  const answer = await answerStudentQuestion({ ...answerParams, sources });

  await supabase.from("chat_messages").insert([
    { student_id: DEMO_STUDENT_ID, session_id: sessionId, role: "user", content: params.question },
    {
      student_id: DEMO_STUDENT_ID,
      session_id: sessionId,
      role: "assistant",
      content: answer.answer,
      topic_label: answer.topic_label,
      source_reference: answer.source_reference || null,
    },
  ]);

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("title")
    .eq("id", sessionId)
    .single();

  await supabase
    .from("chat_sessions")
    .update({
      updated_at: new Date().toISOString(),
      ...(session && !session.title
        ? { title: deriveTitle(answer.topic_label, params.question) }
        : {}),
    })
    .eq("id", sessionId);

  await bumpTwinRisk(supabase, DEMO_STUDENT_ID, answer.topic_label);

  return answer;
}

export type SubjectOption = { id: string; name: string };
export type KazanimOption = { id: string; name: string };

export async function listSubjectOptions(): Promise<SubjectOption[]> {
  const supabase = createAdminClient();
  const finishedSubjectIds = await listFinishedSubjectIds(supabase);
  const { data } = await supabase.from("subjects").select("id, name").order("name");
  return (data ?? []).filter((s) => finishedSubjectIds.has(s.id));
}

export async function listKazanimOptions(subjectId: string): Promise<KazanimOption[]> {
  const supabase = createAdminClient();
  const finishedTopicIds = await listFinishedTopicIds(supabase);
  const { data } = await supabase
    .from("topics")
    .select("id, name")
    .eq("subject_id", subjectId)
    .order("name");
  return (data ?? []).filter((t) => finishedTopicIds.has(t.id));
}

export type ReferenceQuestion = {
  text: string;
  options: string[];
  correctAnswer: string;
  sourceLabel: string | null;
};

export type SingleGenerationResult = {
  reference: ReferenceQuestion | null;
  generated: GeneratedQuestion;
};

/**
 * "Soru Oluşturma" sekmesindeki tekil AI sentez önizlemesi. Önceden yerel Ollama'ya
 * bağlıydı — RAG unification testinde (bkz. TODO.md Track 1) Ollama'nın (qwen2.5:7b)
 * Türkçe matematik muhakemesinde tutarsız/hatalı sorular ürettiği ve ayrıca yerel model
 * yüklenirken sık sık takılıp kaldığı görüldü. Bu yüzden bu ekran da havuzdaki gerçek
 * benzer soruları (retrieval) Gemini'ye referans veren aynı RAG modülüne bağlandı
 * (`generate-rag-question.ts`) — kazanım listesi zaten aynı `topics` tablosundan geliyor,
 * ingest edilen konular otomatik olarak burada da seçilebilir hale gelir.
 */
export async function generateSingleQuestionAction(params: {
  subjectId: string;
  kazanimId: string;
  questionType: "multiple_choice" | "open_ended";
  difficultyLabel: string;
  weightByRisk: boolean;
}): Promise<SingleGenerationResult> {
  const supabase = createAdminClient();

  const { data: subject } = await supabase
    .from("subjects")
    .select("name")
    .eq("id", params.subjectId)
    .single();
  const { data: kazanim } = await supabase
    .from("topics")
    .select("name")
    .eq("id", params.kazanimId)
    .single();
  if (!subject || !kazanim) throw new Error("Ders/kazanım bulunamadı");

  let twinHint: string | undefined;
  if (params.weightByRisk) {
    const { data: twinRow } = await supabase
      .from("twin_state")
      .select("risk_score")
      .eq("student_id", DEMO_STUDENT_ID)
      .ilike("topic_label", `%${kazanim.name}%`)
      .maybeSingle();
    if (twinRow) {
      twinHint = `"${kazanim.name}" kazanımında risk skoru %${Math.round(twinRow.risk_score)} — belirgin şekilde zayıf`;
    }
  }

  const { question: generated, references } = await generateRagQuestion({
    subject: subject.name,
    kazanim: kazanim.name,
    difficultyLabel: params.difficultyLabel,
    questionType: params.questionType,
    twinHint,
  });

  const top = references[0];
  const reference: ReferenceQuestion | null = top
    ? {
        text: top.questionText,
        options: top.options,
        correctAnswer: top.correctAnswer,
        sourceLabel: `benzerlik ${top.similarity.toFixed(2)}`,
      }
    : null;

  return { reference, generated };
}
