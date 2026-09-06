import { generateWithFallback, repairJsonLatexEscapes } from "@/lib/gemini";
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

Görseli dikkatlice, gerekirse bölge bölge (her soru numarasının yanındaki alanı ayrı ayrı)
incele — el yazısı genelde ilk bakışta net görünmez, aceleyle tahmin etme. Her soru numarası
için öğrencinin ne işaretlediğini/yazdığını oku:
- Çoktan seçmeli sorularda: işaretlenmiş/yuvarlak içine alınmış şıkkın tek harfini (A/B/C/D/E)
  marked_option alanına yaz. Hiçbir şık işaretli değilse ya da birden fazla şık işaretliyse
  (belirsizse) marked_option'ı boş bırak ve confidence'ı düşük ver.
- Açık uçlu sorularda: öğrencinin o soru için yazdığı metni/çözümü/sayısal cevabı OLDUĞU GİBİ
  transcribed_answer alanına yaz. Rakamları ve son/nihai cevabı özellikle dikkatli oku (birbirine
  karışabilen rakam/harfleri — 1/7, 0/6, l/1 gibi — ayırt etmeye çalış). Doğru mu yanlış mı
  olduğuna KARAR VERME, sadece ne yazdığını aktar.
- confidence'ı GERÇEKÇİ ver: yazı gerçekten net ve emin okunduysa yüksek (0.8+), biraz belirsizse
  orta (0.5-0.8), silik/karışık/üstü çizili/yorumlanması gereken el yazısıysa DÜŞÜK (0.5 altı) ver
  — emin olmadığın bir okumayı yüksek güvenle işaretlemek, düşük güvenle işaretlemekten daha
  kötüdür, çünkü öğretmen düşük güvene bakıp elle kontrol edecek.
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
    // El yazısı okuma zor bir görsel görev — Flash yerine doğrudan Pro ile başla (kalite,
    // hız/maliyetten daha önemli: bu öğretmenin tek tek tetiklediği, sık olmayan bir eylem).
    model: "gemini-pro-latest",
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

  const parsed = readAnswerSheetResultSchema.safeParse(JSON.parse(repairJsonLatexEscapes(response.text)));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data.answers;
}
