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
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  topic_id TEXT,
  subject TEXT NOT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'Topical practice',
  paper TEXT,
  timed INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  minutes INTEGER,
  error_category TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS assessment_family_topic_idx
  ON assessment_attempts (family_id, topic_id, created_at);
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  topic_id TEXT NOT NULL,
  quiz_version TEXT NOT NULL,
  question_ids TEXT NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS quiz_session_family_idx
  ON quiz_sessions (family_id, topic_id, started_at);
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  session_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  quiz_version TEXT NOT NULL,
  timed INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  responses_json TEXT NOT NULL,
  feedback_json TEXT NOT NULL,
  error_summary TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS quiz_attempt_session_idx
  ON quiz_attempts (session_id);
CREATE INDEX IF NOT EXISTS quiz_attempt_family_topic_idx
  ON quiz_attempts (family_id, topic_id, created_at);
CREATE TABLE IF NOT EXISTS quiz_bank_questions (
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  task_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  lesson_title TEXT NOT NULL,
  question_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options_json TEXT NOT NULL DEFAULT '[]',
  answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL DEFAULT 4,
  source_reference TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (family_id, task_id, question_id)
);
CREATE INDEX IF NOT EXISTS quiz_bank_task_idx
  ON quiz_bank_questions (family_id, task_id);
CREATE TABLE IF NOT EXISTS quiz_bank_syncs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  status TEXT NOT NULL,
  approved_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS system_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  label TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
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
  const statements = INITIAL_SCHEMA.split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => binding.prepare(statement));
  schemaReady ??= binding.batch(statements);
  await schemaReady;

  return drizzle(binding, { schema });
}
