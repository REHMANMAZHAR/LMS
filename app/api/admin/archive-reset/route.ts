import { eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getDb } from "@/db";
import { activity, assessmentAttempts, progress, quizAttempts, quizSessions, settings, systemBackups } from "@/db/schema";

const FAMILY_ID = "talha-family";

export async function POST(request: Request) {
  try {
    await requireFamilySession();
    const payload = await request.json() as { confirmation?: string };
    if (payload.confirmation !== "ARCHIVE AND START WEEK 1") {
      return Response.json({ error: "Exact reset confirmation is required." }, { status: 400 });
    }
    const db = await getDb();
    const [progressRows, settingRows, activityRows, assessmentRows, quizRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.select().from(settings).where(eq(settings.familyId, FAMILY_ID)),
      db.select().from(activity).where(eq(activity.familyId, FAMILY_ID)),
      db.select().from(assessmentAttempts).where(eq(assessmentAttempts.familyId, FAMILY_ID)),
      db.select().from(quizAttempts).where(eq(quizAttempts.familyId, FAMILY_ID)),
    ]);
    const now = new Date().toISOString();
    const snapshot = JSON.stringify({ archivedAt: now, progress: progressRows, settings: settingRows, activity: activityRows, assessmentAttempts: assessmentRows, quizAttempts: quizRows });
    await db.batch([
      db.insert(systemBackups).values({ familyId: FAMILY_ID, label: `Before 22-week rebuild — ${now}`, snapshotJson: snapshot, createdAt: now }),
      db.delete(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.delete(activity).where(eq(activity.familyId, FAMILY_ID)),
      db.delete(assessmentAttempts).where(eq(assessmentAttempts.familyId, FAMILY_ID)),
      db.delete(quizAttempts).where(eq(quizAttempts.familyId, FAMILY_ID)),
      db.delete(quizSessions).where(eq(quizSessions.familyId, FAMILY_ID)),
      db.delete(settings).where(eq(settings.familyId, FAMILY_ID)),
    ]);
    return Response.json({ ok: true, archivedAt: now, archivedRecords: progressRows.length + activityRows.length + assessmentRows.length + quizRows.length });
  } catch (error) {
    console.error("Archive reset failed", error);
    return Response.json({ error: "Nothing was reset. The archive operation did not complete." }, { status: 500 });
  }
}
