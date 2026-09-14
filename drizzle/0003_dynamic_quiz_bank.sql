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
CREATE INDEX IF NOT EXISTS quiz_bank_task_idx ON quiz_bank_questions (family_id, task_id);
CREATE TABLE IF NOT EXISTS quiz_bank_syncs (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  family_id TEXT NOT NULL DEFAULT 'talha-family',
  status TEXT NOT NULL,
  approved_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);