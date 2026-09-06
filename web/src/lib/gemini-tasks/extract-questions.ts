import { generateWithFallback, repairJsonLatexEscapes } from "@/lib/gemini";
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
Sayfada soru yoksa boş bir questions listesi döndür.
Matematiksel ifadeleri (kesir, kök, üs gibi GERÇEK matematiksel gösterim gerektiren ifadeler)
LaTeX ile yaz ve $ ... $ / $$ ... $$ ile sınırla — ör. "$\\sqrt{120}$" — sınırlanmamış LaTeX
sitede render edilmiyor, düz metin görünüyor.
DİKKAT — DÜZ SAYILARI SARMALAMA: cümle içinde geçen basit sayılar/ölçüler ("8 işçi", "15 günde",
"100 birim" gibi — kesir/kök/üs İÇERMEYEN tek başına bir sayı) için $ işareti KULLANMA, düz metin
olarak yaz — "8 işçi" ASLA "$8$ işçi" olarak yazılmaz.
ÖNEMLİ: LaTeX'te "%" bir yorum karakteridir ve ondan sonraki her şeyi yutar — yüzde
sorularında MUTLAKA "\\%" (ters eğik çizgili) kullan, çıplak "%" KULLANMA (ör. "$\\%40$").`;

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

  const parsed = extractionResultSchema.safeParse(JSON.parse(repairJsonLatexEscapes(response.text)));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data;
}

const TEXT_PROMPT = `Aşağıda bir YKS/LGS kaynak kitabından bir sayfanın düz metni var (PDF/OCR değil,
kitabın kendi temiz metin çıktısı — iki sütunlu dizgiden dolayı satırlar biraz karışık
gelebilir, dikkatlice ayrıştır). Bu metinle birlikte SANA GÖRSEL/ŞEKİL/TABLO/GRAFİK
VERİLMİYOR, sadece düz metin var. Önce sayfadaki konu anlatımının/metnin kısa bir özetini
çıkar (page_summary). Sonra sayfadaki her soruyu ayrı bir kayıt olarak çıkar — ANCAK bir
soru "yukarıdaki/aşağıdaki şekil", "verilen tablo", "grafikte", "şekildeki üçgen/dörtgen"
gibi metinde bulunmayan bir görsele dayanıyorsa VE o görsel olmadan soru gerçekten
çözülemiyorsa (çoğu geometri/tablo/grafik sorusu böyledir), o soruyu ATLA — questions
listesine ekleme, uydurma bir görsel tanımlayıp çözmeye çalışma. Sadece salt metinden
(sayılarla, önermelerle, tanımlarla vb.) tam ve doğru çözülebilen sorular için: tam metni,
şıkları (A/B/C öneki olmadan), doğru cevabı kendin çözerek bul (tek harf ya da kısa cevap),
kısa bir çözüm gerekçesi, 1-5 arası zorluk tahmini ve sorunun ait olduğu konu/kazanım
tahminini ver. Sayfada uygun soru yoksa boş bir questions listesi döndür.
Matematiksel ifadeleri (kesir, kök, üs gibi GERÇEK matematiksel gösterim gerektiren ifadeler)
LaTeX ile yaz ve $ ... $ / $$ ... $$ ile sınırla — ör. "$\\sqrt{120}$" — sınırlanmamış LaTeX
sitede render edilmiyor, düz metin görünüyor.
DİKKAT — DÜZ SAYILARI SARMALAMA: cümle içinde geçen basit sayılar/ölçüler ("8 işçi", "15 günde",
"100 birim" gibi — kesir/kök/üs İÇERMEYEN tek başına bir sayı) için $ işareti KULLANMA, düz metin
olarak yaz — "8 işçi" ASLA "$8$ işçi" olarak yazılmaz.
ÖNEMLİ: LaTeX'te "%" bir yorum karakteridir ve ondan sonraki her şeyi yutar — yüzde
sorularında MUTLAKA "\\%" (ters eğik çizgili) kullan, çıplak "%" KULLANMA (ör. "$\\%40$").

SAYFA METNİ:
"""
`;

/** `extractQuestionsFromImage`'ın metin-tabanlı ikizi — bookText.xml gibi kaynaklardan
 * gelen temiz sayfa metnini aynı şemayla yapılandırılmış soru listesine çevirir. */
export async function extractQuestionsFromText(pageText: string): Promise<ExtractionResult> {
  const response = await generateWithFallback({
    contents: [{ role: "user", parts: [{ text: `${TEXT_PROMPT}${pageText}\n"""` }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş yanıt döndürdü");
  }

  const parsed = extractionResultSchema.safeParse(JSON.parse(repairJsonLatexEscapes(response.text)));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data;
}
