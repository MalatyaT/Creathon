import { generateWithFallback } from "@/lib/gemini";
import {
  FREEFORM_SHEET_RESPONSE_SCHEMA,
  freeformSheetResultSchema,
  type FreeformItem,
} from "@/lib/schemas/grading";

const PROMPT = `Bu, üzerinde birden fazla açık uçlu soru ve bunlara verilmiş (yazılı/el yazması)
cevap/çözüm bulunan bir kağıt/çalışma sayfası fotoğrafı. Kağıtta önceden bilinen sabit bir soru
sayısı YOK ve sorular numaralanmamış olabilir (ör. bir ızgara/grid düzeninde art arda dizilmiş
olabilir) — kağıtta kaç soru varsa hepsini kendin tespit et ve soldan sağa, yukarıdan aşağıya
doğal okuma sırasına göre kendin 1'den başlayarak numarala.

Görseli dikkatlice, gerekirse bölge bölge incele — el yazısı ilk bakışta net görünmeyebilir,
aceleyle tahmin etme. Her soru için:
- question_text: sorunun tam metnini yaz (basılıysa aynen, el yazmasıysa transkript et).
- answer_text: o soru için yazılan çözümü/nihai cevabı OLDUĞU GİBİ aktar. Rakamları ve son
  cevabı özellikle dikkatli oku (birbirine karışabilen rakam/harfleri — 1/7, 0/6, l/1 gibi —
  ayırt etmeye çalış).
- confidence'ı GERÇEKÇİ ver: hem soru hem cevap gerçekten net okunduysa yüksek (0.8+), biraz
  belirsizse orta (0.5-0.8), silik/karışık/üstü çizili ise DÜŞÜK (0.5 altı) ver — emin olmadığın
  bir okumayı yüksek güvenle işaretlemek, düşük güvenle işaretlemekten daha kötüdür, çünkü bu not
  öğretmenin hangi soruları elle kontrol edeceğine karar vermesi için kullanılacak.
Doğru mu yanlış mı olduğuna KARAR VERME — sadece ne yazdığını aktar.`;

/**
 * "Serbest kağıt" modu (Kağıt Puanlama): önceden var olan bir homework/question_ids eşlemesi
 * OLMADAN, kağıttaki soru+cevap çiftlerini kendi başına tespit edip transkript eder (ör.
 * numarasız, ızgara düzenli bir çalışma kağıdı — bkz. TODO). Doğru/yanlış kararı vermez,
 * çünkü karşılaştırılacak bilinen bir cevap anahtarı yok — sadece okuma + güven skoru üretir.
 */
export async function extractAnswerSheet(imageBase64: string, mimeType: string): Promise<FreeformItem[]> {
  const response = await generateWithFallback({
    model: "gemini-pro-latest",
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { data: imageBase64, mimeType } }, { text: PROMPT }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: FREEFORM_SHEET_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş yanıt döndürdü");
  }

  const parsed = freeformSheetResultSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data.items.sort((a, b) => a.question_number - b.question_number);
}
