// Veritabanının tam JSON yedeğini alıp supabase/backups/ altına yazar (hackathon teslimi
// için GitHub'da bir kopya bulunsun diye — bkz. TODO.md). Şema zaten supabase/migrations/'da
// kod olarak var; bu script sadece gerçek veriyi (satırları) ekliyor.
import { loadEnvLocal } from "./lib/load-env";
loadEnvLocal();

import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

const TABLES = [
  "subjects",
  "topics",
  "profiles",
  "students",
  "student_links",
  "scans",
  "questions",
  "twin_state",
  "chat_sessions",
  "chat_messages",
  "homework",
  "exams",
];

const OUT_DIR = path.join(__dirname, "..", "..", "supabase", "backups");
const PAGE_SIZE = 1000;

async function dumpTable(supabase: ReturnType<typeof createAdminClient>, table: string) {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  fs.writeFileSync(path.join(OUT_DIR, `${table}.json`), JSON.stringify(rows, null, 2));
  console.log(`${table}: ${rows.length} satır`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const supabase = createAdminClient();
  for (const table of TABLES) {
    await dumpTable(supabase, table);
  }
  console.log("Yedek tamamlandı:", OUT_DIR);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
