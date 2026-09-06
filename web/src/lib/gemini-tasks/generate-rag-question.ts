import { createAdminClient } from "@/lib/supabase/admin";
import { embedText, generateWithFallback } from "@/lib/gemini";
import {
  GENERATION_RESPONSE_SCHEMA,
  generationResultSchema,
  type GeneratedQuestion,
} from "@/lib/schemas/generation";

export type RetrievedQuestion = {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  topicLabel: string | null;
  difficulty: number | null;
  similarity: number;
};

/**
 * RAG'ın "R" kısmı: verilen kazanıma (embed edilip) en yakın soruları `match_questions`
 * RPC'siyle (migration 0012) çeker. Embedding Gemini (`embedText`) ile yapılır.
 */
export async function retrieveSimilarQuestions(
  kazanim: string,
  subjectName: string,
  limit = 5,
): Promise<RetrievedQuestion[]> {
  const queryEmbedding = await embedText(kazanim);
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("match_questions", {
    query_embedding: queryEmbedding,
    match_count: limit,
    filter_subject: subjectName,
  });

  if (error) throw new Error(`match_questions RPC hatası: ${error.message}`);

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    questionText: row.question_text as string,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    correctAnswer: (row.correct_answer as string) ?? "",
    topicLabel: (row.topic_label as string) ?? null,
    difficulty: (row.difficulty as number) ?? null,
    similarity: row.similarity as number,
  }));
}

function buildGeminiPrompt(params: {
  subject: string;
  kazanim: string;
  difficultyLabel: string;
  questionType: "multiple_choice" | "open_ended";
  references: RetrievedQuestion[];
  twinHint?: string;
}): string {
  const referenceBlock = params.references.length
    ? `Aşağıda aynı/benzer kazanıma ait, havuzdaki ${params.references.length} gerçek referans
soru var (RAG ile bulundu, gerçekten benzer olduğu doğrulandı). Bunları SADECE hangi
kazanımın/çözüm mantığının, hangi zorlukta test edildiğini anlamak için oku — senaryolarını,
isimlerini, nesnelerini, sayılarını ve ŞIKLARINI ASLA KULLANMA veya birebir değiştirerek
tekrarlama. Tamamen kendi kelimelerinle, kendi senaryonla, kendi sayılarınla yepyeni bir soru yaz.
${params.references
  .map(
    (ref, i) =>
      `REFERANS SORU ${i + 1} (sadece stil/kazanım referansı, benzerlik: ${ref.similarity.toFixed(2)}): ${ref.questionText}${
        ref.options.length ? `\nREFERANS ${i + 1} ŞIKLAR (bunları KOPYALAMA): ${ref.options.join(" | ")}` : ""
      }`,
  )
  .join("\n\n")}
`
    : "Not: bu kazanıma ait havuzda hiç referans soru bulunamadı — kendi müfredat bilginle üret.\n";

  const typeInstruction =
    params.questionType === "multiple_choice"
      ? "Çoktan seçmeli olsun: kendi ürettiğin 4 şık yaz (biri doğru, üçü gerçekten mantıklı çeldirici)."
      : "Açık uçlu olsun, kısa bir sayısal/metinsel cevap istesin.";

  return `Sen YKS/LGS için soru yazan, çok dikkatli ve doğru çözen bir öğretmensin.
"${params.subject}" dersinden, "${params.kazanim}" kazanımına ait, ${params.difficultyLabel}
zorlukta, TAMAMEN ORİJİNAL bir soru yazacaksın.

${referenceBlock}
${typeInstruction}
${params.twinHint ? `Öğrencinin bu kazanımda hata deseni: ${params.twinHint} — mümkünse bu tür hataya düşürecek bir çeldirici kur.` : ""}

Soruyu SEN adım adım çöz (gerçekten hesapla, tahmin etme), sonra topic_label alanına
"${params.kazanim}" yaz.`;
}

/**
 * RAG'ın "G" kısmı. Üretim backend'i olarak Gemini seçildi (bkz. TODO.md Track 1 —
 * Ollama/qwen2.5:7b ile karşılaştırıldı, Türkçe matematik muhakemesinde tutarsız/hatalı
 * sorular ürettiği görüldü).
 */
export async function generateRagQuestion(params: {
  subject: string;
  kazanim: string;
  difficultyLabel: string;
  questionType: "multiple_choice" | "open_ended";
  referenceLimit?: number;
  twinHint?: string;
}): Promise<{ question: GeneratedQuestion; references: RetrievedQuestion[] }> {
  const references = await retrieveSimilarQuestions(
    params.kazanim,
    params.subject,
    params.referenceLimit ?? 5,
  );

  const prompt = buildGeminiPrompt({ ...params, references });
  const response = await generateWithFallback({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json", responseSchema: GENERATION_RESPONSE_SCHEMA },
  });

  if (!response.text) throw new Error("Gemini boş yanıt döndürdü");

  const parsed = generationResultSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }
  if (!parsed.data.questions[0]) throw new Error("Gemini soru üretmedi");

  return { question: parsed.data.questions[0], references };
}
