import { QUIZ_BANK, QUIZ_VERSION, markQuestion } from "../app/quiz-bank.ts";
import { REVIEWED_QUIZ_TOPIC_IDS } from "../app/quiz-model.ts";
import { TOPICS } from "../app/data.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(QUIZ_VERSION.length > 0, "The quiz version must be set.");
assert(REVIEWED_QUIZ_TOPIC_IDS.length === 5, "Phase 1 should contain five reviewed topics.");

const questionIds = new Set();
let questionCount = 0;

for (const topicId of REVIEWED_QUIZ_TOPIC_IDS) {
  const topic = TOPICS.find((item) => item.id === topicId);
  assert(topic, `Quiz topic ${topicId} is missing from the syllabus.`);
  assert(topic.subject === "Mathematics", `Phase 1 topic ${topicId} must be Mathematics.`);
  const questions = QUIZ_BANK[topicId];
  assert(Array.isArray(questions) && questions.length === 8, `${topicId} must have exactly eight questions.`);

  for (const question of questions) {
    questionCount += 1;
    assert(!questionIds.has(question.id), `Duplicate question ID: ${question.id}`);
    questionIds.add(question.id);
    assert(question.prompt.length >= 18, `${question.id} has an incomplete prompt.`);
    if (question.type === "choice") {
      assert(question.options.length === 4, `${question.id} must have four choices.`);
      assert(question.options.some((option) => option.id === question.correctOptionId), `${question.id} has no valid answer key.`);
      assert(markQuestion(question, question.correctOptionId).feedback.correct, `${question.id} rejects its correct choice.`);
      assert(!markQuestion(question, "not-an-option").feedback.correct, `${question.id} accepts an invalid choice.`);
    } else {
      assert(Number.isFinite(question.correctValue), `${question.id} has an invalid numeric key.`);
      assert(markQuestion(question, String(question.correctValue)).feedback.correct, `${question.id} rejects its numeric key.`);
      const wrongValue = question.correctValue + Math.max(1, Math.abs(question.correctValue));
      assert(!markQuestion(question, String(wrongValue)).feedback.correct, `${question.id} accepts a clearly wrong value.`);
    }
  }
}

assert(questionCount === 40, `Expected 40 questions, found ${questionCount}.`);
assert(markQuestion(QUIZ_BANK["math-e1-4"][0], "3/8").feedback.correct, "Fraction input 3/8 should be accepted.");
assert(markQuestion(QUIZ_BANK["math-e1-4"][1], "35%").feedback.correct, "Percentage input 35% should be accepted.");
assert(markQuestion(QUIZ_BANK["math-e1-1"][6], "-2/5").feedback.correct, "Equivalent fraction -2/5 should be accepted for -0.4.");

console.log(`Validated ${questionCount} questions across ${REVIEWED_QUIZ_TOPIC_IDS.length} reviewed Mathematics topics.`);
