import { STAGES, type SubjectName } from "./data";

/** Minimal activity shape needed for study-time charts. */
export type StudyActivity = {
  id: number;
  kind: string;
  minutes: number | null;
  note: string | null;
  createdAt: string;
};

/** Days a topic may rest at each stage before its recall check is due. */
export const RECALL_WAIT_DAYS: Record<number, number> = { 1: 1, 2: 3, 3: 14 };

export function recallWaitDays(stage: number) {
  return RECALL_WAIT_DAYS[stage] ?? 14;
}

export function stageLabel(stage: number) {
  return STAGES[stage] ?? STAGES[0];
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TASK_NOTE = /^Task (.+?) (?:completed|reopened) by /;

/**
 * Net study minutes per local calendar day.
 *
 * Re-opening a planner task is logged as a negative row on the day it was
 * re-opened. Counting that row on its own day produced negative bars (for
 * example "-180" on a day with no study). Instead, each re-open cancels the
 * matching completion on the day that completion was originally recorded.
 */
export function studyMinutesByDay(activity: readonly StudyActivity[]) {
  const ordered = [...activity].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
  const totals = new Map<string, number>();
  const openCompletions = new Map<string, Array<{ day: string; minutes: number }>>();
  for (const item of ordered) {
    const day = localDateKey(new Date(item.createdAt));
    const taskId = item.note?.match(TASK_NOTE)?.[1];
    if (item.kind === "planner_uncheck") {
      const completion = taskId ? openCompletions.get(taskId)?.pop() : undefined;
      if (completion) totals.set(completion.day, (totals.get(completion.day) ?? 0) - completion.minutes);
      continue;
    }
    const minutes = item.minutes ?? 0;
    if (minutes <= 0) continue;
    totals.set(day, (totals.get(day) ?? 0) + minutes);
    if (item.kind === "planner_task" && taskId) {
      const stack = openCompletions.get(taskId) ?? [];
      stack.push({ day, minutes });
      openCompletions.set(taskId, stack);
    }
  }
  for (const [day, minutes] of totals) totals.set(day, Math.max(0, minutes));
  return totals;
}

export function lastDays(count: number, today = new Date()) {
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(today);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (count - 1 - offset));
    return {
      key: localDateKey(date),
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
      longLabel: new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(date),
    };
  });
}

export function hoursAndMinutes(minutes: number) {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function shortDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export type TopicWorkloadRow = {
  id: string;
  code: string;
  unit: string;
  title: string;
  minutes: number;
  stage: number;
  completedOn: string | null;
};

export type SubjectWorkload = {
  subject: SubjectName;
  color: string;
  totalMinutes: number;
  coveredMinutes: number;
  coveredPercent: number;
  covered: TopicWorkloadRow[];
  remaining: TopicWorkloadRow[];
  maintenance: TopicWorkloadRow[];
};

export type OverdueRecall = {
  id: string;
  subject: SubjectName;
  subjectShort: string;
  subjectClass: string;
  title: string;
  unit: string;
  stage: number;
  lastStudiedAt: string | null;
  daysSince: number;
  waitDays: number;
  overdueBy: number;
};

/** Plain-language definitions shown behind the "i" buttons and printed in the PDF. */
export const PARENT_GLOSSARY = {
  workload: "Share of this subject's planned study time that Talha has started (Learning or beyond). Topics are weighted by their planned minutes, so a long topic counts more than a short one. Already-confident maintenance topics are left out. Select a subject name to see which topics are covered and which remain.",
  secure: "Topics that reached the Secure stage: passed the subject's secure mark on two different days, including one timed attempt. Shown as secure topics / active topics.",
  effort: "How much work the subject needs now, from the average of its recorded test scores. Secure for now: 85% or more. Light review: 70–84%. Steady practice: 55–69%. Focused work: 35–54%. Intensive support: below 35%. Starting check: no test has been recorded for this subject yet, so effort can't be judged.",
  track: "Overall status of the subject. Starting check needed: no test recorded yet, so run the subject's diagnostic test first. Secure progress: average at or above the subject's secure mark and at least 60% of topics Secure. Steady practice: average 70% or more. Focused support: average below 70%, so Talha needs guided help before moving on. The line underneath is the most common reason marks were lost (for example Knowledge gap). Run diagnostic means no lost-mark reason has been recorded yet.",
  recalls: "A recall is a short closed-book check that a studied topic is still remembered. It falls due 1 day after Learning, 3 days after Practising and 14 days after Secure. Overdue means that wait has passed without the topic being studied or checked again.",
} as const;
