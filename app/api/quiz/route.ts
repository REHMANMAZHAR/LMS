import { and, desc, eq, sql } from "drizzle-orm";
import { requireFamilySession } from "@/app/family-auth";
import { TOPICS, type SubjectName } from "@/app/data";
import { evidenceForTopic, subjectThreshold } from "@/app/learning-model";
import {
  QUIZ_DURATION_SECONDS,
  QUIZ_VERSION,
  getQuizQuestions,
  markQuestion,
  publicQuestion,
} from "@/app/quiz-bank";
import { hasReviewedQuiz } from "@/app/quiz-model";
import { getDb } from "@/db";
import {
  activity,
  assessmentAttempts,
  progress,
  quizAttempts,
  quizSessions,
} from "@/db/schema";

const FAMILY_ID = "talha-family";
const SUBMISSION_GRACE_SECONDS = 30;

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected quiz error";
  if (message === "UNAUTHENTICATED") {
    return Response.json({ error: "Please sign in again." }, { status: 401 });
  }
  console.error("Quiz API error:", message);
  return Response.json({ error: "The quiz could not be processed. Please try again." }, { status: 500 });
}

function shuffled<T>(values: readonly T[]) {
  const copy = [...values];
  const random = new Uint32Array(1);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    crypto.getRandomValues(random);
    const swapIndex = random[0] % (index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function safeResponses(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 40)
      .map(([key, response]) => [key.slice(0, 80), String(response ?? "").slice(0, 120)]),
  );
}

export async function GET(request: Request) {
  try {
    await requireFamilySession();
    const topicId = new URL(request.url).searchParams.get("topicId") ?? "";
    if (!hasReviewedQuiz(topicId)) {
      return Response.json({ error: "A reviewed quiz is not available for this topic yet." }, { status: 404 });
    }
    const topic = TOPICS.find((item) => item.id === topicId);
    if (!topic) {
      return Response.json({ error: "The selected syllabus topic could not be found." }, { status: 404 });
    }

    const db = await getDb();
    const [topicProgress] = await db
      .select({ stage: progress.stage })
      .from(progress)
      .where(and(eq(progress.familyId, FAMILY_ID), eq(progress.topicId, topicId)))
      .limit(1);
    if ((topicProgress?.stage ?? 0) < 1) {
      return Response.json(
        { error: "Mark this topic as Learning after studying it, then start the quiz." },
        { status: 409 },
      );
    }

    const questions = shuffled(getQuizQuestions(topicId));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + QUIZ_DURATION_SECONDS * 1000);
    const sessionId = crypto.randomUUID();
    await db.insert(quizSessions).values({
      id: sessionId,
      familyId: FAMILY_ID,
      topicId,
      quizVersion: QUIZ_VERSION,
      questionIds: JSON.stringify(questions.map((question) => question.id)),
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    return Response.json(
      {
        sessionId,
        topicId,
        topicCode: topic.code,
        topicTitle: topic.title,
        durationSeconds: QUIZ_DURATION_SECONDS,
        expiresAt: expiresAt.toISOString(),
        questions: questions.map((question, index) => {
          const visible = publicQuestion(question, index + 1);
          return visible.options ? { ...visible, options: shuffled(visible.options) } : visible;
        }),
      },
      { headers: { "cache-control": "no-store" } },
    );
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
    if (!sessionId) {
      return Response.json({ error: "This quiz session is missing. Start the quiz again." }, { status: 400 });
    }

    const db = await getDb();
    const [session] = await db
      .select()
      .from(quizSessions)
      .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.familyId, FAMILY_ID)))
      .limit(1);
    if (!session) {
      return Response.json({ error: "This quiz session could not be found. Start a new quiz." }, { status: 404 });
    }
    if (session.submittedAt) {
      return Response.json({ error: "This quiz has already been submitted." }, { status: 409 });
    }
    if (session.quizVersion !== QUIZ_VERSION || !hasReviewedQuiz(session.topicId)) {
      return Response.json({ error: "This quiz was updated. Please start a fresh attempt." }, { status: 409 });
    }
    const topic = TOPICS.find((item) => item.id === session.topicId);
    if (!topic) {
      return Response.json({ error: "The syllabus topic could not be found." }, { status: 404 });
    }

    const bank = getQuizQuestions(session.topicId);
    const byId = new Map(bank.map((question) => [question.id, question]));
    let questionIds: string[];
    try {
      const parsed = JSON.parse(session.questionIds) as unknown;
      questionIds = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      questionIds = [];
    }
    const questions = questionIds.map((id) => byId.get(id)).filter((item) => item != null);
    if (questions.length !== bank.length) {
      return Response.json({ error: "The quiz question set is incomplete. Please start again." }, { status: 409 });
    }

    const marked = questions.map((question) => markQuestion(question, responses[question.id]));
    const feedback = marked.map((item) => item.feedback);
    const score = feedback.filter((item) => item.correct).length;
    const maxScore = feedback.length;
    const resultPercentage = Math.round((score / maxScore) * 100);
    const threshold = subjectThreshold(topic.subject);
    const now = new Date();
    const startedAt = new Date(session.startedAt);
    const expiresAt = new Date(session.expiresAt);
    const durationSeconds = Math.max(
      0,
      Math.min(7200, Math.round((now.getTime() - startedAt.getTime()) / 1000)),
    );
    const timed = now.getTime() <= expiresAt.getTime() + SUBMISSION_GRACE_SECONDS * 1000;
    const errors = new Map<string, number>();
    marked.forEach(({ errorCategory }) => {
      if (errorCategory) errors.set(errorCategory, (errors.get(errorCategory) ?? 0) + 1);
    });
    const errorSummary = [...errors.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "No major error";
    const previousAttempts = await db
      .select({
        score: assessmentAttempts.score,
        maxScore: assessmentAttempts.maxScore,
        timed: assessmentAttempts.timed,
        createdAt: assessmentAttempts.createdAt,
      })
      .from(assessmentAttempts)
      .where(and(eq(assessmentAttempts.familyId, FAMILY_ID), eq(assessmentAttempts.topicId, topic.id)))
      .orderBy(desc(assessmentAttempts.createdAt));
    const evidence = evidenceForTopic(
      [
        ...previousAttempts.map((attempt) => ({ ...attempt, topicId: topic.id })),
        { topicId: topic.id, score, maxScore, timed, createdAt: now.toISOString() },
      ],
      topic.id,
      topic.subject as SubjectName,
    );
    const passed = resultPercentage >= threshold;
    const awardedStage = passed ? (evidence.secure ? 3 : 2) : 1;
    const minutes = Math.max(1, Math.ceil(durationSeconds / 60));
    const wrongCount = maxScore - score;
    const note = wrongCount
      ? `Built-in topic quiz: review ${wrongCount} correction${wrongCount === 1 ? "" : "s"}.`
      : "Built-in topic quiz completed with full marks.";

    await db.batch([
      db.insert(quizAttempts).values({
        familyId: FAMILY_ID,
        sessionId,
        topicId: topic.id,
        subject: topic.subject,
        quizVersion: QUIZ_VERSION,
        timed,
        score,
        maxScore,
        durationSeconds,
        responsesJson: JSON.stringify(responses),
        feedbackJson: JSON.stringify(feedback),
        errorSummary,
        createdAt: now.toISOString(),
      }),
      db.insert(assessmentAttempts).values({
        familyId: FAMILY_ID,
        topicId: topic.id,
        subject: topic.subject,
        assessmentType: "Topic quiz",
        paper: "Built-in topic quiz",
        timed,
        score,
        maxScore,
        minutes,
        errorCategory: errorSummary,
        note,
        createdAt: now.toISOString(),
      }),
      db
        .insert(progress)
        .values({
          familyId: FAMILY_ID,
          topicId: topic.id,
          stage: awardedStage,
          bestScore: resultPercentage,
          lastStudiedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        })
        .onConflictDoUpdate({
          target: [progress.familyId, progress.topicId],
          set: {
            stage: sql`max(${progress.stage}, ${awardedStage})`,
            bestScore: sql`max(coalesce(${progress.bestScore}, 0), ${resultPercentage})`,
            lastStudiedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          },
        }),
      db.insert(activity).values({
        familyId: FAMILY_ID,
        topicId: topic.id,
        subject: topic.subject,
        kind: "quiz",
        stage: awardedStage,
        score,
        maxScore,
        minutes,
        note: `${note} Submitted by ${user.displayName}.`,
        createdAt: now.toISOString(),
      }),
      db
        .update(quizSessions)
        .set({ submittedAt: now.toISOString() })
        .where(and(eq(quizSessions.id, sessionId), eq(quizSessions.familyId, FAMILY_ID))),
    ]);

    return Response.json({
      score,
      maxScore,
      percentage: resultPercentage,
      threshold,
      passed,
      timed,
      awardedStage,
      secure: evidence.secure,
      evidencePasses: evidence.passes,
      hasTimedPass: evidence.hasTimed,
      feedback,
    });
  } catch (error) {
    return apiError(error);
  }
}
