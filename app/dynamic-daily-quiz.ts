import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { quizBankQuestions } from "@/db/schema";
import {
  DAILY_QUIZ_VERSION,
  getDailyQuiz,
  type DailyQuiz,
  type PrivateQuestion,
} from "./daily-quiz-bank";

const FAMILY_ID = "talha-family";

export async function resolveDailyQuiz(taskId: string): Promise<{ quiz: DailyQuiz; version: string } | undefined> {
  const db = await getDb();
  const rows = await db.select().from(quizBankQuestions).where(
    and(eq(quizBankQuestions.familyId, FAMILY_ID), eq(quizBankQuestions.taskId, taskId)),
  );
  if (!rows.length) {
    const quiz = getDailyQuiz(taskId);
    return quiz ? { quiz, version: DAILY_QUIZ_VERSION } : undefined;
  }

  rows.sort((left, right) => left.questionId.localeCompare(right.questionId));
  const questions: PrivateQuestion[] = rows.map((row) => {
    const options = JSON.parse(row.optionsJson) as Array<{ id: string; label: string }>;
    if (row.questionType === "numeric") {
      return {
        id: row.questionId, prompt: row.prompt, type: "numeric", answer: row.answer,
        correctAnswer: row.correctAnswer, explanation: row.explanation,
        placeholder: "Enter a number",
      };
    }
    return {
      id: row.questionId, prompt: row.prompt, type: "choice", answer: row.answer,
      correctAnswer: row.correctAnswer, explanation: row.explanation, options,
    };
  });
  const version = Math.max(...rows.map((row) => row.version));
  return {
    quiz: {
      taskId,
      stream: rows[0].subject as DailyQuiz["stream"],
      topicId: rows[0].topicId,
      lessonTitle: rows[0].lessonTitle,
      questions,
    },
    version: `sheet-v${version}`,
  };
}
