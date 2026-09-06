// RAG unification (Matematik pilot) için: 0008-0012 migration'larının canlı DB'ye
// uygulanıp uygulanmadığını (henüz uygulanmamışsa) kontrol edip eksik olanları
// tek tek uygular. Proje Supabase CLI kullanmıyor (bkz. TODO.md) — önceki oturumlar
// gibi doğrudan Postgres bağlantısıyla çalışır. Idempotent: her dosya için ayırt edici
// bir sütun/tablo/fonksiyon kontrolü yapıp sadece eksikse çalıştırır.
import fs from "fs";
import path from "path";
import { Client } from "pg";
import { loadEnvLocal, projectRefFromUrl } from "./lib/load-env";

loadEnvLocal();

const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "supabase", "migrations");

const CHECKS: Array<{ file: string; check: string }> = [
  {
    file: "0008_book_category.sql",
    check: `select 1 from information_schema.columns where table_name='questions' and column_name='category'`,
  },
  {
    file: "0009_chat_sessions.sql",
    check: `select 1 from information_schema.tables where table_name='chat_sessions'`,
  },
  {
    file: "0010_kazanim_taxonomy.sql",
    check: `select 1 from information_schema.columns where table_name='topics' and column_name='aliases'`,
  },
  {
    file: "0011_question_type.sql",
    check: `select 1 from information_schema.columns where table_name='questions' and column_name='question_type'`,
  },
  {
    file: "0012_match_questions.sql",
    check: `select 1 from pg_proc where proname='match_questions'`,
  },
  {
    file: "0013_match_questions_with_source.sql",
    check: `select 1 from pg_proc where proname='match_questions_with_source'`,
  },
  {
    file: "0014_question_attempts.sql",
    check: `select 1 from information_schema.tables where table_name='question_attempts'`,
  },
];

async function main() {
  const ref = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("SUPABASE_DB_PASSWORD tanımlı değil (.env.local kontrol et)");

  const client = new Client({
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: "postgres",
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log(`Bağlandı: db.${ref}.supabase.co`);

  try {
    for (const { file, check } of CHECKS) {
      const { rows } = await client.query(check);
      if (rows.length > 0) {
        console.log(`[atlandı, zaten uygulanmış] ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`[uygulanıyor] ${file}...`);
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("commit");
        console.log(`[tamamlandı] ${file}`);
      } catch (err) {
        await client.query("rollback");
        throw new Error(`${file} uygulanamadı: ${(err as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
