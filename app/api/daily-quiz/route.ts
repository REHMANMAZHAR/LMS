import { and, eq } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import {
  markDailyQuestion,
  publicDailyQuestion,
} from "@/app/daily-quiz-bank";
import { resolveDailyQuiz } from "@/app/dynamic-daily-quiz";
import { getDb } from "@/db";
import { activity, quizAttempts, quizSessions } from "@/db/schema";
import { TOPICS } from "@/app/data";

const FAMILY_ID = "talha-family";

function safeResponses(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).slice(0, 80).map(([key, response]) => [key.slice(0, 80), String(response ?? "").slice(0, 120)]));
}

function baseQuestionId(id: string) {
  const parts = id.split(":");
  return parts[parts.length - 1] || id;
}

function stableRank(seed: string, value: string) {
  let hash = 2166136261;
  for (const char of `${seed}:${value}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function adaptiveDailySelection<T extends { id: string; estimatedMinutes?: number }>(
  questions: T[],
  attempts: Array<{ feedbackJson: string }>,
  seed: string,
  targetMinutes = 20,
) {
  // Only prior answers for questions in this exact topic/quiz pool may influence
  // adaptive ranking. Family-wide history must not make an unrelated lesson look weak.
  const eligible = new Set(questions.map((question) => baseQuestionId(question.id)));
  const seen = new Set<string>();
  const weak = new Set<string>();
  for (const attempt of attempts) {
    try {
      const feedback = JSON.parse(attempt.feedbackJson) as Array<{ questionId?: string; correct?: boolean; status?: string }>;
      for (const item of feedback) {
        if (!item.questionId) continue;
        const id = baseQuestionId(item.questionId);
        if (!eligible.has(id)) continue;
        seen.add(id);
        if (item.status === "skipped" || item.correct === false) weak.add(id);
      }
    } catch {}
  }
  const ranked = [...questions].sort((a, b) => {
    const aid = baseQuestionId(a.id), bid = baseQuestionId(b.id);
    const apriority = weak.has(aid) ? 0 : !seen.has(aid) ? 1 : 2;
    const bpriority = weak.has(bid) ? 0 : !seen.has(bid) ? 1 : 2;
    return apriority - bpriority || stableRank(seed, a.id) - stableRank(seed, b.id);
  });
  const selected: T[] = [];
  let minutes = 0;
  for (const question of ranked) {
    const cost = Math.max(1, question.estimatedMinutes ?? 1);
    if (selected.length && minutes + cost > targetMinutes) continue;
    selected.push(question);
    minutes += cost;
    if (minutes >= targetMinutes) break;
  }
  return selected.length ? selected : ranked.slice(0, 1);
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
    const sessionId = crypto.randomUUID();
    const db = await getDb();
    const priorAttempts = resolved!.mode === "daily"
      ? (await db.select({ feedbackJson: quizAttempts.feedbackJson, createdAt: quizAttempts.createdAt }).from(quizAttempts).where(eq(quizAttempts.familyId, FAMILY_ID)))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100)
      : [];
    const selectedQuestions = resolved!.mode === "daily"
      ? adaptiveDailySelection(dailyQuiz.questions, priorAttempts, sessionId, 20)
      : dailyQuiz.questions;
    const selectedMinutes = selectedQuestions.reduce((sum, question) => sum + Math.max(1, question.estimatedMinutes ?? 1), 0);
    const durationSeconds = resolved!.mode === "daily" ? Math.min(20, Math.max(1, selectedMinutes)) * 60 : resolved!.durationSeconds;
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000);
    await db.insert(quizSessions).values({
      id: sessionId,
      familyId: FAMILY_ID,
      topicId: taskId,
      quizVersion: resolved!.version,
      questionIds: JSON.stringify(selectedQuestions.map((question) => question.id)),
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return Response.json({
      sessionId,
      taskId,
      stream: dailyQuiz.stream,
      lessonTitle: dailyQuiz.lessonTitle,
      durationSeconds,
      mode: resolved!.mode, missingLessons: resolved!.missingLessons, sourceNote: resolved!.sourceNote,
      expiresAt: expiresAt.toISOString(),
      questions: selectedQuestions.map((question, index) => publicDailyQuestion(question, index + 1)),
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
    if (questions.length !== questionIds.length) return Response.json({ error: "This daily check is incomplete. Start again." }, { status: 409 });

    const feedback = questions.map((question) => markDailyQuestion(question, responses[question.id]));
    const score = feedback.filter((item) => item.correct).length;
    const maxScore = feedback.length;
    const percentage = Math.round((score / maxScore) * 100);
    const readyThreshold = resolved?.mode === "weekly" ? 80 : dailyQuiz.stream === "Mathematics" || dailyQuiz.stream === "Chemistry" ? 85 : 80;
    const outcome = percentage >= readyThreshold ? "Ready to continue" : percentage >= 60 ? "More practice needed" : "Repeat foundation";
    const skipped = feedback.filter((item) => item.status === "skipped");
    const wrong = feedback.filter((item) => item.status === "wrong");
    const missed = [...wrong, ...skipped];
    const weakTopicIds = resolved?.mode === "weekly"
      ? [...new Set(missed.map((item) => item.questionId.split(":")[0]).filter(Boolean))]
      : [];
    const weakTopicNames = weakTopicIds
      .map((id) => TOPICS.find((topic) => topic.id === id)?.title)
      .filter((title): title is string => Boolean(title))
      .slice(0, 3);
    const weakTopicText = weakTopicNames.length ? ` Focus next on: ${weakTopicNames.join("; ")}.` : "";
    const guidance = resolved?.mode === "weekly"
      ? outcome === "Ready to continue"
        ? "The week’s learning is on track. Review every correction, then continue with next week’s plan."
        : outcome === "More practice needed"
          ? `Review ${wrong.length} wrong and ${skipped.length} skipped question${wrong.length + skipped.length === 1 ? "" : "s"}, revisit those exact lessons and retry before the next weekend.${weakTopicText}`
          : `Pause progression on the weakest lessons, rebuild their foundations and repeat this Weekend Quiz after correction.${weakTopicText}`
      : outcome === "Ready to continue"
        ? "Continue to the next scheduled lesson, then revisit this check during Sunday consolidation."
        : outcome === "More practice needed"
          ? `Correct ${wrong.length} wrong answer${wrong.length === 1 ? "" : "s"} and return to ${skipped.length} skipped question${skipped.length === 1 ? "" : "s"}, then retake this check.`
          : "Re-read the lesson key points, work through one guided example, and retry before moving on independently.";
    const now = new Date();
    const durationSeconds = Math.max(0, Math.min(3600, Math.round((now.getTime() - new Date(session.startedAt).getTime()) / 1000)));
    const subject = resolved?.mode === "weekly" ? "Weekly review" : dailyQuiz.stream.startsWith("Pakistan") ? "Pakistan Studies" : dailyQuiz.stream;

    await db.batch([
      db.insert(quizAttempts).values({
        familyId: FAMILY_ID, sessionId, topicId: session.topicId, subject,
        quizVersion: session.quizVersion, timed: now.getTime() <= new Date(session.expiresAt).getTime(),
        score, maxScore, durationSeconds, responsesJson: JSON.stringify(responses),
        feedbackJson: JSON.stringify(feedback), errorSummary: `${outcome}; wrong=${wrong.length}; skipped=${skipped.length}`, createdAt: now.toISOString(),
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

