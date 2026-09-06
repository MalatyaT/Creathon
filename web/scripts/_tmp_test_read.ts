import { loadEnvLocal } from "./lib/load-env";
loadEnvLocal();
import fs from "fs";
import { readAnswerSheet } from "@/lib/gemini-tasks/read-answer-sheet";

async function main() {
  const buf = fs.readFileSync("/home/fethi/Desktop/Creathon/7sinif-yuzdeler-calisma-kagidi-cevap-anahtari.jpg");
  const base64 = buf.toString("base64");

  const expected = Array.from({ length: 21 }, (_, i) => ({
    number: i + 1,
    questionType: "open_ended" as const,
  }));

  const start = Date.now();
  const answers = await readAnswerSheet(base64, "image/jpeg", expected);
  console.log(`Süre: ${Date.now() - start}ms, ${answers.length} cevap döndü\n`);
  for (const a of answers.sort((x, y) => x.question_number - y.question_number)) {
    console.log(`#${a.question_number}: "${a.transcribed_answer}" (güven: ${a.confidence})`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
