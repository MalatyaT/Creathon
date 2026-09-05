import { z } from "zod";
import { Type, type Schema } from "@google/genai";

export const extractedQuestionSchema = z.object({
  question_text: z.string().min(1),
  options: z.array(z.string()).default([]),
  correct_answer: z.string().default(""),
  explanation: z.string().default(""),
  difficulty: z.number().int().min(1).max(5).default(3),
  topic_label: z.string().default(""),
});

export const extractionResultSchema = z.object({
  page_summary: z.string().default(""),
  questions: z.array(extractedQuestionSchema),
});

export type ExtractedQuestion = z.infer<typeof extractedQuestionSchema>;
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

// Gemini'ye verilen response şeması, yukarıdaki zod şemasıyla elle eşleştirilmiştir.
export const EXTRACTION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    page_summary: {
      type: Type.STRING,
      description:
        "Sayfada bir konu anlatımı/metin varsa 2-4 cümlelik kısa özeti; sayfada yalnızca sorular varsa hangi konulara değindiğinin kısa özeti. Sohbet botu bu soruyu soran öğrencilere bu kaynağı önerecek, bu yüzden aratılabilir/açıklayıcı yaz.",
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question_text: { type: Type.STRING, description: "Sorunun tam metni" },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Şık metinleri, A/B/C öneki olmadan",
          },
          correct_answer: {
            type: Type.STRING,
            description: "Doğru şıkkın tek harfi (A/B/C/D/E) ya da açık uçluysa kısa cevap",
          },
          explanation: { type: Type.STRING, description: "Kısa çözüm gerekçesi" },
          difficulty: { type: Type.INTEGER, description: "1 (kolay) - 5 (zor)" },
          topic_label: { type: Type.STRING, description: "YKS/LGS konu/kazanım tahmini" },
        },
        required: ["question_text", "options", "correct_answer", "explanation", "difficulty", "topic_label"],
      },
    },
  },
  required: ["page_summary", "questions"],
};
