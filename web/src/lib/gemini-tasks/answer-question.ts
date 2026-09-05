import { generateWithFallback } from "@/lib/gemini";
import { CHAT_RESPONSE_SCHEMA, chatAnswerSchema, type ChatAnswer } from "@/lib/schemas/chat";
import type { RelatedSource } from "@/lib/gemini-tasks/find-related-sources";

const BASE_INSTRUCTION = `Sen İkiz platformunun ders koçusun. YKS/LGS'ye hazırlanan bir öğrenciye
adım adım, öğrencinin okulda gördüğü klasik çözüm yöntemiyle anlat. Kısa ve net ol, gereksiz
uzatma. Türkçe yaz. Cevabın sonunda bu sorunun ait olduğu YKS/LGS konu/kazanımını da tahmin et.`;

function buildSystemInstruction(sources: RelatedSource[]) {
  if (sources.length === 0) return BASE_INSTRUCTION;

  const sourceLines = sources
    .map((s, i) => {
      const location = s.pageNumber ? `${s.bookTitle}, s. ${s.pageNumber}` : s.bookTitle;
      const examples = s.sampleQuestions.length
        ? `\n  Örnek sorular: ${s.sampleQuestions.map((q) => `"${q}"`).join(" · ")}`
        : "";
      return `${i + 1}. ${location} — ${s.summary}${examples}`;
    })
    .join("\n");

  return `${BASE_INSTRUCTION}

Taranmış kaynaklardan şu özet dizini elinde:
${sourceLines}

Karar kuralı: öğrencinin sorusu, yukarıdaki kaynaklardan birinin konusuyla (aynı kazanım/konu alanı —
ör. ikisi de "yazım kuralları" ya da ikisi de "çokgenler" gibi) örtüşüyorsa, tam olarak aynı soru
olması ŞART DEĞİL — bu kaynağı ilgili say. source_reference alanına "Kitap adı, s. X" biçiminde kısa
bir not düş ve cevabın içinde de ("bu, ... kaynağının X. sayfasındaki konuya/soruya benzer" gibi)
doğal bir cümleyle belirt. Hiçbir kaynağın konusu öğrencinin sorusuyla örtüşmüyorsa source_reference'ı
boş bırak — asla uydurma referans verme.`;
}

export type ChatTurn = { role: "user" | "model"; text: string };

export async function answerStudentQuestion(params: {
  history: ChatTurn[];
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
  sources?: RelatedSource[];
}): Promise<ChatAnswer> {
  const historyContents = params.history.map((turn) => ({
    role: turn.role,
    parts: [{ text: turn.text }],
  }));

  const newTurnParts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];
  if (params.imageBase64 && params.imageMimeType) {
    newTurnParts.push({
      inlineData: { data: params.imageBase64, mimeType: params.imageMimeType },
    });
  }
  newTurnParts.push({ text: params.question });

  const response = await generateWithFallback({
    contents: [...historyContents, { role: "user", parts: newTurnParts }],
    config: {
      systemInstruction: buildSystemInstruction(params.sources ?? []),
      responseMimeType: "application/json",
      responseSchema: CHAT_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) {
    throw new Error("Gemini boş yanıt döndürdü");
  }

  const parsed = chatAnswerSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }

  return parsed.data;
}
