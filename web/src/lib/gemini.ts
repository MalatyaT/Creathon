import { GoogleGenAI, ApiError } from "@google/genai";
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";

let client: GoogleGenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tanımlı değil (.env.local kontrol et)");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// Kota/limit (429) veya geçici aşırı yüklenme (503) durumunda sırayla denenecek modeller.
// "-latest" takma adları Google'ın güncel önerdiği modele otomatik işaret eder — modelin
// kendisi eskiyip erişimden kaldırıldığında (bkz. `gemini-2.5-flash` artık yeni kullanıcılara
// kapalı) kodu elle güncellemek gerekmesin diye birincil/ikincil olarak bunlar tercih edildi.
// Üçüncüsü ayrı bir kota havuzuna düşsün diye Flash-Lite.
const MODEL_FALLBACK_CHAIN = [
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-flash-lite-latest",
] as const;

function isRetryableStatus(status: number) {
  return status === 429 || status === 503;
}

/**
 * generateContent'i model listesindeki sırayla dener; kota/aşırı yük hatasında
 * bir sonraki modele düşer. Başka bir hata (400, 401 vb.) hemen fırlatılır.
 */
export async function generateWithFallback(
  params: Omit<GenerateContentParameters, "model"> & { model?: string },
): Promise<GenerateContentResponse> {
  const ai = getClient();
  const chain = params.model
    ? [params.model, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== params.model)]
    : [...MODEL_FALLBACK_CHAIN];

  let lastError: unknown;
  for (const model of chain) {
    try {
      return await ai.models.generateContent({ ...params, model });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && isRetryableStatus(error.status)) {
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export { getClient as getGeminiClient };
