import { generateWithFallback, repairJsonLatexEscapes } from "@/lib/gemini";
import {
  GENERATION_RESPONSE_SCHEMA,
  generationResultSchema,
  type GeneratedQuestion,
} from "@/lib/schemas/generation";

function buildPrompt(count: number): string {
  return `Bu bir referans soru görseli (YKS/LGS tarzı bir kitap sayfası, ekran görüntüsü ya da
el yazısı olabilir). Önce bu soruyu dikkatlice incele: hangi derse/kazanıma ait, hangi zorlukta
(1-5), çoktan seçmeli mi açık uçlu mu, hangi çözüm mantığını/yöntemini test ediyor.

Sonra bu referansa GERÇEKTEN BENZER ${count} adet YENİ, TAMAMEN ORİJİNAL soru üret:
- Aynı konu/kazanım, aynı zorluk seviyesi, aynı soru tipi (çoktan seçmeli/açık uçlu) ve aynı
  çözüm mantığını/yöntemini test etsin.
- Senaryoyu, sayıları, isimleri, şıkları DEĞİŞTİR — referans soruyu birebir ya da ufak
  değişiklikle kopyalama, gerçekten yeni bir soru yaz.
- Her soruyu SEN adım adım çöz (gerçekten hesapla, tahmin etme), doğru cevabı ve kısa çözüm
  gerekçesini buna göre ver.
- topic_label alanına referans sorunun ait olduğu kazanımın adını (kendi tahminin) yaz — her
  soruya aynı ismi kullan.

Matematiksel ifadeleri (kök, kesir, üs, denklem vb.) LaTeX ile yaz ve MUTLAKA $ ... $ (satır içi)
ya da $$ ... $$ (blok) ile sınırla — ör. "$\\sqrt{120}$". Sınırlanmamış LaTeX sitede render
edilmiyor, düz metin olarak görünüyor.
ÖNEMLİ: LaTeX'te "%" bir yorum karakteridir ve ondan sonraki her şeyi yutar — yüzde
sorularında MUTLAKA "\\%" (ters eğik çizgili) kullan, çıplak "%" KULLANMA (ör. "$\\%40$").`;
}

/**
 * "Referans Sorudan Üret": kullanıcı kendi örnek/referans sorusunun görselini yüklüyor,
 * Gemini onu anlayıp aynı konu/zorluk/tip ve çözüm mantığında N yeni orijinal soru üretiyor.
 * Kazanım-tabanlı generate-questions.ts'ten farkı: burada kazanım adı ÖNCEDEN bilinmiyor,
 * Gemini görselden kendi çıkarıyor. Havuza yazılmıyor — sadece önizleme/PDF için.
 */
export async function generateSimilarQuestions(params: {
  imageBase64: string;
  mimeType: string;
  count: number;
}): Promise<GeneratedQuestion[]> {
  const response = await generateWithFallback({
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: params.imageBase64, mimeType: params.mimeType } },
          { text: buildPrompt(params.count) },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema: GENERATION_RESPONSE_SCHEMA },
  });

  if (!response.text) throw new Error("Gemini boş yanıt döndürdü");

  const parsed = generationResultSchema.safeParse(JSON.parse(repairJsonLatexEscapes(response.text)));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }
  if (parsed.data.questions.length === 0) throw new Error("Gemini benzer soru üretemedi");

  return parsed.data.questions;
}
