import { generateWithFallback } from "@/lib/gemini";
import {
  EXTRACTION_RESPONSE_SCHEMA,
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/schemas/extraction";

const PROMPT = `Bu bir YKS/LGS kaynak kitabı sayfası. Önce sayfadaki konu anlatımının/metnin kısa bir
özetini çıkar (page_summary) — bu özet ileride bir öğrenci sohbet botuna soru sorduğunda "bu kaynakta
şu konu anlatılıyor" diye önerilecek, o yüzden aratılabilir ve açıklayıcı olsun.
Sonra sayfadaki her soruyu ayrı bir kayıt olarak çıkar. Her soru için: tam metni, şıkları (A/B/C
öneki olmadan), doğru cevabı kendin çözerek bul (tek harf ya da kısa cevap), kısa bir çözüm gerekçesi,
1-5 arası zorluk tahmini ve sorunun ait olduğu konu/kazanım tahminini ver.
Sayfada soru yoksa boş bir questions listesi döndür.`;

export async function extractQuestionsFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<ExtractionResult> {
  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş yanıt döndürdü");
  }

  const parsed = extractionResultSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data;
}
