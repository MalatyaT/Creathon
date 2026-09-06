import { generateWithFallback, repairJsonLatexEscapes } from "@/lib/gemini";
import {
  GENERATION_RESPONSE_SCHEMA,
  generationResultSchema,
  type GeneratedQuestion,
} from "@/lib/schemas/generation";

/**
 * Her soruya çağıran taraf (generateTestAction) tarafından önceden bir kazanım atanır
 * (kazanimAssignments[i] → i'inci sorunun kazanımı) — modelin kendiliğinden çeşitlenmesini
 * ummak yerine garanti çeşitlilik sağlanır (bkz. plan: "sadece sayıları değiştirerek değil").
 */
export async function generateQuestionsForTopic(params: {
  subject: string;
  kazanimAssignments: string[];
  difficultyLabel: string;
  mcCount: number;
  openCount: number;
  twinHint?: string;
}): Promise<GeneratedQuestion[]> {
  const count = params.kazanimAssignments.length;
  const kazanimList = params.kazanimAssignments
    .map((k, i) => `${i + 1}. ${k}`)
    .join("\n");

  const prompt = `YKS/LGS için "${params.subject}" dersinden, ${params.difficultyLabel} zorlukta,
birbirinden farklı ${count} adet orijinal soru üret (havuzdaki sorularla birebir aynı olmasın).

Aşağıda her soruya bir kazanım atanmış — i'inci soru i'inci kazanımı hedeflesin, topic_label alanına
o kazanımın adını BİREBİR kopyala:
${kazanimList}

Soru tipi dağılımı: ${params.mcCount} tanesi çoktan seçmeli (options alanına MUTLAKA 4 şık yaz, A/B/C
öneki olmadan, doğru cevabı kendin çözerek bul, question_type='multiple_choice'), ${params.openCount}
tanesi açık uçlu (options'ı BOŞ DİZİ bırak, correct_answer'a kısa cevap metni yaz,
question_type='open_ended') — hangisinin hangi tip olacağına sen karar ver, toplam dağılıma uy.

Her soru için: tam metni, (varsa) şıkları, doğru cevabı kendin çözerek bul, kısa bir çözüm gerekçesi,
1-5 arası zorluk puanı ver.
${params.twinHint ? `Öğrencinin bu derste hata deseni: ${params.twinHint} — mümkün olan sorularda özellikle bu tür hataya düşürecek şekilde kurgula.` : ""}

Matematiksel ifadeleri (kesir, kök, üs, denklem gibi GERÇEK matematiksel gösterim gerektiren
ifadeler) LaTeX ile yaz ve MUTLAKA $ ... $ (satır içi) ya da $$ ... $$ (blok) ile sınırla — ör.
"$\\sqrt{11 + \\sqrt{120}}$", "$\\frac{a}{b}$". Sınırlanmamış LaTeX (\\sqrt{...} gibi çıplak
komutlar) sitede render edilmiyor, düz metin olarak görünüyor.
DİKKAT — DÜZ SAYILARI SARMALAMA: cümle içinde geçen basit sayılar/ölçüler ("8 işçi", "15 günde",
"100 birim" gibi — kesir/kök/üs/denklem İÇERMEYEN tek başına bir sayı) için $ işareti KULLANMA,
düz metin olarak yaz. $ işaretini SADECE gerçekten LaTeX gösterimi gerektiren ifadeler için kullan
— "8 işçi" ASLA "$8$ işçi" olarak yazılmaz.
ÖNEMLİ: LaTeX'te "%" bir yorum karakteridir ve ondan sonraki her şeyi yutar — yüzde
sorularında MUTLAKA "\\%" (ters eğik çizgili) kullan, çıplak "%" KULLANMA (ör. "$\\%40$").`;

  const response = await generateWithFallback({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: GENERATION_RESPONSE_SCHEMA },
  });

  if (!response.text) throw new Error("Gemini boş yanıt döndürdü");

  const parsed = generationResultSchema.safeParse(JSON.parse(repairJsonLatexEscapes(response.text)));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }
  return parsed.data.questions;
}
