import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activity, progress, settings } from "@/db/schema";
import { requireFamilySession } from "@/app/family-auth";

const FAMILY_ID = "talha-family";
const SETTING_KEYS = new Set([
  "targetDate",
  "examDate",
  "dailyMinutes",
  "studyDays",
  "studentMode",
]);

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
    const [progressRows, settingRows, activityRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.select().from(settings).where(eq(settings.familyId, FAMILY_ID)),
      db
        .select()
        .from(activity)
        .where(eq(activity.familyId, FAMILY_ID))
        .orderBy(desc(activity.createdAt), desc(activity.id))
        .limit(160),
    ]);

    return Response.json({
      progress: progressRows,
      settings: Object.fromEntries(settingRows.map((row) => [row.key, row.value])),
      activity: activityRows,
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
      if (!topicId || !Number.isInteger(stage) || stage < 0 || stage > 3) {
        return Response.json({ error: "Invalid topic progress." }, { status: 400 });
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

    if (actionName === "setting") {
      const key = String(payload.key ?? "");
      const value = String(payload.value ?? "").slice(0, 120);
      if (!SETTING_KEYS.has(key)) {
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
      const score = Number(payload.score);
      const maxScore = Number(payload.maxScore);
      const minutes = Math.max(0, Math.min(600, Number(payload.minutes ?? 0)));
      const note = String(payload.note ?? "").trim().slice(0, 300);
      if (!topicId || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
        return Response.json({ error: "Enter a valid test score." }, { status: 400 });
      }
      const percentage = Math.round((score / maxScore) * 100);
      const awardedStage = percentage >= 80 ? 3 : percentage >= 60 ? 2 : 1;
      const now = new Date().toISOString();
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
        note: note || `Recorded by ${user.displayName}`,
        createdAt: now,
      });
      return Response.json({ ok: true, percentage, awardedStage, updatedAt: now });
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
