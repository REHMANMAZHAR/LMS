import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const progress = sqliteTable(
  "progress",
  {
    familyId: text("family_id").notNull().default("talha-family"),
    topicId: text("topic_id").notNull(),
    stage: integer("stage").notNull().default(0),
    bestScore: integer("best_score"),
    lastStudiedAt: text("last_studied_at"),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.topicId] })],
);

export const settings = sqliteTable(
  "settings",
  {
    familyId: text("family_id").notNull().default("talha-family"),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.key] })],
);

export const activity = sqliteTable("activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: text("family_id").notNull().default("talha-family"),
  topicId: text("topic_id"),
  subject: text("subject"),
  kind: text("kind").notNull(),
  stage: integer("stage"),
  score: integer("score"),
  maxScore: integer("max_score"),
  minutes: integer("minutes"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const assessmentAttempts = sqliteTable("assessment_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: text("family_id").notNull().default("talha-family"),
  topicId: text("topic_id"),
  subject: text("subject").notNull(),
  assessmentType: text("assessment_type").notNull().default("Topical practice"),
  paper: text("paper"),
  timed: integer("timed", { mode: "boolean" }).notNull().default(false),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  minutes: integer("minutes"),
  errorCategory: text("error_category"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quizSessions = sqliteTable("quiz_sessions", {
  id: text("id").primaryKey(),
  familyId: text("family_id").notNull().default("talha-family"),
  topicId: text("topic_id").notNull(),
  quizVersion: text("quiz_version").notNull(),
  questionIds: text("question_ids").notNull(),
  startedAt: text("started_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  submittedAt: text("submitted_at"),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: text("family_id").notNull().default("talha-family"),
  sessionId: text("session_id").notNull().unique(),
  topicId: text("topic_id").notNull(),
  subject: text("subject").notNull(),
  quizVersion: text("quiz_version").notNull(),
  timed: integer("timed", { mode: "boolean" }).notNull().default(false),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  responsesJson: text("responses_json").notNull(),
  feedbackJson: text("feedback_json").notNull(),
  errorSummary: text("error_summary"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull(),
  blockedUntil: text("blocked_until"),
});


export const quizBankQuestions = sqliteTable(
  "quiz_bank_questions",
  {
    familyId: text("family_id").notNull().default("talha-family"),
    taskId: text("task_id").notNull(),
    questionId: text("question_id").notNull(),
    subject: text("subject").notNull(),
    topicId: text("topic_id").notNull(),
    lessonTitle: text("lesson_title").notNull(),
    questionType: text("question_type").notNull(),
    prompt: text("prompt").notNull(),
    optionsJson: text("options_json").notNull().default("[]"),
    answer: text("answer").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    explanation: text("explanation").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull().default(4),
    sourceReference: text("source_reference"),
    version: integer("version").notNull().default(1),
    importedAt: text("imported_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.familyId, table.taskId, table.questionId] })],
);

export const quizBankSyncs = sqliteTable("quiz_bank_syncs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  familyId: text("family_id").notNull().default("talha-family"),
  status: text("status").notNull(),
  approvedRows: integer("approved_rows").notNull().default(0),
  rejectedRows: integer("rejected_rows").notNull().default(0),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
