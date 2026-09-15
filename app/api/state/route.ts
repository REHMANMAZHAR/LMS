import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, assessmentAttempts, progress, settings, systemBackups } from "@/db/schema";
import { requireFamilySession } from "@/app/family-auth";
import { SUBJECTS, TOPICS, type SubjectName } from "@/app/data";
import {
  ASSESSMENT_TYPES,
  ERROR_CATEGORIES,
  evidenceForTopic,
  subjectThreshold,
} from "@/app/learning-model";
import { MAINTENANCE_TOPIC_IDS } from "@/app/lesson-plan";

const FAMILY_ID = "talha-family";
const SETTING_KEYS = new Set([
  "planVersion",
  "targetDate",
  "examDate",
  "dailyMinutes",
  "studyDays",
  "studentMode",
  "plannerStartDate",
  "reminderTime",
  "remindersEnabled",
]);
const VALID_SUBJECTS = new Set<string>(SUBJECTS);
const VALID_ASSESSMENT_TYPES = new Set<string>(ASSESSMENT_TYPES);
const VALID_ERROR_CATEGORIES = new Set<string>(ERROR_CATEGORIES);

async function requireApiUser() {
  return requireFamilySession();
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  if (message === "UNAUTHENTICATED") {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  return Response.json({ error: message }, { status: 500 });
}

export async function GET() {
  try {
    await requireApiUser();
    const db = await getDb();
    const [progressRows, settingRows, activityRows, attemptRows, backupRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.select().from(settings).where(eq(settings.familyId, FAMILY_ID)),
      db
        .select()
        .from(activity)
        .where(eq(activity.familyId, FAMILY_ID))
        .orderBy(desc(activity.createdAt), desc(activity.id))
        .limit(160),
      db
        .select()
        .from(assessmentAttempts)
        .where(eq(assessmentAttempts.familyId, FAMILY_ID))
        .orderBy(desc(assessmentAttempts.createdAt), desc(assessmentAttempts.id))
        .limit(240),
      db
        .select()
        .from(systemBackups)
        .where(eq(systemBackups.familyId, FAMILY_ID))
        .orderBy(desc(systemBackups.createdAt), desc(systemBackups.id))
        .limit(1),
    ]);

    const archivedCompletions: Record<string, string> = {};
    try {
      const snapshot = backupRows[0]?.snapshotJson ? JSON.parse(backupRows[0].snapshotJson) as {
        progress?: Array<{ topicId?: string; lastStudiedAt?: string | null }>;
        activity?: Array<{ topicId?: string | null; createdAt?: string }>;
      } : null;
      for (const topicId of MAINTENANCE_TOPIC_IDS) {
        const candidates = [
          ...(snapshot?.progress ?? []).filter((item) => item.topicId === topicId).map((item) => item.lastStudiedAt ?? ""),
          ...(snapshot?.activity ?? []).filter((item) => item.topicId === topicId).map((item) => item.createdAt ?? ""),
        ].filter(Boolean).sort();
        if (candidates.length) archivedCompletions[topicId] = candidates[candidates.length - 1];
      }
    } catch {
      // A malformed historical snapshot must never prevent the live LMS from loading.
    }

    return Response.json({
      progress: progressRows,
      settings: Object.fromEntries(settingRows.map((row) => [row.key, row.value])),
      activity: activityRows,
      attempts: attemptRows,
      archivedCompletions,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiUser();
    const payload = (await request.json()) as Record<string, unknown>;
    const actionName = String(payload.action ?? "");
    const db = await getDb();

    if (actionName === "progress") {
      const topicId = String(payload.topicId ?? "").slice(0, 100);
      const subject = String(payload.subject ?? "").slice(0, 60);
      const stage = Number(payload.stage);
      const minutes = Math.max(0, Math.min(600, Number(payload.minutes ?? 0)));
      if (!topicId || !Number.isInteger(stage) || stage < 0 || stage > 1) {
        return Response.json(
          { error: "Learning may be marked manually; Practising and Secure require assessment evidence." },
          { status: 400 },
        );
      }
      const now = new Date().toISOString();
      await db
        .insert(progress)
        .values({
          familyId: FAMILY_ID,
          topicId,
          stage,
          lastStudiedAt: stage > 0 ? now : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [progress.familyId, progress.topicId],
          set: {
            stage,
            lastStudiedAt: stage > 0 ? now : null,
            updatedAt: now,
          },
        });
      await db.insert(activity).values({
        familyId: FAMILY_ID,
        topicId,
        subject,
        kind: "progress",
        stage,
        minutes: minutes || null,
        note: `Updated by ${user.displayName}`,
        createdAt: now,
      });
      return Response.json({ ok: true, updatedAt: now });
    }

    if (actionName === "planner") {
      const taskId = String(payload.taskId ?? "").slice(0, 160);
      const topicId = String(payload.topicId ?? "").slice(0, 100);
      const subject = String(payload.subject ?? "").slice(0, 60);
      const checked = payload.checked === true;
      const completedDate = String(payload.completedDate ?? "").slice(0, 10);
      const minutes = Math.max(0, Math.min(180, Number(payload.minutes ?? 0)));
      if (!taskId || !TOPICS.some((topic) => topic.id === topicId && topic.subject === subject)) {
        return Response.json({ error: "Invalid planner task." }, { status: 400 });
      }
      const now = new Date().toISOString();
      await db.batch([
        db.insert(settings)
          .values({ familyId: FAMILY_ID, key: `planner.done.${taskId}`, value: checked ? completedDate : "", updatedAt: now })
          .onConflictDoUpdate({
            target: [settings.familyId, settings.key],
            set: { value: checked ? completedDate : "", updatedAt: now },
          }),
        db.insert(settings)
          .values({ familyId: FAMILY_ID, key: `planner.doneAt.${taskId}`, value: checked ? now : "", updatedAt: now })
          .onConflictDoUpdate({
            target: [settings.familyId, settings.key],
            set: { value: checked ? now : "", updatedAt: now },
          }),
        db.insert(activity).values({
          familyId: FAMILY_ID,
          topicId,
          subject,
          kind: checked ? "planner_task" : "planner_uncheck",
          minutes: checked ? minutes : -minutes,
          note: checked ? `Task ${taskId} completed by ${user.displayName}` : `Task ${taskId} reopened by ${user.displayName}`,
          createdAt: now,
        }),
      ]);
      return Response.json({ ok: true, updatedAt: now });
    }

    if (actionName === "setting") {
      const key = String(payload.key ?? "");
      const value = String(payload.value ?? "").slice(0, 120);
      if (!SETTING_KEYS.has(key) && !key.startsWith("planner.")) {
        return Response.json({ error: "Invalid setting." }, { status: 400 });
      }
      const now = new Date().toISOString();
      await db
        .insert(settings)
        .values({ familyId: FAMILY_ID, key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: [settings.familyId, settings.key],
          set: { value, updatedAt: now },
        });
      return Response.json({ ok: true });
    }

    if (actionName === "test") {
      const topicId = String(payload.topicId ?? "").slice(0, 100);
      const subject = String(payload.subject ?? "").slice(0, 60);
      const assessmentType = String(payload.assessmentType ?? "Topical practice");
      const paper = String(payload.paper ?? "").trim().slice(0, 100);
      const timed = payload.timed === true;
      const score = Number(payload.score);
      const maxScore = Number(payload.maxScore);
      const minutes = Math.max(0, Math.min(600, Number(payload.minutes ?? 0)));
      const errorCategory = String(payload.errorCategory ?? "No major error");
      const note = String(payload.note ?? "").trim().slice(0, 300);
      const topicMatchesSubject = TOPICS.some(
        (topic) => topic.id === topicId && topic.subject === subject,
      );
      if (
        !topicId ||
        !topicMatchesSubject ||
        !VALID_SUBJECTS.has(subject) ||
        !VALID_ASSESSMENT_TYPES.has(assessmentType) ||
        !VALID_ERROR_CATEGORIES.has(errorCategory) ||
        !Number.isFinite(score) ||
        !Number.isFinite(maxScore) ||
        maxScore <= 0 ||
        score < 0 ||
        score > maxScore
      ) {
        return Response.json({ error: "Enter a valid test score." }, { status: 400 });
      }
      const percentage = Math.round((score / maxScore) * 100);
      const now = new Date().toISOString();
      const threshold = subjectThreshold(subject as SubjectName);
      const previousAttempts = await db
        .select({ score: assessmentAttempts.score, maxScore: assessmentAttempts.maxScore, timed: assessmentAttempts.timed, createdAt: assessmentAttempts.createdAt })
        .from(assessmentAttempts)
        .where(and(eq(assessmentAttempts.familyId, FAMILY_ID), eq(assessmentAttempts.topicId, topicId)));
      const evidence = evidenceForTopic(
        [
          ...previousAttempts.map((attempt) => ({ ...attempt, topicId })),
          { topicId, score, maxScore, timed, createdAt: now },
        ],
        topicId,
        subject as SubjectName,
      );
      const secure = evidence.secure;
      const awardedStage = percentage >= threshold ? (secure ? 3 : 2) : 1;

      await db.insert(assessmentAttempts).values({
        familyId: FAMILY_ID,
        topicId,
        subject,
        assessmentType,
        paper: paper || null,
        timed,
        score,
        maxScore,
        minutes: minutes || null,
        errorCategory,
        note: note || null,
        createdAt: now,
      });
      await db
        .insert(progress)
        .values({
          familyId: FAMILY_ID,
          topicId,
          stage: awardedStage,
          bestScore: percentage,
          lastStudiedAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [progress.familyId, progress.topicId],
          set: {
            stage: sql`max(${progress.stage}, ${awardedStage})`,
            bestScore: sql`max(coalesce(${progress.bestScore}, 0), ${percentage})`,
            lastStudiedAt: now,
            updatedAt: now,
          },
        });
      await db.insert(activity).values({
        familyId: FAMILY_ID,
        topicId,
        subject,
        kind: "test",
        stage: awardedStage,
        score,
        maxScore,
        minutes: minutes || null,
        note: note || `${assessmentType} recorded by ${user.displayName}`,
        createdAt: now,
      });
      return Response.json({
        ok: true,
        percentage,
        awardedStage,
        threshold,
        secure,
        evidencePasses: evidence.passes,
        hasTimedPass: evidence.hasTimed,
        updatedAt: now,
      });
    }

    if (actionName === "removeTest") {
      const id = Number(payload.id);
      if (!Number.isInteger(id) || id <= 0) {
        return Response.json({ error: "Invalid result." }, { status: 400 });
      }
      await db
        .delete(activity)
        .where(and(eq(activity.familyId, FAMILY_ID), eq(activity.id, id), eq(activity.kind, "test")));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
