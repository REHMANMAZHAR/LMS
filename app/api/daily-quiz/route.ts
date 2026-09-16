import { and, eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import {
  markDailyQuestion,
  publicDailyQuestion,
} from "@/app/daily-quiz-bank";
import { resolveDailyQuiz } from "@/app/dynamic-daily-quiz";
import { getDb } from "@/db";
import { activity, quizAttempts, quizSessions } from "@/db/schema";

const FAMILY_ID = "talha-family";

function safeResponses(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 80).map(([key, response]) => [key.slice(0, 80), String(response ?? "").slice(0, 120)]));
}

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected daily-check error";
  if (message === "UNAUTHENTICATED") return Response.json({ error: "Please sign in again." }, { status: 401 });
  console.error("Daily quiz API error:", message);
  return Response.json({ error: "The daily check could not be processed. Please try again." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireFamilySession();
    const taskId = new URL(request.url).searchParams.get("taskId") ?? "";
    const resolved = await resolveDailyQuiz(taskId);
    const dailyQuiz = resolved?.quiz;
    if (!dailyQuiz) return Response.json({ error: "No reviewed questions match this lesson or completed week yet. The quiz bank must be populated before a reliable assessment can start. Your study completion is still saved; do not tick unrelated topics to unlock a test." }, { status: 404 });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + resolved!.durationSeconds * 1000);
    const sessionId = crypto.randomUUID();
    const db = await getDb();
    await db.insert(quizSessions).values({
      id: sessionId,
      familyId: FAMILY_ID,
      topicId: taskId,
      quizVersion: resolved!.version,
      questionIds: JSON.stringify(dailyQuiz.questions.map((question) => question.id)),
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return Response.json({
      sessionId,
      taskId,
      stream: dailyQuiz.stream,
      lessonTitle: dailyQuiz.lessonTitle,
      durationSeconds: resolved!.durationSeconds,
      mode: resolved!.mode, missingLessons: resolved!.missingLessons, sourceNote: resolved!.sourceNote,
      expiresAt: expiresAt.toISOString(),
      questions: dailyQuiz.questions.map((question, index) => publicDailyQuestion(question, index + 1)),
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireFamilySession();
    const payload = (await request.json()) as Record<string, unknown>;
    const sessionId = String(payload.sessionId ?? "").slice(0, 80);
    const responses = safeResponses(payload.responses);
    if (!sessionId) return Response.json({ error: "This daily-check session is missing. Start again." }, { status: 400 });

    const db = await getDb();
    const [session] = await db.select().from(quizSessions).where(and(eq(quizSessions.id, sessionId), eq(quizSessions.familyId, FAMILY_ID))).limit(1);
    if (!session) return Response.json({ error: "This daily check could not be found. Start a new check." }, { status: 404 });
    if (session.submittedAt) return Response.json({ error: "This daily check has already been submitted." }, { status: 409 });
    const resolved = await resolveDailyQuiz(session.topicId);
    const dailyQuiz = resolved?.quiz;
    if (resolved && session.quizVersion !== resolved.version) return Response.json({ error: "This daily check was updated. Start a fresh attempt." }, { status: 409 });
    if (!dailyQuiz) return Response.json({ error: "The lesson check could not be found." }, { status: 404 });

    let questionIds: string[] = [];
    try {
      const parsed = JSON.parse(session.questionIds) as unknown;
      if (Array.isArray(parsed)) questionIds = parsed.filter((item): item is string => typeof item === "string");
    } catch {
      questionIds = [];
    }
    const byId = new Map(dailyQuiz.questions.map((question) => [question.id, question]));
    const questions = questionIds.map((id) => byId.get(id)).filter((item) => item != null);
    if (questions.length !== dailyQuiz.questions.length) return Response.json({ error: "This daily check is incomplete. Start again." }, { status: 409 });

    const feedback = questions.map((question) => markDailyQuestion(question, responses[question.id]));
    const score = feedback.filter((item) => item.correct).length;
    const maxScore = feedback.length;
    const percentage = Math.round((score / maxScore) * 100);
    const readyThreshold = dailyQuiz.stream === "Mathematics" || dailyQuiz.stream === "Chemistry" ? 85 : 80;
    const outcome = percentage >= readyThreshold ? "Ready to continue" : percentage >= 60 ? "More practice needed" : "Repeat foundation";
    const missed = feedback.filter((item) => !item.correct);
    const guidance = outcome === "Ready to continue"
      ? "Continue to the next scheduled lesson, then revisit this check during Sunday consolidation."
      : outcome === "More practice needed"
        ? `Correct the ${missed.length} missed idea${missed.length === 1 ? "" : "s"}, repeat two similar examples, then retake this check.`
        : "Re-read the lesson key points, work through one guided example, and retry before moving on independently.";
    const now = new Date();
    const durationSeconds = Math.max(0, Math.min(3600, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)));
    const subject = resolved?.mode === "weekly" ? "Weekly review" : dailyQuiz.stream.startsWith("Pakistan") ? "Pakistan Studies" : dailyQuiz.stream;

    await db.batch([
      db.insert(quizAttempts).values({
        familyId: FAMILY_ID, sessionId, topicId: session.topicId, subject,
        quizVersion: session.quizVersion, timed: now.getTime() <= new Date(session.expiresAt).getTime(),
        score, maxScore, durationSeconds, responsesJson: JSON.stringify(responses),
        feedbackJson: JSON.stringify(feedback), errorSummary: outcome, createdAt: now.toISOString(),
      }),
      db.insert(activity).values({
        familyId: FAMILY_ID, topicId: session.topicId, subject, kind: "daily-check",
        score, maxScore, minutes: Math.max(1, Math.ceil(durationSeconds / 60)),
        note: `${dailyQuiz.stream} · ${dailyQuiz.lessonTitle}: ${outcome}. ${guidance} Submitted by ${user.displayName}.`,
        createdAt: now.toISOString(),
      }),
      db.update(quizSessions).set({ submittedAt: now.toISOString() }).where(and(eq(quizSessions.id, sessionId), eq(quizSessions.familyId, FAMILY_ID))),
    ]);

    return Response.json({ score, maxScore, percentage, outcome, guidance, feedback });
  } catch (error) {
    return apiError(error);
  }
}

