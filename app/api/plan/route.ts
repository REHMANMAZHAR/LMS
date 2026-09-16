import { eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getDb } from "@/db";
import { progress, settings, activity, assessmentAttempts, quizAttempts, systemBackups } from "@/db/schema";
import { GET as getFamilyState } from "@/app/api/state/route";
import { TOPICS } from "@/app/data";
import { assignUnits, lessonUnits, readManifest, type PlanManifest, type PlannedTask } from "@/app/adaptive-plan";

const FAMILY_ID = "talha-family";
const validDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date;
export async function POST(request: Request) {
  try {
    await requireFamilySession();
    const input = await request.json();
    const dailyMinutes = Number(input.dailyMinutes);
    const bufferPercent = Number(input.bufferPercent ?? 20);
    const startsOn = String(input.startsOn || "");
    const targetDate = String(input.targetDate || "");
    const preparationDate = String(input.preparationDate || "");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year:"numeric",month:"2-digit",day:"2-digit" }).format(new Date());
    if (!Number.isInteger(bufferPercent) || bufferPercent < 0 || bufferPercent > 50 || ![startsOn,targetDate,preparationDate].every(validDate) || startsOn <= today || targetDate < startsOn || preparationDate < targetDate || !Number.isInteger(dailyMinutes) || dailyMinutes < 90 || dailyMinutes > 600) {
      return Response.json({ error: "Choose a future start, a syllabus target, a later preparation target and 90–600 daily study minutes." }, { status: 400 });
    }
    const response = await getFamilyState();
    if (!response.ok) return response;
    const current = await response.json();
    const old = readManifest(current.settings);
    if ((input.expectedRevision || "") !== (old?.revision || "")) return Response.json({error:"The plan changed on another device. Refresh the preview before applying."},{status:409});
    const completed = new Set<string>([
      ...current.progress.filter((item: {stage:number}) => item.stage > 0).map((item: {topicId:string}) => item.topicId),
      ...Object.keys(current.archivedCompletions).filter(id => !current.settings[`planner.reopened.${id}`]),
    ]);
    const units = lessonUnits({...current.settings,"planner.bufferPercent":String(bufferPercent)}, completed).filter(unit => !current.settings[`planner.done.${unit.id}`]);
    // Future assignments are regenerated, while every prior assignment and completion survives.
    const previous: PlannedTask[] = [...(old ? [...old.history, ...old.tasks] : []), ...(Array.isArray(input.history) ? input.history : [])];
    if (previous.length > 10000) return Response.json({ error: "The historical plan is too large." }, { status: 400 });
    const history = previous.filter(task => task.originalDate < startsOn || current.settings[`planner.done.${task.id}`]).map(task => {
      const topic = TOPICS.find(item => item.id === task.topic?.id);
      if (!topic || !validDate(task.originalDate) || !task.id || !task.lesson?.title || !["syllabus","revision","past-paper"].includes(task.kind)) throw new Error("A historical assignment is invalid. Nothing was changed.");
      return { ...task, topic, retired: true };
    });
    const manifest: PlanManifest = { version: 3, revision: crypto.randomUUID(), startsOn, dailyMinutes, targetDate, preparationDate, tasks: assignUnits(units, startsOn, dailyMinutes), history: [...new Map(history.map(task=>[task.id,task])).values()] };
    const db = await getDb();
    const [progressRows, settingRows, activityRows, attempts, quizzes] = await Promise.all([
      db.select().from(progress).where(eq(progress.familyId,FAMILY_ID)), db.select().from(settings).where(eq(settings.familyId,FAMILY_ID)),
      db.select().from(activity).where(eq(activity.familyId,FAMILY_ID)), db.select().from(assessmentAttempts).where(eq(assessmentAttempts.familyId,FAMILY_ID)),
      db.select().from(quizAttempts).where(eq(quizAttempts.familyId,FAMILY_ID)),
    ]);
    const now = new Date().toISOString();
    const values: Record<string,string> = { "planner.manifest.v3":JSON.stringify(manifest), targetDate, "planner.preparationDate":preparationDate, dailyMinutes:String(dailyMinutes), studyDays:"6", "planner.bufferPercent":String(bufferPercent) };
    await db.batch([
      db.insert(systemBackups).values({familyId:FAMILY_ID,label:`Before adaptive plan ${manifest.revision}`,snapshotJson:JSON.stringify({ progress:progressRows,settings:settingRows,activity:activityRows,assessmentAttempts:attempts,quizAttempts:quizzes,archivedCompletions:current.archivedCompletions }),createdAt:now}),
      ...Object.entries(values).map(([key,value])=>db.insert(settings).values({familyId:FAMILY_ID,key,value,updatedAt:now}).onConflictDoUpdate({target:[settings.familyId,settings.key],set:{value,updatedAt:now}})),
    ]);
    return Response.json({ok:true,manifest});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan could not be saved.";
    return Response.json({error:message === "UNAUTHENTICATED" ? "Please sign in again." : message},{status:message === "UNAUTHENTICATED" ? 401 : 400});
  }
}
