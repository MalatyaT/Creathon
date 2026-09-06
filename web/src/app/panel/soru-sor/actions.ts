"use server";

import { requireRoleAction, supabaseConfigured } from "@/lib/auth-guard";
import { createClient } from "@/lib/supabase/server";
import { answerStudentQuestion, type ChatTurn } from "@/lib/gemini-tasks/answer-question";
import { findRelatedSources } from "@/lib/gemini-tasks/find-related-sources";
import { bumpTwinRisk } from "@/lib/twin";
import type { ChatAnswer } from "@/lib/schemas/chat";

export async function sendMessageAction(params: {
  history: ChatTurn[];
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<ChatAnswer> {
  const { user, previewMode } = await requireRoleAction("student");

  const sources = await findRelatedSources(params.question);
  const answer = await answerStudentQuestion({ ...params, sources });

  if (!previewMode && supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.from("chat_messages").insert([
      { student_id: user!.id, role: "user", content: params.question },
      {
        student_id: user!.id,
        role: "assistant",
        content: answer.answer,
        topic_label: answer.topic_label,
        source_reference: answer.source_reference || null,
      },
    ]);
    await bumpTwinRisk(supabase, user!.id, answer.topic_label);
  }

  return answer;
}
