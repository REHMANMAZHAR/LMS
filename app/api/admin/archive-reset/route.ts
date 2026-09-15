import { eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getDb } from "@/db";
import { activity, assessmentAttempts, progress, quizAttempts, quizSessions, settings, systemBackups } from "@/db/schema";
import { ACTIVE_PLAN_VERSION } from "@/app/lesson-plan";

const FAMILY_ID = "talha-family";
const PLAN_START = "2026-09-15";

export async function POST(request: Request) {
  try {
    await requireFamilySession();
    const payload = await request.json() as { confirmation?: string; planVersion?: string };
    if (payload.confirmation !== "ARCHIVE AND START WEEK 1" || payload.planVersion !== ACTIVE_PLAN_VERSION) {
      return Response.json({ error: "Exact reset confirmation and plan version are required." }, { status: 400 });
    }
    const db = await getDb();
    const currentSettings = await db.select().from(settings).where(eq(settings.familyId, FAMILY_ID));
    if (currentSettings.some((row) => row.key === "planVersion" && row.value === ACTIVE_PLAN_VERSION)) {
      return Response.json({ ok: true, alreadyActive: true });
    }
    const [progressRows, activityRows, assessmentRows, quizRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.select().from(activity).where(eq(activity.familyId, FAMILY_ID)),
      db.select().from(assessmentAttempts).where(eq(assessmentAttempts.familyId, FAMILY_ID)),
      db.select().from(quizAttempts).where(eq(quizAttempts.familyId, FAMILY_ID)),
    ]);
    const now = new Date().toISOString();
    const snapshot = JSON.stringify({
      archivedAt: now,
      reason: "Activate corrected Talha plan; only explicitly confirmed topics remain in maintenance",
      progress: progressRows,
      settings: currentSettings,
      activity: activityRows,
      assessmentAttempts: assessmentRows,
      quizAttempts: quizRows,
    });
    await db.batch([
      db.insert(systemBackups).values({ familyId: FAMILY_ID, label: `Before corrected plan ${ACTIVE_PLAN_VERSION} — ${now}`, snapshotJson: snapshot, createdAt: now }),
      db.delete(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.delete(activity).where(eq(activity.familyId, FAMILY_ID)),
      db.delete(assessmentAttempts).where(eq(assessmentAttempts.familyId, FAMILY_ID)),
      db.delete(quizAttempts).where(eq(quizAttempts.familyId, FAMILY_ID)),
      db.delete(quizSessions).where(eq(quizSessions.familyId, FAMILY_ID)),
      db.delete(settings).where(eq(settings.familyId, FAMILY_ID)),
      db.insert(settings).values([
        { familyId: FAMILY_ID, key: "planVersion", value: ACTIVE_PLAN_VERSION, updatedAt: now },
        { familyId: FAMILY_ID, key: "plannerStartDate", value: PLAN_START, updatedAt: now },
        { familyId: FAMILY_ID, key: "targetDate", value: "2027-02-21", updatedAt: now },
        { familyId: FAMILY_ID, key: "examDate", value: "2027-05-21", updatedAt: now },
        { familyId: FAMILY_ID, key: "dailyMinutes", value: "360", updatedAt: now },
        { familyId: FAMILY_ID, key: "studyDays", value: "7", updatedAt: now },
        { familyId: FAMILY_ID, key: "reminderTime", value: "09:00", updatedAt: now },
        { familyId: FAMILY_ID, key: "remindersEnabled", value: "false", updatedAt: now },
      ]),
    ]);
    return Response.json({ ok: true, archivedAt: now, archivedRecords: progressRows.length + activityRows.length + assessmentRows.length + quizRows.length });
  } catch (error) {
    console.error("Archive reset failed", error);
    return Response.json({ error: "Nothing was reset. The archive operation did not complete." }, { status: 500 });
  }
}
