export const REVIEWED_QUIZ_TOPIC_IDS = [
  "math-e1-1",
  "math-e1-4",
  "math-e1-10",
  "math-e1-11",
  "math-e1-13",
  "chem-2-4",
  "chem-3-1",
  "chem-3-3a",
  "chem-6-2a",
  "chem-7-3",
  "pak-kq3",
  "pak-kq4",
  "pak-kq7",
  "pak-kq9",
  "pak-p2-4",
  "isl-p1-2a",
  "isl-p1-2b",
  "isl-p1-3c",
  "isl-p2-2b",
  "isl-p2-3a",
] as const;

export type ReviewedQuizTopicId = (typeof REVIEWED_QUIZ_TOPIC_IDS)[number];

export type QuizOption = {
  id: string;
  label: string;
};

export type QuizQuestion = {
  id: string;
  number: number;
  prompt: string;
  type: "choice" | "numeric";
  options?: QuizOption[];
  answerSuffix?: string;
  placeholder?: string;
};

export type QuizSessionPayload = {
  sessionId: string;
  topicId: ReviewedQuizTopicId;
  topicCode: string;
  topicTitle: string;
  durationSeconds: number;
  expiresAt: string;
  questions: QuizQuestion[];
};

export type QuizFeedback = {
  questionId: string;
  prompt: string;
  response: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
};

export type QuizResultPayload = {
  score: number;
  maxScore: number;
  percentage: number;
  threshold: number;
  passed: boolean;
  timed: boolean;
  awardedStage: number;
  secure: boolean;
  evidencePasses: number;
  hasTimedPass: boolean;
  feedback: QuizFeedback[];
};

const reviewedQuizTopicIds = new Set<string>(REVIEWED_QUIZ_TOPIC_IDS);

export function hasReviewedQuiz(topicId: string): topicId is ReviewedQuizTopicId {
  return reviewedQuizTopicIds.has(topicId);
}
