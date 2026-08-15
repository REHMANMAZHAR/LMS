import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { getRuntimeEnv } from "@/app/runtime-env";

const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS progress (
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  topic_id TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER,
  last_studied_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (family_id, topic_id)
);
CREATE TABLE IF NOT EXISTS settings (
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (family_id, key)
);
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  topic_id TEXT,
  subject TEXT,
  kind TEXT NOT NULL,
  stage INTEGER,
  score INTEGER,
  max_score INTEGER,
  minutes INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS login_attempts (
  key TEXT PRIMARY KEY NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);
`;

let schemaReady: Promise<unknown> | null = null;

export async function getDb() {
  const env = await getRuntimeEnv();
  if (!env.DB) {
    throw new Error(
      "The synchronized database is unavailable. Check the Cloudflare D1 binding named `DB`."
    );
  }
  const binding = env.DB as Parameters<typeof drizzle>[0] & {
    exec(query: string): Promise<unknown>;
  };
  const statements = INITIAL_SCHEMA
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean)
  .map((statement) => binding.prepare(statement));

schemaReady ??= binding.batch(statements);
  await schemaReady;

  return drizzle(binding, { schema });
}
