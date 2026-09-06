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

Soru tipi dağılımı: ${params.mcCount} tanesi çoktan seçmeli (4 şık, A/B/C öneki olmadan, doğru cevabı
kendin çözerek bul), ${params.openCount} tanesi açık uçlu (options boş dizi, correct_answer kısa cevap
metni) — hangisinin hangi tip olacağına sen karar ver, toplam dağılıma uy.

Her soru için: tam metni, (varsa) şıkları, doğru cevabı kendin çözerek bul, kısa bir çözüm gerekçesi,
1-5 arası zorluk puanı ver.
${params.twinHint ? `Öğrencinin bu derste hata deseni: ${params.twinHint} — mümkün olan sorularda özellikle bu tür hataya düşürecek şekilde kurgula.` : ""}

Matematiksel ifadeleri (kök, kesir, üs, denklem vb.) LaTeX ile yaz ve MUTLAKA $ ... $ (satır içi)
ya da $$ ... $$ (blok) ile sınırla — ör. "$\\sqrt{11 + \\sqrt{120}}$", "$\\frac{a}{b}$". Sınırlanmamış
LaTeX (\\sqrt{...} gibi çıplak komutlar) sitede render edilmiyor, düz metin olarak görünüyor.`;

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
