import { desc, eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { getRuntimeEnv } from "@/app/runtime-env";
import { getDb } from "@/db";
import { quizBankQuestions, quizBankSyncs } from "@/db/schema";

const FAMILY_ID = "talha-family";
const HEADERS = ["question_id","task_id","subject","topic_id","lesson_title","question_type","prompt","option_a","option_b","option_c","option_d","correct_answer","explanation","estimated_minutes","review_status","source_reference","version"];

function parseCsv(csv: string) {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = "";
    } else value += char;
  }
  row.push(value); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function validate(csv: string) {
  const rows = parseCsv(csv);
  const headers = rows.shift()?.map((item) => item.trim()) ?? [];
  if (HEADERS.some((header, index) => headers[index] !== header)) throw new Error("The Daily Checks headers do not match the LMS template.");
  const approved = rows.filter((row) => row[14]?.trim().toLowerCase() === "approved");
  const rejected: string[] = []; const seen = new Set<string>();
  const valid = approved.flatMap((row) => {
    const [questionId, taskId, subject, topicId, lessonTitle, type, prompt, a, b, c, d, answer, explanation, minutes, , source, version] = row.map((item) => item.trim());
    const key = `${taskId}:${questionId}`;
    const options = [a,b,c,d].filter(Boolean).map((label, index) => ({ id: String.fromCharCode(97 + index), label }));
    if (!questionId || !taskId || !subject || !topicId || !lessonTitle || !prompt || !answer || !explanation || !["choice","numeric"].includes(type) || seen.has(key) || (type === "choice" && !options.some((option) => option.id === answer))) {
      rejected.push(key || "unnamed row"); return [];
    }
    seen.add(key);
    return [{ familyId: FAMILY_ID, taskId, questionId, subject, topicId, lessonTitle, questionType: type, prompt,
      optionsJson: JSON.stringify(options), answer, correctAnswer: type === "choice" ? (options.find((option) => option.id === answer)?.label ?? answer) : answer,
      explanation, estimatedMinutes: Math.max(1, Number(minutes) || 4), sourceReference: source || null,
      version: Math.max(1, Number(version) || 1), importedAt: new Date().toISOString() }];
  });
  const counts = new Map<string, number>(); valid.forEach((item) => counts.set(item.taskId, (counts.get(item.taskId) ?? 0) + 1));
  for (const [taskId, count] of counts) if (count < 5) throw new Error(`${taskId} has only ${count} approved questions; at least 5 are required.`);
  if (!valid.length) throw new Error("No approved, valid daily-check questions were found.");
  return { valid, rejected };
}

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
    const { valid, rejected } = validate(await response.text());
    const db = await getDb();
    await db.batch([
      db.delete(quizBankQuestions).where(eq(quizBankQuestions.familyId, FAMILY_ID)),
      db.insert(quizBankQuestions).values(valid),
      db.insert(quizBankSyncs).values({ familyId: FAMILY_ID, status: "success", approvedRows: valid.length, rejectedRows: rejected.length, note: rejected.length ? `Rejected: ${rejected.slice(0, 8).join(", ")}` : "All approved rows passed validation." }),
    ]);
    return Response.json({ ok: true, approvedRows: valid.length, rejectedRows: rejected.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz-bank sync failed.";
    try { const db = await getDb(); await db.insert(quizBankSyncs).values({ familyId: FAMILY_ID, status: "failed", note: message }); } catch {}
    return Response.json({ error: message }, { status: 400 });
  }
}
