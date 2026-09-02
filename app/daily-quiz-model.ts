export type DailyQuizOption = { id: string; label: string };

export type DailyQuizQuestion = {
  id: string;
  number: number;
  prompt: string;
  type: "choice" | "numeric";
  options?: DailyQuizOption[];
  placeholder?: string;
  answerSuffix?: string;
};

export type DailyQuizSessionPayload = {
  sessionId: string;
  taskId: string;
  stream: string;
  lessonTitle: string;
  durationSeconds: number;
  expiresAt: string;
  questions: DailyQuizQuestion[];
};

export type DailyQuizFeedback = {
  questionId: string;
  prompt: string;
  response: string;
  correct: boolean;
  correctAnswer: string;
  explanation: string;
};

export type DailyQuizResultPayload = {
  score: number;
  maxScore: number;
  percentage: number;
  outcome: "Repeat foundation" | "More practice needed" | "Ready to continue";
  guidance: string;
  feedback: DailyQuizFeedback[];
};

