import fs from "fs";
import path from "path";
import WS from "ws";

// Node 20 (bu makinede kurulu) global `WebSocket` sağlamıyor; @supabase/supabase-js'in
// realtime-js'i ise client oluşturulurken (kullanılmasa bile) bunu arıyor ve hemen fırlatıyor.
// Node 22+'ta veya Next.js runtime'ında bu sorun yok, sadece bağımsız script'lerde gerekiyor.
if (typeof globalThis.WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = WS;
}

// Bağımsız çalıştırılan (Next.js request lifecycle dışındaki) script'ler .env.local'i
// kendi okumak zorunda — proje dotenv kullanmıyor (bkz. package.json), CLAUDE.md/AGENTS.md
// planına göre bu yeni script'lerin ortak deseni.
export function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", "..", ".env.local");
  const raw = fs.readFileSync(envPath, "utf-8");

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function projectRefFromUrl(url: string): string {
  const match = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/);
  if (!match) throw new Error(`Beklenmeyen NEXT_PUBLIC_SUPABASE_URL formatı: ${url}`);
  return match[1];
}
