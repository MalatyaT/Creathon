import { generateWithFallback } from "@/lib/gemini";
import {
  PAPER_ASSESSMENT_RESPONSE_SCHEMA,
  paperAssessmentSchema,
  type PaperAssessment,
} from "@/lib/schemas/grading";

export type GradedQuestionSummary = {
  questionNumber: number;
  questionType: "multiple_choice" | "open_ended";
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  confidence: number;
};

function buildPrompt(questions: GradedQuestionSummary[]): string {
  const lines = questions
    .map((q) => {
      const status =
        q.isCorrect === true ? "DOĞRU" : q.isCorrect === false ? "YANLIŞ" : "İNCELEME BEKLİYOR";
      return `${q.questionNumber}. [${q.questionType === "multiple_choice" ? "çoktan seçmeli" : "açık uçlu"}] öğrenci cevabı: "${q.studentAnswer || "(boş/okunamadı)"}" · doğru cevap: "${q.correctAnswer}" · durum: ${status} · okuma güveni: %${Math.round(q.confidence * 100)}`;
    })
    .join("\n");

  return `Sen bir YKS/LGS öğretmenisin. Bir öğrencinin cevap kağıdının soru bazlı otomatik
değerlendirme dökümü aşağıda. Buna dayanarak öğrenciye ön bir genel değerlendirme yap:

${lines}

Kurallar:
- overall_grade: 100 üzerinden genel bir not ver. Sadece doğru/yanlış oranını değil, açık uçlu
  sorularda gösterilen çözüm kalitesini/çabasını (transkript edilen metinden anlaşıldığı kadarıyla)
  da dikkate al. Okuma güveni düşük (%50 altı) sorularda notu ona göre temkinli belirle.
- overall_comment: öğretmene 2-3 cümlelik kısa, yapıcı bir genel değerlendirme yaz — güçlü/zayıf
  yönler ve dikkat çeken hata örüntüleri (ör. tekrar eden bir kazanım hatası) varsa belirt. Bu bir
  ÖN değerlendirme olduğunu ima et (öğretmenin kendi kararını verecek olan taraf olduğunu unutma).`;
}

/**
 * Kağıt Puanlama'nın son adımı: soru bazlı deterministik sonuçlara (doğru/yanlış, güven
 * skoru) bakıp bütün kağıt için bir ön genel not + kısa yorum üretir. Doğru/yanlış kararını
 * DEĞİŞTİRMEZ — sadece üzerine holistik bir okuma ekler, nihai karar öğretmende kalır.
 */
export async function assessPaper(questions: GradedQuestionSummary[]): Promise<PaperAssessment> {
  const response = await generateWithFallback({
    contents: [{ role: "user", parts: [{ text: buildPrompt(questions) }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: PAPER_ASSESSMENT_RESPONSE_SCHEMA,
    },
  });

  if (!response.text) throw new Error("Gemini boş yanıt döndürdü");

  const parsed = paperAssessmentSchema.safeParse(JSON.parse(response.text));
  if (!parsed.success) {
    throw new Error(`Gemini yanıtı beklenen şemaya uymadı: ${parsed.error.message}`);
  }
  return parsed.data;
}
