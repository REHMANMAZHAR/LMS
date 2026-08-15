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

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: text("window_started_at").notNull(),
  blockedUntil: text("blocked_until"),
});
