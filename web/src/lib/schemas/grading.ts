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

export const freeformItemSchema = z.object({
  question_number: z.number().int().min(1),
  question_text: z.string().default(""),
  answer_text: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0),
});

export const freeformSheetResultSchema = z.object({
  items: z.array(freeformItemSchema),
});

export type FreeformItem = z.infer<typeof freeformItemSchema>;
export type FreeformSheetResult = z.infer<typeof freeformSheetResultSchema>;

// Gemini'ye verilen response şeması, yukarıdaki zod şemasıyla elle eşleştirilmiştir.
export const FREEFORM_SHEET_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question_number: { type: Type.INTEGER, description: "Kağıttaki soruyu bulduğun sıraya göre verdiğin numara (1'den başlar, kağıtta basılı numara olmasa bile sen sırayla numarala)" },
          question_text: { type: Type.STRING, description: "Sorunun tam metni (kağıtta basılıysa aynen, el yazmasıysa transkript et)" },
          answer_text: { type: Type.STRING, description: "Öğrencinin/kaynağın o soru için yazdığı çözüm/nihai cevap, olduğu gibi" },
          confidence: {
            type: Type.NUMBER,
            description: "0-1 arası: hem soru hem cevabın ne kadar net okunabildiği (0=okunamadı, 1=tamamen net)",
          },
        },
        required: ["question_number", "question_text", "answer_text", "confidence"],
      },
    },
  },
  required: ["items"],
};

export const paperAssessmentSchema = z.object({
  overall_grade: z.number().min(0).max(100),
  overall_comment: z.string().default(""),
});

export type PaperAssessment = z.infer<typeof paperAssessmentSchema>;

// Gemini'ye verilen response şeması, yukarıdaki zod şemasıyla elle eşleştirilmiştir.
export const PAPER_ASSESSMENT_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_grade: {
      type: Type.NUMBER,
      description: "100 üzerinden genel not — sadece doğru/yanlış oranı değil, açık uçlu sorulardaki çözüm kalitesi/çabası da dahil",
    },
    overall_comment: {
      type: Type.STRING,
      description: "Öğretmene 2-3 cümlelik kısa, yapıcı genel değerlendirme (güçlü/zayıf yönler, dikkat çeken hata örüntüleri)",
    },
  },
  required: ["overall_grade", "overall_comment"],
};
