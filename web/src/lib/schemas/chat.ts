import { z } from "zod";
import { Type, type Schema } from "@google/genai";

export const chatAnswerSchema = z.object({
  answer: z.string().min(1),
  topic_label: z.string().default(""),
  source_reference: z.string().default(""),
});

export type ChatAnswer = z.infer<typeof chatAnswerSchema>;

export const CHAT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "Adım adım, öğrencinin gördüğü müfredat yöntemiyle yazılmış çözüm (markdown)",
    },
    topic_label: {
      type: Type.STRING,
      description: "Bu sorunun ait olduğu YKS/LGS konu/kazanım tahmini, kısa (ör. 'Türev', 'Yazım Kuralları')",
    },
    source_reference: {
      type: Type.STRING,
      description:
        "Verilen kaynaklardan gerçekten ilgili biri varsa 'Kitap adı, s. X' biçiminde kısa bir referans; hiçbiri ilgili değilse boş string. Asla uydurma.",
    },
  },
  required: ["answer", "topic_label", "source_reference"],
};
