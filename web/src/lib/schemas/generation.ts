import { z } from "zod";
import { Type, type Schema } from "@google/genai";

// OCR/tarama şemasından (extraction.ts) bilinçli olarak ayrı: üretimde soru tipi
// (çoktan seçmeli/açık uçlu) ayrımı var, taramada yok.
export const generatedQuestionSchema = z.object({
  question_text: z.string().min(1),
  question_type: z.enum(["multiple_choice", "open_ended"]).default("multiple_choice"),
  options: z.array(z.string()).default([]),
  correct_answer: z.string().default(""),
  explanation: z.string().default(""),
  difficulty: z.number().int().min(1).max(5).default(3),
  topic_label: z.string().min(1),
});

export const generationResultSchema = z.object({
  questions: z.array(generatedQuestionSchema),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GenerationResult = z.infer<typeof generationResultSchema>;

// extraction.ts/chat.ts ile aynı desen: Gemini'ye verilen response şeması yukarıdaki
// zod şemasıyla elle eşleştirilmiştir.
export const GENERATION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question_text: { type: Type.STRING, description: "Sorunun tam metni" },
          question_type: {
            type: Type.STRING,
            description: "'multiple_choice' (çoktan seçmeli) ya da 'open_ended' (açık uçlu)",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Çoktan seçmeliyse şık metinleri (A/B/C öneki olmadan); açık uçluysa boş dizi",
          },
          correct_answer: {
            type: Type.STRING,
            description: "Çoktan seçmeliyse doğru şıkkın tek harfi (A/B/C/D); açık uçluysa kısa cevap metni",
          },
          explanation: { type: Type.STRING, description: "Kısa çözüm gerekçesi" },
          difficulty: { type: Type.INTEGER, description: "1 (kolay) - 5 (zor)" },
          topic_label: {
            type: Type.STRING,
            description: "Bu soruya atanan kazanımın adı, BİREBİR verilen listeden kopyalanmış olmalı",
          },
        },
        required: ["question_text", "question_type", "options", "correct_answer", "explanation", "difficulty", "topic_label"],
      },
    },
  },
  required: ["questions"],
};
