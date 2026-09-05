import { generateWithFallback } from "@/lib/gemini";
import {
  EXTRACTION_RESPONSE_SCHEMA,
  extractionResultSchema,
  type ExtractedQuestion,
} from "@/lib/schemas/extraction";
import { Type, type Schema } from "@google/genai";

const GENERATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: { questions: EXTRACTION_RESPONSE_SCHEMA.properties!.questions },
  required: ["questions"],
};

export async function generateQuestionsForTopic(params: {
  topic: string;
  difficultyLabel: string;
  count: number;
  twinHint?: string;
}): Promise<ExtractedQuestion[]> {
  const prompt = `YKS/LGS için "${params.topic}" konusundan, ${params.difficultyLabel} zorlukta,
birbirinden farklı ${params.count} adet orijinal soru üret (havuzdaki sorularla birebir aynı olmasın).
Her soru için: tam metni, şıkları (A/B/C öneki olmadan), doğru cevabı kendin çözerek bul, kısa bir
çözüm gerekçesi, 1-5 arası zorluk puanı ver. topic_label alanına her zaman "${params.topic}" yaz.
${params.twinHint ? `Öğrencinin bu konudaki hata deseni: ${params.twinHint} — sorular özellikle bu tür hataya düşürecek şekilde kurulsun.` : ""}`;

  const response = await generateWithFallback({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: GENERATION_SCHEMA },
  });

  if (!response.text) throw new Error("Gemini boş yanıt döndürdü");

  const parsed = extractionResultSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }
  return parsed.data.questions;
}
