import type { SubjectName } from "./data";

export const ASSESSMENT_TYPES = [
  "Diagnostic",
  "Topic quiz",
  "Topical practice",
  "Mixed practice",
  "Full paper",
] as const;

export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const ERROR_CATEGORIES = [
  "No major error",
  "Knowledge gap",
  "Forgot after learning",
  "Misread the question",
  "Wrong method",
  "Calculation error",
  "Units or rounding",
  "Insufficient explanation",
  "Missing evidence or quotation",
  "Weak evaluation or judgement",
  "Timing",
  "Careless error",
] as const;

export type ErrorCategory = (typeof ERROR_CATEGORIES)[number];

export type AssessmentAttempt = {
  id: number;
  topicId: string | null;
  subject: SubjectName;
  assessmentType: AssessmentType;
  paper: string | null;
  timed: boolean;
  score: number;
  maxScore: number;
  minutes: number | null;
  errorCategory: ErrorCategory | null;
  note: string | null;
  createdAt: string;
};

type EvidenceAttempt = Pick<
  AssessmentAttempt,
  "topicId" | "score" | "maxScore" | "timed" | "createdAt"
>;

export type SubjectProfile = {
  secureThreshold: number;
  weeklyShare: number;
  papers: readonly string[];
  diagnostic: string;
  examHabit: string;
};

export const SUBJECT_PROFILES: Record<SubjectName, SubjectProfile> = {
  Mathematics: {
    secureThreshold: 85,
    weeklyShare: 40,
    papers: ["Paper 2 · Non-calculator", "Paper 4 · Calculator"],
    diagnostic: "Complete one timed Paper 2 section and one timed Paper 4 section, then tag every lost mark.",
    examHabit: "Show every step, keep exact values until the final answer, and check signs, units and reasonableness.",
  },
  Chemistry: {
    secureThreshold: 85,
    weeklyShare: 20,
    papers: ["Paper 2 · Multiple choice", "Paper 4 · Theory", "Paper 6 · Alternative to practical"],
    diagnostic: "Use a mixed Paper 2/4/6 set to separate recall, calculation and practical-method weaknesses.",
    examHabit: "Use exact chemical language; for practical answers give method, observation and conclusion separately.",
  },
  "Pakistan Studies": {
    secureThreshold: 80,
    weeklyShare: 20,
    papers: ["Paper 1 · History and culture", "Paper 2 · Environment of Pakistan"],
    diagnostic: "Complete one timed 4/7/14-mark set and one data-response section using the mark scheme.",
    examHabit: "Match paragraph depth to the mark value, use precise evidence and finish with a supported judgement.",
  },
  Islamiyat: {
    secureThreshold: 80,
    weeklyShare: 20,
    papers: ["Paper 1", "Paper 2"],
    diagnostic: "Write one timed 10+4 response from each paper and mark knowledge and significance separately.",
    examHabit: "Use accurate named evidence or short references, develop the main answer, then apply it directly in part (b).",
  },
};

export function percentage(score: number, maxScore: number) {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

export function subjectThreshold(subject: SubjectName) {
  return SUBJECT_PROFILES[subject].secureThreshold;
}

export function evidenceForTopic(
  attempts: readonly EvidenceAttempt[],
  topicId: string,
  subject: SubjectName,
) {
  const target = subjectThreshold(subject);
  const qualifying = attempts.filter(
    (attempt) => attempt.topicId === topicId && percentage(attempt.score, attempt.maxScore) >= target,
  );
  const distinctDates = new Set(qualifying.map((attempt) => attempt.createdAt.slice(0, 10))).size;
  const hasTimed = qualifying.some((attempt) => attempt.timed);
  return {
    target,
    passes: Math.min(2, distinctDates),
    hasTimed,
    secure: distinctDates >= 2 && hasTimed,
  };
}

export type EffortLevel = "Light review" | "Steady practice" | "Focused work" | "Intensive support" | "Secure for now";

export function effortGuidance(value: number, errorCategory?: string | null) {
  const effort: EffortLevel = value >= 85
    ? "Secure for now"
    : value >= 70
      ? "Light review"
      : value >= 55
        ? "Steady practice"
        : value >= 35
          ? "Focused work"
          : "Intensive support";
  const gap = !errorCategory || errorCategory === "No major error" ? "retention and consistency" : errorCategory.toLowerCase();
  const next = effort === "Secure for now"
    ? "Schedule a later recall check so the learning is retained."
    : effort === "Light review"
      ? "Correct the missed steps, then complete five short questions."
      : effort === "Steady practice"
        ? "Review one worked example and complete a guided practice set."
        : effort === "Focused work"
          ? "Repeat the explanation, practise with support, and try again tomorrow."
          : "Pause this topic, rebuild its prerequisites, and return in smaller sessions.";
  return { effort, gap, next };
}
