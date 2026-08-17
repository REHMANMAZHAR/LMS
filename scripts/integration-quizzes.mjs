import { Miniflare } from "miniflare";
import { QUIZ_BANK } from "../app/quiz-bank.ts";

const TEST_ACCESS_CODE = "Talha-local-integration-code";
const TEST_SIGNING_SECRET = "local-integration-signing-secret-1234567890";
const BASE_URL = "http://talha.test";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const miniflare = new Miniflare({
  scriptPath: "dist/server/index.js",
  modules: true,
  modulesRoot: "dist/server",
  compatibilityDate: "2026-05-22",
  compatibilityFlags: ["nodejs_compat"],
  bindings: {
    FAMILY_ACCESS_CODE: TEST_ACCESS_CODE,
    SESSION_SIGNING_SECRET: TEST_SIGNING_SECRET,
  },
  d1Databases: { DB: "talha-integration-db" },
  d1Persist: false,
  assets: { directory: "dist/client", binding: "ASSETS" },
  logRequests: false,
});

async function request(path, init = {}) {
  return miniflare.dispatchFetch(`${BASE_URL}${path}`, init);
}

function correctResponses(topicId, publicQuestions) {
  const bank = new Map(QUIZ_BANK[topicId].map((question) => [question.id, question]));
  return Object.fromEntries(publicQuestions.map((publicQuestion) => {
    const stored = bank.get(publicQuestion.id);
    assert(stored, `Missing stored question ${publicQuestion.id}.`);
    return [
      publicQuestion.id,
      stored.type === "choice" ? stored.correctOptionId : String(stored.correctValue),
    ];
  }));
}

try {
  const unauthenticated = await request("/api/state");
  assert(unauthenticated.status === 401, `Expected unauthenticated state to return 401, got ${unauthenticated.status}.`);

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: TEST_ACCESS_CODE }),
  });
  assert(login.status === 200, `Local family login failed with ${login.status}.`);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert(cookie, "The login response did not set a family session cookie.");
  const headers = { cookie, "content-type": "application/json" };

  const markLearning = await request("/api/state", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ action: "progress", topicId: "math-e1-1", subject: "Mathematics", stage: 1, minutes: 20 }),
  });
  assert(markLearning.status === 200, `Marking a topic Learning failed with ${markLearning.status}.`);

  const forbiddenManualPractice = await request("/api/state", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ action: "progress", topicId: "math-e1-1", subject: "Mathematics", stage: 2 }),
  });
  assert(forbiddenManualPractice.status === 400, "Manual Practising must be rejected without evidence.");

  const quizStart = await request("/api/quiz?topicId=math-e1-1", { headers: { cookie } });
  assert(quizStart.status === 200, `Starting a reviewed quiz failed with ${quizStart.status}.`);
  const quiz = await quizStart.json();
  assert(quiz.questions.length === 8, "The quiz should deliver eight questions.");
  const exposed = JSON.stringify(quiz);
  assert(!exposed.includes("correctOptionId") && !exposed.includes("correctValue") && !exposed.includes("explanation"), "The start response exposed answer-key data.");

  const firstSubmit = await request("/api/quiz", {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId: quiz.sessionId, responses: correctResponses("math-e1-1", quiz.questions) }),
  });
  assert(firstSubmit.status === 200, `Submitting a correct quiz failed with ${firstSubmit.status}.`);
  const firstResult = await firstSubmit.json();
  assert(firstResult.percentage === 100 && firstResult.awardedStage === 2, "A first 100% result should award Practising.");
  assert(firstResult.secure === false && firstResult.evidencePasses === 1, "One same-day pass must not award Secure.");

  const duplicateSubmit = await request("/api/quiz", {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId: quiz.sessionId, responses: correctResponses("math-e1-1", quiz.questions) }),
  });
  assert(duplicateSubmit.status === 409, "A quiz session must not be submitted twice.");

  const database = await miniflare.getD1Database("DB");
  const yesterday = new Date(Date.now() - 86_400_000).toISOString();
  await database.prepare("UPDATE assessment_attempts SET created_at = ? WHERE assessment_type = 'Topic quiz'").bind(yesterday).run();

  const secondStart = await request("/api/quiz?topicId=math-e1-1", { headers: { cookie } });
  const secondQuiz = await secondStart.json();
  const secondSubmit = await request("/api/quiz", {
    method: "POST",
    headers,
    body: JSON.stringify({ sessionId: secondQuiz.sessionId, responses: correctResponses("math-e1-1", secondQuiz.questions) }),
  });
  const secondResult = await secondSubmit.json();
  assert(secondSubmit.status === 200 && secondResult.secure === true && secondResult.awardedStage === 3, "A timed pass on a second date should award Secure.");

  const state = await request("/api/state", { headers: { cookie } });
  const stateBody = await state.json();
  const progress = stateBody.progress.find((item) => item.topicId === "math-e1-1");
  assert(progress?.stage === 3 && progress.bestScore === 100, "The synchronized state did not retain Secure quiz progress.");
  assert(stateBody.attempts.filter((attempt) => attempt.assessmentType === "Topic quiz").length === 2, "Quiz evidence is missing from assessment history.");

  const backup = await request("/api/backup", { headers: { cookie } });
  const backupBody = await backup.json();
  assert(backup.status === 200 && backupBody.format === "talha-cie-study-backup-v3", "The v3 backup could not be created.");
  assert(backupBody.quizAttempts.length === 2, "Detailed quiz attempts are missing from the backup.");

  console.log("Quiz integration passed: auth, D1 initialization, evidence promotion, duplicate protection, sync, and backup.");
} finally {
  await miniflare.dispose();
}
