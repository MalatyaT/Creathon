import { z } from "zod";
import { Type, type Schema } from "@google/genai";

export const readAnswerSchema = z.object({
  question_number: z.number().int().min(1),
  marked_option: z.string().default(""),
  transcribed_answer: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
});

export const readAnswerSheetResultSchema = z.object({
  answers: z.array(readAnswerSchema),
});

export type ReadAnswer = z.infer<typeof readAnswerSchema>;
export type ReadAnswerSheetResult = z.infer<typeof readAnswerSheetResultSchema>;

// Gemini'ye verilen response şeması, yukarıdaki zod şemasıyla elle eşleştirilmiştir.
export const READ_ANSWER_SHEET_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question_number: { type: Type.INTEGER, description: "Kağıttaki soru numarası (1'den başlar)" },
          marked_option: {
            type: Type.STRING,
            description: "Çoktan seçmeli sorularda işaretlenmiş şıkkın tek harfi (A/B/C/D/E). Hiç işaret yoksa ya da birden fazla şık işaretliyse boş bırak.",
          },
          transcribed_answer: {
            type: Type.STRING,
            description: "Açık uçlu sorularda öğrencinin elle yazdığı cevabın/çözümün transkripsiyonu. Çoktan seçmeliyse boş bırak.",
          },
          confidence: {
            type: Type.NUMBER,
            description: "0-1 arası: yazının/işaretin ne kadar net okunabildiği (0=okunamadı, 1=tamamen net)",
          },
        },
        required: ["question_number", "marked_option", "transcribed_answer", "confidence"],
      },
    },
  },
  required: ["answers"],
};
