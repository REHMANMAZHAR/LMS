import { desc, eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getRuntimeEnv } from "@/app/runtime-env";
import { getDb } from "@/db";
import { quizBankQuestions, quizBankSyncs } from "@/db/schema";

const FAMILY_ID = "talha-family";
import { validateQuizCsv } from "@/app/quiz-import";

export async function GET() {
  try {
    await requireFamilySession();
    const db = await getDb();
    const [latest] = await db.select().from(quizBankSyncs).where(eq(quizBankSyncs.familyId, FAMILY_ID)).orderBy(desc(quizBankSyncs.createdAt)).limit(1);
    return Response.json({ configured: Boolean((await getRuntimeEnv()).QUIZ_BANK_DAILY_CSV_URL), latest: latest ?? null });
  } catch { return Response.json({ error: "Unable to read quiz-bank status." }, { status: 500 }); }
}

export async function POST() {
  try {
    await requireFamilySession();
    const sourceUrl = (await getRuntimeEnv()).QUIZ_BANK_DAILY_CSV_URL;
    if (!sourceUrl) return Response.json({ error: "QUIZ_BANK_DAILY_CSV_URL is not configured." }, { status: 503 });
    const response = await fetch(sourceUrl, { headers: { accept: "text/csv" } });
    if (!response.ok) throw new Error(`Google Sheet returned ${response.status}.`);
    const { valid, rejected } = validateQuizCsv(await response.text());
    const db = await getDb();
    await db.batch([
      db.delete(quizBankQuestions).where(eq(quizBankQuestions.familyId, FAMILY_ID)),
      ...Array.from({ length: Math.ceil(valid.length / 5) }, (_, index) => db.insert(quizBankQuestions).values(valid.slice(index * 5, index * 5 + 5))),
      db.insert(quizBankSyncs).values({ familyId: FAMILY_ID, status: "success", approvedRows: valid.length, rejectedRows: rejected.length, note: rejected.length ? `Rejected: ${rejected.slice(0, 8).join(", ")}` : "All approved rows passed validation." }),
    ]);
    return Response.json({ ok: true, approvedRows: valid.length, rejectedRows: rejected.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz-bank sync failed.";
    try { const db = await getDb(); await db.insert(quizBankSyncs).values({ familyId: FAMILY_ID, status: "failed", note: message }); } catch {}
    return Response.json({ error: message }, { status: 400 });
  }
}

