import { desc, eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getDb } from "@/db";
import { activity, progress, settings } from "@/db/schema";

const FAMILY_ID = "talha-family";

export async function GET() {
  try {
    await requireFamilySession();
    const db = await getDb();
    const [progressRows, settingRows, activityRows] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId, FAMILY_ID)),
      db.select().from(settings).where(eq(settings.familyId, FAMILY_ID)),
      db
        .select()
        .from(activity)
        .where(eq(activity.familyId, FAMILY_ID))
        .orderBy(desc(activity.createdAt), desc(activity.id)),
    ]);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(
      JSON.stringify(
        {
          format: "talha-cie-study-backup-v1",
          exportedAt: new Date().toISOString(),
          progress: progressRows,
          settings: settingRows,
          activity: activityRows,
        },
        null,
        2,
      ),
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename="talha-study-backup-${date}.json"`,
          "cache-control": "no-store",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup could not be created.";
    return Response.json(
      { error: message === "UNAUTHENTICATED" ? "Please sign in again." : message },
      { status: message === "UNAUTHENTICATED" ? 401 : 500 },
    );
  }
}
