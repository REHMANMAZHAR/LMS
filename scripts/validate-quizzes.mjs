import { QUIZ_BANK, QUIZ_VERSION, markQuestion } from "../app/quiz-bank.ts";
import { REVIEWED_QUIZ_TOPIC_IDS } from "../app/quiz-model.ts";
import { SUBJECTS, TOPICS } from "../app/data.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(QUIZ_VERSION.length > 0, "The quiz version must be set.");
assert(REVIEWED_QUIZ_TOPIC_IDS.length === 20, "The all-subject release should contain twenty reviewed topics.");
assert(Object.keys(QUIZ_BANK).length === REVIEWED_QUIZ_TOPIC_IDS.length, "The quiz bank and reviewed topic list must match.");

const questionIds = new Set();
const subjectCounts = new Map(SUBJECTS.map((subject) => [subject, 0]));
let questionCount = 0;

for (const topicId of REVIEWED_QUIZ_TOPIC_IDS) {
  const topic = TOPICS.find((item) => item.id === topicId);
  assert(topic, `Quiz topic ${topicId} is missing from the syllabus.`);
  subjectCounts.set(topic.subject, (subjectCounts.get(topic.subject) ?? 0) + 1);
  const questions = QUIZ_BANK[topicId];
  assert(Array.isArray(questions) && questions.length === 8, `${topicId} must have exactly eight questions.`);

  for (const question of questions) {
    questionCount += 1;
    assert(!questionIds.has(question.id), `Duplicate question ID: ${question.id}`);
    questionIds.add(question.id);
    assert(question.prompt.length >= 18, `${question.id} has an incomplete prompt.`);
    assert(question.explanation.length >= 18, `${question.id} has an incomplete explanation.`);
    if (question.type === "choice") {
      assert(question.options.length === 4, `${question.id} must have four choices.`);
      assert(new Set(question.options.map((option) => option.label)).size === 4, `${question.id} has duplicate choices.`);
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

for (const subject of SUBJECTS) {
  assert(subjectCounts.get(subject) === 5, `${subject} should have five reviewed quiz topics.`);
}

assert(questionCount === 160, `Expected 160 questions, found ${questionCount}.`);
assert(markQuestion(QUIZ_BANK["math-e1-4"][0], "3/8").feedback.correct, "Fraction input 3/8 should be accepted.");
assert(markQuestion(QUIZ_BANK["math-e1-4"][1], "35%").feedback.correct, "Percentage input 35% should be accepted.");
assert(markQuestion(QUIZ_BANK["math-e1-1"][6], "-2/5").feedback.correct, "Equivalent fraction -2/5 should be accepted for -0.4.");

console.log(`Validated ${questionCount} questions across ${REVIEWED_QUIZ_TOPIC_IDS.length} reviewed topics and all ${SUBJECTS.length} subjects.`);
