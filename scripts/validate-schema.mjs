import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const source = readFileSync(new URL("../db/index.ts", import.meta.url), "utf8");
const schemaMatch = source.match(/const INITIAL_SCHEMA = `([\s\S]*?)`;\s*\n/);
assert(schemaMatch, "The automatic D1 schema could not be read.");
const statements = schemaMatch[1]
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

const database = new DatabaseSync(":memory:");
for (const statement of statements) database.exec(statement);
for (const statement of statements) database.exec(statement);

const tables = new Set(
  database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((row) => row.name),
);
for (const table of [
  "progress",
  "settings",
  "activity",
  "assessment_attempts",
  "quiz_sessions",
  "quiz_attempts",
  "login_attempts",
]) {
  assert(tables.has(table), `Automatic D1 initialization is missing table ${table}.`);
}

const quizAttemptColumns = new Set(
  database.prepare("PRAGMA table_info(quiz_attempts)").all().map((column) => column.name),
);
for (const column of ["session_id", "responses_json", "feedback_json", "error_summary"]) {
  assert(quizAttemptColumns.has(column), `quiz_attempts is missing column ${column}.`);
}

const indexes = new Set(
  database.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((row) => row.name),
);
assert(indexes.has("quiz_attempt_session_idx"), "Duplicate quiz submissions are not protected by a unique index.");

database.close();
console.log(`Validated ${statements.length} idempotent D1 schema statements and all quiz tables.`);
