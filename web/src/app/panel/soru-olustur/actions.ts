"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { generateQuestionsForTopic } from "@/lib/gemini-tasks/generate-questions";

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  Kolay: [1, 2],
  Orta: [3, 3],
  Zor: [4, 5],
  Karışık: [1, 5],
};

export type TestItem = {
  no: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topicLabel: string;
  difficulty: number;
  sourceLabel: string | null;
};

export async function listTopicsAction(): Promise<string[]> {
  const { previewMode } = await requireRoleAction("student");
  if (previewMode || !supabaseConfigured()) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("topic_label")
    .eq("status", "approved")
    .not("topic_label", "is", null)
    .limit(300);

  const unique = Array.from(new Set((data ?? []).map((r) => r.topic_label).filter(Boolean)));
  return unique as string[];
}

export async function generateTestAction(params: {
  topic: string;
  count: number;
  difficultyLabel: string;
  weightByRisk: boolean;
}): Promise<{ items: TestItem[]; previewMode: boolean }> {
  const { user, previewMode } = await requireRoleAction("student");
  const [minDiff, maxDiff] = DIFFICULTY_RANGES[params.difficultyLabel] ?? [1, 5];

  if (previewMode || !supabaseConfigured() || !user) {
    return { items: [], previewMode: true };
  }

  const supabase = await createClient();

  const { data: poolRows } = await supabase
    .from("questions")
    .select(
      "question_text, options, correct_answer, explanation, difficulty, topic_label, scans(book_title, page_number)",
    )
    .eq("status", "approved")
    .ilike("topic_label", `%${params.topic}%`)
    .gte("difficulty", minDiff)
    .lte("difficulty", maxDiff)
    .limit(params.count);

  const items: TestItem[] = (poolRows ?? []).map((q, i) => {
    const scan = Array.isArray(q.scans) ? q.scans[0] : q.scans;
    return {
      no: i + 1,
      text: q.question_text,
      options: (q.options as string[]) ?? [],
      correctAnswer: q.correct_answer ?? "",
      explanation: q.explanation ?? "",
      topicLabel: q.topic_label ?? params.topic,
      difficulty: q.difficulty ?? 3,
      sourceLabel: scan?.book_title
        ? `${scan.book_title}${scan.page_number ? `, s. ${scan.page_number}` : ""}`
        : null,
    };
  });

  const missing = params.count - items.length;
  if (missing > 0) {
    let twinHint: string | undefined;
    if (params.weightByRisk) {
      const { data: twinRow } = await supabase
        .from("twin_state")
        .select("risk_score, sample_count")
        .eq("student_id", user.id)
        .ilike("topic_label", `%${params.topic}%`)
        .maybeSingle();
      if (twinRow) {
        twinHint = `bu konuda risk skoru %${Math.round(twinRow.risk_score)} (${twinRow.sample_count} kayıt) — belirgin şekilde zayıf`;
      }
    }

    const generated = await generateQuestionsForTopic({
      topic: params.topic,
      difficultyLabel: params.difficultyLabel,
      count: missing,
      twinHint,
    });

    const baseNo = items.length;
    generated.forEach((q, i) => {
      items.push({
        no: baseNo + i + 1,
        text: q.question_text,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        topicLabel: q.topic_label || params.topic,
        difficulty: q.difficulty,
        sourceLabel: null,
      });
    });
  }

  return { items, previewMode: false };
}
