import { generateWithFallback } from "@/lib/gemini";
import {
  READ_ANSWER_SHEET_RESPONSE_SCHEMA,
  readAnswerSheetResultSchema,
  type ReadAnswer,
} from "@/lib/schemas/grading";

export type ExpectedQuestion = {
  number: number;
  questionType: "multiple_choice" | "open_ended";
};

function buildPrompt(expected: ExpectedQuestion[]): string {
  const list = expected
    .map((q) => `${q.number}. ${q.questionType === "multiple_choice" ? "Çoktan seçmeli (A-E)" : "Açık uçlu (yazılı çözüm)"}`)
    .join("\n");

  return `Bu bir öğrencinin doldurduğu cevap kağıdı/sınav kağıdı fotoğrafı. Kağıtta aşağıdaki
soru numaraları ve tipleri bekleniyor:
${list}

Her soru numarası için öğrencinin ne işaretlediğini/yazdığını oku:
- Çoktan seçmeli sorularda: işaretlenmiş/yuvarlak içine alınmış şıkkın tek harfini (A/B/C/D/E)
  marked_option alanına yaz. Hiçbir şık işaretli değilse ya da birden fazla şık işaretliyse
  (belirsizse) marked_option'ı boş bırak ve confidence'ı düşük ver.
- Açık uçlu sorularda: öğrencinin o soru için yazdığı metni/çözümü/sayısal cevabı OLDUĞU GİBİ
  transcribed_answer alanına yaz. Doğru mu yanlış mı olduğuna KARAR VERME, sadece ne yazdığını
  aktar. El yazısı belirsizse en iyi okumanı yaz ve confidence'ı düşür.
Kağıtta olmayan bir soru numarası için answers listesine kayıt ekleme.`;
}

/**
 * Kağıt Puanlama: öğrencinin cevap kağıdı fotoğrafını okuyup her soru için ne
 * işaretlediğini/yazdığını çıkarır. Doğru/yanlış kararı BURADA verilmez — çoktan seçmeli
 * için deterministik karşılaştırma (bkz. panel/ogretmen/actions.ts), açık uçlu için
 * öğretmen onayı ile ayrı adımda yapılır (AI sadece transkripsiyon yapar).
 */
export async function readAnswerSheet(
  imageBase64: string,
  mimeType: string,
  expected: ExpectedQuestion[],
): Promise<ReadAnswer[]> {
  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: buildPrompt(expected) }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: READ_ANSWER_SHEET_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş yanıt döndürdü");
  }

  const parsed = readAnswerSheetResultSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data.answers;
}
