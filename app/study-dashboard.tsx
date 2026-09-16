"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  STAGES,
  SUBJECT_META,
  SUBJECTS,
  TOPICS,
  SubjectName,
  Topic,
  linkedNextTopics,
  prerequisiteTopics,
  topicPracticeUrl,
  youtubeSearchUrl,
} from "./data";
import {
  ASSESSMENT_TYPES,
  ERROR_CATEGORIES,
  SUBJECT_PROFILES,
  AssessmentAttempt,
  AssessmentType,
  ErrorCategory,
  effortGuidance,
  evidenceForTopic,
  percentage,
  subjectThreshold,
} from "./learning-model";
import QuizView from "./quiz-view";
import { REVIEWED_QUIZ_TOPIC_IDS, hasReviewedQuiz, type QuizResultPayload } from "./quiz-model";
import DailyQuizView from "./daily-quiz-view";

import type { DailyQuizResultPayload } from "./daily-quiz-model";
import { ACTIVE_PLAN_VERSION, MAINTENANCE_TOPIC_IDS, STARTER_LESSONS, sundayLesson, topicLesson, topicLessonCount, topicLessonTitles, type GuidedLesson } from "./lesson-plan";

import { placeRemaining, allowedDay } from "./planner-rules";

import { buildAdaptivePlanner, readManifest, taskTime } from "./adaptive-plan";
import PastPaperPractice from "./past-paper-practice";
import OfficialPaperLibrary from "./official-paper-library";
import WeeklyReview from "./weekly-review";
import TargetPlanner from "./target-planner";
import type { PlannedTask } from "./adaptive-plan";

type View = "today" | "calendar" | "syllabus" | "dates" | "quizzes" | "tests" | "plan" | "parent" | "help";

type TabGuideContent = {
  purpose: string;
  use: string;
  connected: string;
  updates: string;
};

const TAB_GUIDES: Record<View, TabGuideContent> = {
  today: {
    purpose: "Shows only the work Talha should complete today: no more than two principal subjects.",
    use: "Open each task, follow its method, open the Daily quiz; use the optional search separately, then tick only that exact task.",
    connected: "Calendar assignments, syllabus topics, Daily Check results, reminders and the rescheduling engine.",
    updates: "Checkboxes and checks update it immediately. Unticked missed work is carried forward automatically.",
  },
  calendar: {
    purpose: "Shows the complete dated roadmap, daily workload and completed-versus-remaining syllabus.",
    use: "Select any date to see its original tasks and whether each was completed on time, completed later, missed and rescheduled, or still scheduled.",
    connected: "Today, syllabus progress, repeat-later dates, task completion and the hidden Parent View planning engine.",
    updates: "Records the real completion timestamp. Missed tasks keep their original-day history while the working copy moves to its new date.",
  },
  syllabus: {
    purpose: "Maps every Cambridge topic, its workload, importance, paper, stage and learning relationships.",
    use: "Filter by subject and choose All, Completed, Completed—not yet secure, Secure, Partially completed, Remaining or Maintenance.",
    connected: "Calendar lessons, prerequisite paths, Daily Checks, weekend evidence and confident-topic maintenance.",
    updates: "Every topic remains visible. Completed topics show their completion record; Secure remains a separate evidence-based status.",
  },
  dates: {
    purpose: "Keeps every Cambridge examination paper and countdown visible in one place.",
    use: "Review paper dates and durations regularly, especially when deciding revision and past-paper priorities.",
    connected: "The exam window, calendar target and Parent View planning calculations.",
    updates: "Days-left counts update automatically each day. Examination dates change only after a verified timetable update.",
  },
  tests: {
    purpose: "Records one-hour, whole-topic weekend assessments and turns results into improvement guidance.",
    use: "Complete the assigned paper under timed conditions, mark it strictly, then record marks, time and the main error.",
    connected: "Verified exact-code Cambridge papers, matching mark schemes, syllabus evidence, Secure status, error tracking and Parent View.",
    updates: "The paper catalogue changes only after question-paper/mark-scheme pairing and syllabus-code checks; marked attempts update immediately.",
  },
  parent: {
    purpose: "Gives the parent oversight of consistency, coverage, evidence, recurring errors and quiz-bank publishing.",
    use: "Review weekly activity and support needs; use the Google Sheet control only for reviewed, Approved questions.",
    connected: "All LMS progress and assessment records, the D1 family database and the controlled Google Sheet quiz bank.",
    updates: "Refreshes after Talha records activity. Google Sheet questions update only when Validate and sync approved rows succeeds.",
  },
  help: {
    purpose: "Explains the complete self-study system for Talha and the parent.",
    use: "Read the numbered sections once, then return whenever a button, status or study routine is unclear.",
    connected: "Every learner tab, Parent View, reminders, assessment rules and troubleshooting guidance.",
    updates: "The manual is updated whenever an LMS feature or study rule changes.",
  },
  quizzes: {
    purpose: "Legacy topic-quiz view retained internally while Daily Checks replace it in Talha's navigation.",
    use: "Use only when opened from an existing topic record.",
    connected: "Syllabus topics and stored quiz attempts.",
    updates: "Updates when a legacy topic quiz is submitted.",
  },
  plan: {
    purpose: "Internal adaptive-planning view retained for Parent View calculations.",
    use: "Talha should use Today and Calendar instead of this internal view.",
    connected: "Calendar capacity, remaining syllabus workload and target dates.",
    updates: "Recalculates whenever work, time settings or target dates change.",
  },
};

function TabGuide({ view }: { view: View }) {
  const guide = TAB_GUIDES[view];
  return <details className="tab-guide panel" open>
    <summary><span>About this tab</span><small>Purpose, use, connections and updates</small></summary>
    <div className="tab-guide-grid">
      <article><strong>What it is for</strong><p>{guide.purpose}</p></article>
      <article><strong>How it works</strong><p>{guide.use}</p></article>
      <article><strong>Connected to</strong><p>{guide.connected}</p></article>
      <article><strong>How it updates</strong><p>{guide.updates}</p></article>
    </div>
  </details>;
}

type ProgressItem = {
  topicId: string;
  stage: number;
  bestScore: number | null;
  lastStudiedAt: string | null;
  updatedAt: string;
};
type ActivityItem = {
  id: number;
  topicId: string | null;
  subject: string | null;
  kind: string;
  stage: number | null;
  score: number | null;
  maxScore: number | null;
  minutes: number | null;
  note: string | null;
  createdAt: string;
};
type FamilyState = {
  progress: ProgressItem[];
  settings: Record<string, string>;
  activity: ActivityItem[];
  attempts: AssessmentAttempt[];
  archivedCompletions: Record<string, string>;
};
type Stats = {
  total: number;
  learned: number;
  practised: number;
  mastered: number;
  coverage: number;
  practice: number;
  mastery: number;
  assessmentAverage: number;
  timedEvidence: number;
  readiness: number;
  remainingMinutes: number;
};
type RoadmapSubject = {
  subject: SubjectName;
  totalMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  progress: number;
  nextTopic: Topic | undefined;
};

const DAILY_CHECK_OUTCOMES = ["Ready to continue", "More practice needed", "Repeat foundation"] as const;
function dailyCheckOutcome(note: string | null) {
  return DAILY_CHECK_OUTCOMES.find((outcome) => note?.includes(outcome));
}
function dailyCheckSummary(note: string | null) {
  return (note ?? "Daily check completed.").replace(/ Submitted by .*\.$/, "");
}

type PlannerTask = PlannedTask;

type StudyStream = "Mathematics" | "Chemistry" | "Islamiyat" | "Pakistan History" | "Pakistan Geography";

const STUDY_STREAMS: Array<{ name: StudyStream; color: string }> = [
  { name: "Mathematics", color: SUBJECT_META.Mathematics.color },
  { name: "Chemistry", color: SUBJECT_META.Chemistry.color },
  { name: "Islamiyat", color: SUBJECT_META.Islamiyat.color },
  { name: "Pakistan History", color: "#a1653c" },
  { name: "Pakistan Geography", color: "#c08a42" },
];

function topicStream(topic: Topic): StudyStream {
  if (topic.subject !== "Pakistan Studies") return topic.subject;
  return topic.paper === "P2" ? "Pakistan Geography" : "Pakistan History";
}

const DEFAULT_SETTINGS: Record<string, string> = {
  planVersion: ACTIVE_PLAN_VERSION,
  targetDate: "2027-02-21",
  examDate: "2027-05-21",
  dailyMinutes: "360",
  studyDays: "7",
  plannerStartDate: "2026-09-15",
  reminderTime: "09:00",
  remindersEnabled: "false",
};


const IMPORTANT_DATES = [
  { date: "2027-05-03", label: "Pakistan Studies 0448/01 — History & Culture", duration: "1h 30m" },
  { date: "2027-05-05", label: "Pakistan Studies 0448/02 — Environment of Pakistan", duration: "1h 30m" },
  { date: "2027-05-07", label: "Mathematics 0580/22 — Extended Non-Calculator", duration: "2h" },
  { date: "2027-05-10", label: "Mathematics 0580/42 — Extended Calculator", duration: "2h" },
  { date: "2027-05-12", label: "Islamiyat 0493/12 — Qur'anic Passages & Early History", duration: "1h 30m" },
  { date: "2027-05-14", label: "Islamiyat 0493/22 — Hadiths & Islamic History", duration: "1h 30m" },
  { date: "2027-05-17", label: "Chemistry 0620/42 — Extended Theory", duration: "1h 15m" },
  { date: "2027-05-19", label: "Chemistry 0620/62 — Alternative to Practical", duration: "1h" },
  { date: "2027-05-21", label: "Chemistry 0620/22 — Extended Multiple Choice", duration: "45m" },
] as const;

const EMPTY_STATE: FamilyState = {
  progress: [],
  settings: DEFAULT_SETTINGS,
  activity: [],
  attempts: [],
  archivedCompletions: {},
};

function dateLabel(value: string | null | undefined) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}

function fullDateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Choose a date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fullDateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fullDateLabel(value.slice(0, 10));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

function daysBetween(from: Date, to: Date) {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86_400_000));
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

function moveDate(key: string, days: number) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function isStudyDate(key: string, studyDays: number) {
  const weekday = dateFromKey(key).getDay();
  if (studyDays >= 7) return true;
  if (weekday === 0) return false;
  return weekday <= Math.max(1, Math.min(6, studyDays));
}

function studyDaysUntil(target: string, perWeek: number) {
  const targetDate = new Date(`${target}T23:59:00`);
  const total = daysBetween(new Date(), targetDate);
  return Math.max(1, Math.floor(total * (Math.min(7, Math.max(1, perWeek)) / 7)));
}

function stageClass(stage: number) {
  return ["not-started", "learned", "practised", "mastered"][stage] ?? "not-started";
}

function importanceLabel(level: number) {
  return level === 3 ? "Critical" : level === 2 ? "Important" : "Supporting";
}

function subjectClass(subject: SubjectName) {
  return SUBJECT_META[subject].short.toLowerCase();
}

function relativeAge(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
}

function greetingForLocalTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function isRevisionDue(item: ProgressItem | undefined) {
  if (!item || item.stage === 0) return false;
  const wait = item.stage === 1 ? 1 : item.stage === 2 ? 3 : 14;
  return relativeAge(item.lastStudiedAt) >= wait;
}

function buildPlanner(
  _progressMap: ReadonlyMap<string, ProgressItem>,
  previouslyCompletedTopicIds: ReadonlySet<string>,
  settings: Record<string, string>,
  today: string,
) {
  const manifest = readManifest(settings);
  if (manifest) return buildAdaptivePlanner(manifest, settings, today);
  const startDate = settings.plannerStartDate || today;
  const weekdayMinutes = 180;
  const streamQueues = new Map<StudyStream, Omit<PlannerTask, "originalDate" | "scheduledDate" | "carriedForward">[]>();
  STUDY_STREAMS.forEach((stream) => {
    const queue: Omit<PlannerTask, "originalDate" | "scheduledDate" | "carriedForward">[] = [];
    const starterTopicIds = new Set<string>();
    STARTER_LESSONS[stream.name].forEach((guided, index) => {
      const topic = TOPICS.find((candidate) => candidate.id === guided.topicId);
      if (!topic) return;
      starterTopicIds.add(topic.id);
      // Talha explicitly confirmed these topics. They stay outside the teaching queue
      // and are revisited only through past-paper maintenance, never as today's lesson.
      if ((MAINTENANCE_TOPIC_IDS.has(topic.id) && !settings[`planner.reopened.${topic.id}`]) || previouslyCompletedTopicIds.has(topic.id)) return;
      queue.push({ id: `${ACTIVE_PLAN_VERSION}:guided:${stream.name}:${topic.id}:${index + 1}`, topic, stream: stream.name, kind: "syllabus", lesson: guided, session: index + 1, sessions: STARTER_LESSONS[stream.name].length, minutes: weekdayMinutes });
    });
    TOPICS.filter((topic) => topicStream(topic) === stream.name && !starterTopicIds.has(topic.id) && (!MAINTENANCE_TOPIC_IDS.has(topic.id) || Boolean(settings[`planner.reopened.${topic.id}`])) && !previouslyCompletedTopicIds.has(topic.id)).forEach((topic) => {
      const sessions = topicLessonCount(topic, weekdayMinutes);
      for (let session = 1; session <= sessions; session += 1) {
        queue.push({ id: `${ACTIVE_PLAN_VERSION}:topic:${topic.id}:${session}`, topic, stream: stream.name, kind: "syllabus", lesson: topicLesson(topic, session, sessions), session, sessions, minutes: weekdayMinutes });
      }
    });
    streamQueues.set(stream.name, queue);
  });

  const canonical = new Map<string, PlannerTask[]>();
  const lastLesson = new Map<StudyStream, PlannerTask>();
  const examDate = settings.examDate || "2027-05-21";
  let date = startDate; let teachingDay = 0; let week = 0;
  while (date <= examDate) {
    const weekday = dateFromKey(date).getDay();
    let streams: StudyStream[] = [];
    if (weekday === 0) streams = ["Chemistry", "Islamiyat"];
    else if (weekday === 6) streams = ["Mathematics", week % 2 === 0 ? "Pakistan History" : "Pakistan Geography"];
    else {
      const pdfPattern: StudyStream[][] = [
        ["Mathematics", "Islamiyat"],
        ["Chemistry", "Pakistan History"],
        ["Mathematics", "Pakistan Geography"],
        ["Chemistry", "Islamiyat"],
        ["Mathematics", week % 2 === 0 ? "Pakistan History" : "Pakistan Geography"],
      ];
      if (teachingDay < 10) {
        streams = pdfPattern[teachingDay % 5];
      } else {
        // Weeks 3–22 are rebuilt from the real remaining syllabus workload.
        // Pick two different streams with the largest remaining queues so no
        // subject is left incomplete by blindly repeating the PDF placeholders.
        streams = STUDY_STREAMS
          .map((stream) => ({ name: stream.name, remaining: streamQueues.get(stream.name)?.length ?? 0 }))
          .filter((stream) => stream.remaining > 0)
          .sort((left, right) => right.remaining - left.remaining)
          .slice(0, 2)
          .map((stream) => stream.name);
      }
      teachingDay += 1;
      if (teachingDay % 5 === 0) week += 1;
    }
    const weekend = weekday === 0 || weekday === 6;
    const tasks = streams.flatMap((stream) => {
      if (weekend) {
        const previous = lastLesson.get(stream);
        const topic = previous?.topic ?? TOPICS.find((candidate) => topicStream(candidate) === stream);
        if (!topic) return [];
        return [{ id: `${ACTIVE_PLAN_VERSION}:weekend:${stream}:${date}`, topic, stream, kind: "revision" as const, lesson: { ...sundayLesson(stream, previous?.lesson.title ?? topic.title), title: `${stream}: one-hour whole-topic assessment`, objective: `Complete a timed whole-topic assessment, mark it, and record the exact learning gap.` }, session: 1, sessions: 1, minutes: 60 }];
      }
      const task = streamQueues.get(stream)?.shift();
      if (task) lastLesson.set(stream, task as PlannerTask);
      return task ? [task] : [];
    });
    canonical.set(date, tasks.map((task) => ({ ...task, originalDate: date, scheduledDate: date, carriedForward: false })));
    date = moveDate(date, 1);
  }

  const canonicalTasks = [...canonical.values()].flat();
  const rawDoneDate = (taskId: string) => settings[`planner.done.${taskId}`] || "";
  const completedTaskIds = new Set(canonicalTasks.filter((task) => rawDoneDate(task.id)).map((task) => task.id));
  // A task disappears only when Talha explicitly checks that exact task. Historic
  // progress stages may guide support, but must never silently complete calendar work.
  const incomplete = canonicalTasks.filter((task) => !completedTaskIds.has(task.id)).sort((a, b) => a.originalDate.localeCompare(b.originalDate));
  const effective = new Map<string, PlannerTask[]>();
  canonicalTasks.filter((task) => completedTaskIds.has(task.id)).forEach((task) => {
    const completedOn = rawDoneDate(task.id);
    effective.set(completedOn, [...(effective.get(completedOn) ?? []), { ...task, scheduledDate: completedOn }]);
  });

  const rescheduled = placeRemaining(incomplete, effective, settings, today);
  effective.clear();
  rescheduled.forEach((tasks, date) => effective.set(date, tasks));

  return {
    canonical, effective,
    tasksById: new Map(canonicalTasks.map((task) => [task.id, task])),
    completedTaskIds,
    predictedCompletion: [...effective.entries()].flatMap(([key, tasks]) => tasks.some((task) => task.kind === "syllabus") ? [key] : []).sort().at(-1) ?? today,
    overdueCount: incomplete.filter((task) => task.originalDate < today).length,
  };
}

function plannedTaskMinutes(task: PlannerTask) {
  return taskTime(task);
}
function StatRing({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="stat-ring"
      style={{ "--progress": `${Math.min(100, Math.max(0, value)) * 3.6}deg` } as React.CSSProperties}
    >
      <div><strong>{value}%</strong><span>{label}</span></div>
    </div>
  );
}

function EmptyMessage({ children }: { children: ReactNode }) {
  return <div className="empty-message">{children}</div>;
}

export default function StudyDashboard({
  displayName,
}: {
  displayName: string;
}) {
  const [view, setView] = useState<View>("today");
  const [familyState, setFamilyState] = useState<FamilyState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState("Welcome");
  const [subject, setSubject] = useState<SubjectName | "All">("All");
  const [stageFilter, setStageFilter] = useState("All topics");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chosenTopicId, setChosenTopicId] = useState<string>(TOPICS.find((topic) => !MAINTENANCE_TOPIC_IDS.has(topic.id))?.id ?? TOPICS[0].id);
  const [quizTopicId, setQuizTopicId] = useState<string>(REVIEWED_QUIZ_TOPIC_IDS[0]);
  const [dailyQuizTaskId, setDailyQuizTaskId] = useState<string | null>(null);
  const [testTopicId, setTestTopicId] = useState(
    TOPICS.find((topic) => topic.subject === "Mathematics")?.id ?? TOPICS[0].id,
  );
  const [testType, setTestType] = useState<AssessmentType>("Diagnostic");
  const [testPaper, setTestPaper] = useState(SUBJECT_PROFILES.Mathematics.papers[0]);
  const [testTimed, setTestTimed] = useState(true);
  const [testScore, setTestScore] = useState("");
  const [testMax, setTestMax] = useState("20");
  const [testMinutes, setTestMinutes] = useState("30");
  const [testError, setTestError] = useState<ErrorCategory>("Knowledge gap");
  const [testNote, setTestNote] = useState("");
  const [, setStuckTopicId] = useState<string | null>(null);
  const [repeatPickerTopicId, setRepeatPickerTopicId] = useState<string | null>(null);
  const [repeatDateChoice, setRepeatDateChoice] = useState(() => moveDate(localDateKey(), 1));
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [calendarMonth, setCalendarMonth] = useState(() => localDateKey().slice(0, 7));

  const loadFamilyState = useCallback(async (showError = false) => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.status === 401) {
        window.location.reload();
        return;
      }
      if (!response.ok) throw new Error("Progress could not be synchronized.");
      let data = (await response.json()) as FamilyState;
      if (data.settings?.planVersion !== ACTIVE_PLAN_VERSION) {
        const activation = await fetch("/api/admin/archive-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmation: "ARCHIVE AND START WEEK 1", planVersion: ACTIVE_PLAN_VERSION }),
        });
        if (!activation.ok) throw new Error("The corrected plan could not be activated; the previous records remain unchanged.");
        const refreshed = await fetch("/api/state", { cache: "no-store" });
        if (!refreshed.ok) throw new Error("The corrected plan was activated but could not be reloaded.");
        data = (await refreshed.json()) as FamilyState;
      }
      setFamilyState({
        progress: data.progress ?? [],
        activity: data.activity ?? [],
        attempts: data.attempts ?? [],
        archivedCompletions: data.archivedCompletions ?? {},
        settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
      });
      setLastSynced(new Date());
    } catch (error) {
      if (showError) {
        setMessage(error instanceof Error ? error.message : "Progress could not be synchronized.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadFamilyState(true), 0);
    const refresh = () => void loadFamilyState(false);
    const interval = window.setInterval(refresh, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadFamilyState]);

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(greetingForLocalTime());
    };
    const initialUpdate = window.setTimeout(updateGreeting, 0);
    const interval = window.setInterval(updateGreeting, 60_000);
    return () => {
      window.clearTimeout(initialUpdate);
      window.clearInterval(interval);
    };
  }, []);

  const progressMap = useMemo(
    () => new Map(familyState.progress.map((item) => [item.topicId, item])),
    [familyState.progress],
  );
  const archivedCompletedTopicIds = useMemo(
    () => new Set(Object.keys(familyState.archivedCompletions).filter((id) => !familyState.settings[`planner.reopened.${id}`])),
    [familyState.archivedCompletions, familyState.settings],
  );
  const maintenanceTopicIds = useMemo(() => new Set([...MAINTENANCE_TOPIC_IDS].filter((id) => !familyState.settings[`planner.reopened.${id}`])), [familyState.settings]);
  const progressStageFor = useCallback(
    (topic: Topic) => Math.max(progressMap.get(topic.id)?.stage ?? 0, archivedCompletedTopicIds.has(topic.id) ? 1 : 0),
    [archivedCompletedTopicIds, progressMap],
  );

  const stats = useMemo<Stats>(() => {
    const activeTopics = TOPICS.filter((topic) => !maintenanceTopicIds.has(topic.id));
    const total = activeTopics.length;
    const learned = activeTopics.filter((topic) => progressStageFor(topic) >= 1).length;
    const practised = activeTopics.filter((topic) => progressStageFor(topic) >= 2).length;
    const mastered = activeTopics.filter((topic) => progressStageFor(topic) >= 3).length;
    const totalMinutes = activeTopics.reduce((sum, topic) => sum + topic.minutes, 0);
    const weighted = (minimumStage: number) => Math.round(
      (activeTopics.reduce((sum, topic) => sum + (progressStageFor(topic) >= minimumStage ? topic.minutes : 0), 0) / totalMinutes) * 100,
    );
    const coverage = weighted(1);
    const practice = weighted(2);
    const mastery = weighted(3);
    const assessmentAverage = familyState.attempts.length
      ? Math.round(
          familyState.attempts.reduce(
            (sum, attempt) => sum + percentage(attempt.score, attempt.maxScore),
            0,
          ) / familyState.attempts.length,
        )
      : 0;
    const timedEvidence = familyState.attempts.filter((attempt) => attempt.timed).length;
    const readiness = Math.round(
      coverage * 0.2 +
      practice * 0.2 +
      mastery * 0.25 +
      assessmentAverage * 0.25 +
      Math.min(100, timedEvidence * 10) * 0.1,
    );
    const remainingMinutes = activeTopics.reduce((sum, topic) => {
      const stage = progressStageFor(topic);
      return sum + topic.minutes * [1, 0.55, 0.25, 0][stage];
    }, 0);
    return {
      total,
      learned,
      practised,
      mastered,
      coverage,
      practice,
      mastery,
      assessmentAverage,
      timedEvidence,
      readiness,
      remainingMinutes,
    };
  }, [familyState.attempts, progressStageFor, maintenanceTopicIds]);

  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...familyState.settings }), [familyState.settings]);
  const remindersEnabled = settings.remindersEnabled === "true" && typeof Notification !== "undefined" && Notification.permission === "granted";
  const studyDays = Number(settings.studyDays || 7);
  const availableDays = studyDaysUntil(settings.targetDate, studyDays);
  const requiredDaily = Math.ceil(stats.remainingMinutes / availableDays);
  const plannedDaily = Number(settings.dailyMinutes || 450);
  const feasible = plannedDaily >= requiredDaily;
  const todayKey = localDateKey();
  const planner = useMemo(
    () => buildPlanner(progressMap, archivedCompletedTopicIds, settings, todayKey),
    [archivedCompletedTopicIds, progressMap, settings, todayKey],
  );
  const topicTaskCompletion = useMemo(() => {
    const completion = new Map<string, { completed: number; total: number }>();
    planner.tasksById.forEach((task) => {
      if (task.kind !== "syllabus" || task.retired) return;
      const current = completion.get(task.topic.id) ?? { completed: 0, total: 0 };
      current.total += 1;
      if (!planner.completedTaskIds.has(task.id)) current.completed += Number(settings[`planner.taskPartial.${task.id}`] || 0) / 100;
      if (planner.completedTaskIds.has(task.id) && (!settings[`planner.reopened.${task.topic.id}`] || (settings[`planner.doneAt.${task.id}`] || "") > settings[`planner.reopened.${task.topic.id}`])) current.completed += 1;
      completion.set(task.topic.id, current);
    });
    return completion;
  }, [planner.completedTaskIds, planner.tasksById, settings]);
  const todayTasks = planner.effective.get(todayKey) ?? [];
  const todayRemainingTasks = todayTasks.filter((task) => !planner.completedTaskIds.has(task.id));
  const todayRemainingMinutes = todayRemainingTasks.reduce((sum, task) => sum + Math.ceil(task.minutes * (1 - Number(settings[`planner.taskPartial.${task.id}`] || 0) / 100)) + (task.quizMinutes ?? (task.kind === "syllabus" ? 20 : 0)), 0);
  const todayCompletedCount = todayTasks.length - todayRemainingTasks.length;
  const examDaysLeft = Math.max(0, Math.ceil(
    (dateFromKey(settings.examDate).getTime() - dateFromKey(todayKey).getTime()) / 86_400_000,
  ));
  const dailyCheckOutcomeByTask = useMemo(() => {
    const outcomes = new Map<string, string>();
    [...familyState.activity]
      .filter((item) => item.kind === "daily-check" && item.topicId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((item) => {
        const outcome = dailyCheckOutcome(item.note);
        if (item.topicId && outcome && !outcomes.has(item.topicId)) outcomes.set(item.topicId, outcome);
      });
    return outcomes;
  }, [familyState.activity]);
  const streamProgress = useMemo(() => STUDY_STREAMS.map((stream) => {
    const topics = TOPICS.filter((topic) => topicStream(topic) === stream.name && !maintenanceTopicIds.has(topic.id));
    const total = topics.reduce((sum, topic) => sum + topic.minutes, 0);
    const completed = topics.reduce((sum, topic) => sum + topic.minutes * ([0, .45, .75, 1][progressStageFor(topic)] ?? 0), 0);
    return { ...stream, percent: total ? Math.round(completed / total * 100) : 0 };
  }), [progressStageFor, maintenanceTopicIds]);
  const selectedPlannerTasks = selectedDate < todayKey
    ? (planner.canonical.get(selectedDate) ?? [])
    : (planner.effective.get(selectedDate) ?? []);
  const effectiveDateByTaskId = useMemo(() => {
    const dates = new Map<string, string>();
    planner.effective.forEach((tasks, date) => tasks.forEach((task) => dates.set(task.id, date)));
    return dates;
  }, [planner.effective]);

  function calendarTaskStatus(task: PlannerTask) {
    const completedDate = settings[`planner.done.${task.id}`];
    const completedAt = settings[`planner.doneAt.${task.id}`];
    if (completedDate) {
      const when = completedAt ? fullDateTimeLabel(completedAt) : fullDateLabel(completedDate);
      return completedDate === task.originalDate ? `Completed on schedule · ${when}` : `Completed later · ${when}`;
    }
    if (task.retired) return "Not completed in this assignment · replaced by the revised plan; original record retained";
    const rescheduledDate = effectiveDateByTaskId.get(task.id);
    if (task.originalDate < todayKey && rescheduledDate && rescheduledDate !== task.originalDate) {
      return `Missed on ${fullDateLabel(task.originalDate)} · rescheduled to ${fullDateLabel(rescheduledDate)}`;
    }
    return task.originalDate < todayKey
      ? `Missed on ${fullDateLabel(task.originalDate)} · awaiting reschedule`
      : `Scheduled for ${fullDateLabel(task.scheduledDate)}`;
  }
  const calendarDays = useMemo(() => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const leading = (first.getDay() + 6) % 7;
    const count = new Date(year, month, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: count }, (_, index) => `${calendarMonth}-${String(index + 1).padStart(2, "0")}`),
    ];
  }, [calendarMonth]);

  useEffect(() => {
    if (settings.remindersEnabled !== "true" || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const [hour, minute] = (settings.reminderTime || "09:00").split(":").map(Number);
    const reminder = new Date();
    reminder.setHours(hour, minute, 0, 0);
    if (reminder.getTime() <= Date.now()) reminder.setDate(reminder.getDate() + 1);
    const delay = reminder.getTime() - Date.now();
    const timer = window.setTimeout(() => {
      const tasks = planner.effective.get(localDateKey()) ?? [];
      const remaining = tasks.filter((task) => !planner.completedTaskIds.has(task.id));
      new Notification("Talha's study plan is ready", { body: `${remaining.length} tasks left · ${remaining.reduce((sum, task) => sum + plannedTaskMinutes(task), 0)} minutes remaining.` });
    }, Math.min(delay, 2_147_000_000));
    return () => window.clearTimeout(timer);
  }, [planner.effective, settings.reminderTime, settings.remindersEnabled]);

  const roadmapSubjects = useMemo<RoadmapSubject[]>(() => SUBJECTS.map((roadmapSubject) => {
    const topics = TOPICS.filter((topic) => topic.subject === roadmapSubject && !maintenanceTopicIds.has(topic.id));
    const totalMinutes = topics.reduce((sum, topic) => sum + topic.minutes, 0);
    const completedMinutes = topics.reduce((sum, topic) => {
      const stage = progressStageFor(topic);
      return sum + topic.minutes * [0, 0.45, 0.75, 1][stage];
    }, 0);
    return {
      subject: roadmapSubject,
      totalMinutes,
      completedMinutes: Math.round(completedMinutes),
      remainingMinutes: Math.max(0, Math.round(totalMinutes - completedMinutes)),
      progress: Math.round((completedMinutes / totalMinutes) * 100),
      nextTopic: topics.find((topic) => progressStageFor(topic) < 1),
    };
  }), [progressStageFor, maintenanceTopicIds]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TOPICS.filter((topic) => {
      const topicStage = progressStageFor(topic);
      const matchesSubject = subject === "All" || topic.subject === subject;
      const maintenance = maintenanceTopicIds.has(topic.id);
      const taskCompletion = topicTaskCompletion.get(topic.id) ?? { completed: 0, total: 0 };
      const completed = maintenance || topicStage > 0 || (taskCompletion.total > 0 && taskCompletion.completed === taskCompletion.total);
      const partial = !completed && (taskCompletion.completed > 0 || Number(settings[`planner.partial.${topic.id}`] || 0) > 0);
      const matchesStage = stageFilter === "All topics" ||
        (stageFilter === "Completed" ? completed :
        stageFilter === "Completed — not yet secure" ? completed && topicStage < 3 :
        stageFilter === "Secure" ? topicStage === 3 :
        stageFilter === "Partially completed" ? partial :
        stageFilter === "Remaining" ? !completed && !partial :
        stageFilter === "Maintenance" ? maintenance :
        stageFilter === "Revision due" ? isRevisionDue(progressMap.get(topic.id)) : STAGES[topicStage] === stageFilter);
      const matchesQuery = !query || `${topic.code} ${topic.unit} ${topic.title} ${topicLessonTitles(topic).join(" ")}`.toLowerCase().includes(query);
      return matchesSubject && matchesStage && matchesQuery;
    });
  }, [progressMap, progressStageFor, search, stageFilter, subject, topicTaskCompletion, maintenanceTopicIds, settings]);

  const chosenTopic = TOPICS.find((topic) => topic.id === chosenTopicId) ?? TOPICS[0];
  const chosenPrerequisites = prerequisiteTopics(chosenTopic.id);
  const missingPrerequisites = chosenPrerequisites.filter(
    (topic) => !maintenanceTopicIds.has(topic.id) && (progressMap.get(topic.id)?.stage ?? 0) === 0,
  );
  const chosenLinkedNext = linkedNextTopics(chosenTopic.id);

  function revealTopic(topic: Topic) {
    setSubject(topic.subject);
    setSearch(topic.code);
    setStageFilter(maintenanceTopicIds.has(topic.id) ? "Maintenance" : "All topics");
    setExpanded(topic.id);
  }

  const planningCompleted = useMemo(() => new Set([...archivedCompletedTopicIds, ...familyState.progress.filter(item => item.stage > 0).map(item => item.topicId)]), [archivedCompletedTopicIds, familyState.progress]);
  const tests = familyState.attempts;
  const selectedTestTopic = TOPICS.find((item) => item.id === testTopicId) ?? TOPICS[0];
  const selectedTestSubject = selectedTestTopic.subject;
  const selectedProfile = SUBJECT_PROFILES[selectedTestSubject];
  const selectedEvidence = evidenceForTopic(tests.filter((attempt) => !settings[`planner.reopened.${selectedTestTopic.id}`] || attempt.createdAt > settings[`planner.reopened.${selectedTestTopic.id}`]), selectedTestTopic.id, selectedTestSubject);

  async function sendUpdate(payload: Record<string, unknown>) {
    const response = await fetch("/api/state", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw new Error(String(data.error ?? "The update was not saved."));
    setLastSynced(new Date());
    return data;
  }

  function openQuiz(topic: Topic) {
    setQuizTopicId(topic.id);
    setView("quizzes");
    setMessage("");
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      setMessage("This browser does not support study notifications. The in-LMS reminder will remain available.");
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === "granted";
    await saveSetting("remindersEnabled", enabled ? "true" : "false");
    setMessage(enabled ? "Study reminders are enabled on this device while browser support permits." : "Notifications were not enabled. You can still use the daily plan inside the LMS.");
    if (enabled) {
      const tasks = planner.effective.get(localDateKey()) ?? [];
      const remaining = tasks.filter((task) => !planner.completedTaskIds.has(task.id));
      new Notification("Talha's study plan is ready", { body: `${remaining.length} tasks left · ${remaining.reduce((sum, task) => sum + plannedTaskMinutes(task), 0)} minutes remaining.` });
    }
  }

  async function handleQuizCompleted(result: QuizResultPayload) {
    await loadFamilyState(false);
    const guidance = effortGuidance(result.percentage, result.feedback.some((item) => !item.correct) ? "Concept or application gap" : "No major error");
    if (result.secure) {
      setMessage(`${guidance.effort}: ${guidance.next}`);
    } else if (result.passed) {
      setMessage(`${guidance.effort}: ${guidance.next}`);
    } else {
      setMessage(`${guidance.effort}: ${guidance.next}`);
    }
  }

  async function handleDailyQuizCompleted(result: DailyQuizResultPayload) {
    await loadFamilyState(false);
    setMessage(`${result.outcome}: ${result.guidance}`);
  }

  async function updateStage(topic: Topic, requestedStage: number) {
    const existing = progressMap.get(topic.id);
    const existingStage = existing?.stage ?? 0;
    if (requestedStage >= 2 && existingStage < 2) {
      if (hasReviewedQuiz(topic.id)) {
        openQuiz(topic);
        return;
      }
      setTestTopicId(topic.id);
      setTestPaper(SUBJECT_PROFILES[topic.subject].papers[0]);
      setView("tests");
      setMessage(
        `Record marked evidence at ${subjectThreshold(topic.subject)}% or above to move ${topic.title} to Practising.`,
      );
      return;
    }
    if (requestedStage >= 3 && (existing?.stage ?? 0) < 3) {
      setTestTopicId(topic.id);
      setTestPaper(SUBJECT_PROFILES[topic.subject].papers[0]);
      setView("tests");
      setMessage(
        `Secure this topic with two ${subjectThreshold(topic.subject)}%+ results on different dates, including one timed result.`,
      );
      return;
    }
    if (requestedStage >= 3 && existingStage >= 3) return;
    const safeStage = requestedStage === 0
      ? 0
      : existingStage >= 2
        ? existingStage
        : 1;
    setSaving(true);
    setMessage("");
    const now = new Date().toISOString();
    const optimistic: ProgressItem = {
      topicId: topic.id,
      stage: safeStage,
      bestScore: existing?.bestScore ?? null,
      lastStudiedAt: safeStage > 0 ? now : null,
      updatedAt: now,
    };
    setFamilyState((current) => ({
      ...current,
      progress: [...current.progress.filter((item) => item.topicId !== topic.id), optimistic],
      settings: { ...current.settings, ...(safeStage === 0 ? { [`planner.reopened.${topic.id}`]: now } : {}), [`planner.partial.${topic.id}`]: "" },
    }));
    try {
      await sendUpdate({
        action: "progress",
        topicId: topic.id,
        subject: topic.subject,
        stage: safeStage,
        minutes: safeStage > (existing?.stage ?? 0) ? Math.max(15, Math.round(topic.minutes * 0.35)) : 0,
      });
      await loadFamilyState(false);
      setMessage(safeStage === 0 ? "Topic reset to Not started." : "Progress saved and synchronized.");
    } catch (error) {
      setFamilyState((current) => ({
        ...current,
        progress: [
          ...current.progress.filter((item) => item.topicId !== topic.id),
          ...(existing ? [existing] : []),
        ],
      }));
      await loadFamilyState(false);
      setMessage(error instanceof Error ? error.message : "The update was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSetting(key: string, value: string) {
    const previousValue = familyState.settings[key] ?? DEFAULT_SETTINGS[key] ?? "";
    setFamilyState((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
    try {
      await sendUpdate({ action: "setting", key, value });
      setMessage("Plan updated and synchronized.");
    } catch (error) {
      setFamilyState((current) => ({
        ...current,
        settings: { ...current.settings, [key]: previousValue },
      }));
      setMessage(error instanceof Error ? error.message : "The plan was not saved.");
    }
  }

  async function togglePlannerTask(task: PlannerTask, checked: boolean) {
    const key = `planner.done.${task.id}`;
    const completedAtKey = `planner.doneAt.${task.id}`;
    const previousValue = familyState.settings[key] ?? "";
    const previousCompletedAt = familyState.settings[completedAtKey] ?? "";
    const completedDate = checked ? localDateKey() : "";
    const completedAt = checked ? new Date().toISOString() : "";
    setFamilyState((current) => ({ ...current, settings: { ...current.settings, [key]: completedDate, [completedAtKey]: completedAt } }));
    setSaving(true);
    try {
      await sendUpdate({ action: "planner", taskId: task.id, topicId: task.topic.id, subject: task.topic.subject, checked, completedDate, minutes: task.minutes });
      setMessage(checked ? "Task completed. The remaining calendar has been recalculated." : "Task reopened. Future dates have been updated.");
      if (checked && task.kind === "syllabus") {
        const topicTasks = [...planner.tasksById.values()].filter((candidate) => candidate.topic.id === task.topic.id && candidate.kind === "syllabus" && !candidate.retired);
        const allDone = topicTasks.every((candidate) => candidate.id === task.id || planner.completedTaskIds.has(candidate.id));
        if (allDone && (progressMap.get(task.topic.id)?.stage ?? 0) === 0) await updateStage(task.topic, 1);
      }
    } catch (error) {
      setFamilyState((current) => ({ ...current, settings: { ...current.settings, [key]: previousValue, [completedAtKey]: previousCompletedAt } }));
      setMessage(error instanceof Error ? error.message : "The task was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function addNextToday(stream: StudyStream) {
    const next = [...planner.effective.entries()].sort(([a], [b]) => a.localeCompare(b))
      .filter(([date]) => date > todayKey).flatMap(([, tasks]) => tasks)
      .find((task) => !task.retired && task.stream === stream && task.kind === "syllabus" && !planner.completedTaskIds.has(task.id));
    if (!next) { setMessage("No next lesson is available in this subject."); return; }
    if (!allowedDay(todayKey, stream, "syllabus")) { setMessage("Teaching stays Monday–Saturday; Chemistry stays Tuesday, Thursday and Saturday."); return; }
    await saveSetting(`planner.extra.${next.id}`, todayKey);
    setMessage(`Added ${next.lesson.title} by your choice. This adds ${plannedTaskMinutes(next)} estimated minutes today.`);
  }

  function openPrerequisiteHelp(topic: Topic) {
    const prerequisite = prerequisiteTopics(topic.id).find((candidate) => (progressMap.get(candidate.id)?.stage ?? 0) === 0)
      ?? prerequisiteTopics(topic.id)[0];
    if (!prerequisite) {
      setMessage("This topic has no earlier prerequisite. Open the selected lesson, then try three easier examples.");
      return;
    }
    revealTopic(prerequisite);
    setChosenTopicId(prerequisite.id);
    setExpanded(prerequisite.id);
    setMessage(`Opening the foundation topic: ${prerequisite.title}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPracticeHelp(topic: Topic) {
    window.open(youtubeSearchUrl(topic), "_blank", "noopener,noreferrer");
    setMessage(`Opening a lesson for ${topic.title}. Return afterwards for easier guided practice.`);
  }

  function showFullPath(topic: Topic) {
    setChosenTopicId(topic.id);
    window.setTimeout(() => document.getElementById("learning-path")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function openRepeatPicker(topic: Topic) {
    let suggested = settings[`planner.repeat.${topic.id}`] || moveDate(localDateKey(), 1);
    while (!isStudyDate(suggested, studyDays)) suggested = moveDate(suggested, 1);
    setRepeatDateChoice(suggested);
    setRepeatPickerTopicId(topic.id);
  }

  async function repeatTopicLater(topic: Topic) {
    if (!repeatDateChoice || repeatDateChoice <= localDateKey()) {
      setMessage("Choose a future study date.");
      return;
    }
    await saveSetting(`planner.repeat.${topic.id}`, repeatDateChoice);
    setRepeatPickerTopicId(null);
    setSelectedDate(repeatDateChoice);
    setCalendarMonth(repeatDateChoice.slice(0, 7));
    setView("calendar");
    setMessage(`${topic.title} will repeat on ${fullDateLabel(repeatDateChoice)}. Use Undo repeat in Lesson help if this was accidental.`);
  }

  async function undoRepeat(topic: Topic) {
    await saveSetting(`planner.repeat.${topic.id}`, "");
    setRepeatPickerTopicId(null);
    setMessage(`The scheduled repeat for ${topic.title} has been removed and the calendar recalculated.`);
  }

  async function recordTest(event: FormEvent) {
    event.preventDefault();
    const topic = TOPICS.find((item) => item.id === testTopicId);
    if (!topic) return;
    const score = Number(testScore);
    const maxScore = Number(testMax);
    if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
      setMessage("Please enter a valid score and maximum mark.");
      return;
    }
    setSaving(true);
    try {
      const result = await sendUpdate({
        action: "test",
        topicId: topic.id,
        subject: topic.subject,
        assessmentType: testType,
        paper: testPaper,
        timed: testTimed,
        score,
        maxScore,
        minutes: Number(testMinutes || 0),
        errorCategory: testError,
        note: testNote,
      });
      const resultPercentage = Number(result.percentage ?? percentage(score, maxScore));
      const awardedStage = Number(result.awardedStage ?? 1);
      const secure = result.secure === true;
      const now = new Date().toISOString();
      const existing = progressMap.get(topic.id);
      const newProgress: ProgressItem = {
        topicId: topic.id,
        stage: Math.max(existing?.stage ?? 0, awardedStage),
        bestScore: Math.max(existing?.bestScore ?? 0, resultPercentage),
        lastStudiedAt: now,
        updatedAt: now,
      };
      const temporaryAttempt: AssessmentAttempt = {
        id: Date.now(),
        topicId: topic.id,
        subject: topic.subject,
        assessmentType: testType,
        paper: testPaper,
        timed: testTimed,
        score,
        maxScore,
        minutes: Number(testMinutes || 0),
        errorCategory: testError,
        note: testNote || null,
        createdAt: now,
      };
      const temporaryActivity: ActivityItem = {
        id: Date.now(),
        topicId: topic.id,
        subject: topic.subject,
        kind: "test",
        stage: awardedStage,
        score,
        maxScore,
        minutes: Number(testMinutes || 0),
        note: testNote,
        createdAt: now,
      };
      setFamilyState((current) => ({
        ...current,
        progress: [...current.progress.filter((item) => item.topicId !== topic.id), newProgress],
        activity: [temporaryActivity, ...current.activity],
        attempts: [temporaryAttempt, ...current.attempts],
      }));
      setTestScore("");
      setTestNote("");
      const guidance = effortGuidance(resultPercentage, testError);
      if (secure) {
        setMessage(`${guidance.effort}: ${guidance.next}`);
      } else if (resultPercentage >= subjectThreshold(topic.subject)) {
        setMessage(`${guidance.effort}: ${guidance.next}`);
      } else {
        setMessage(`${guidance.effort}: ${guidance.next}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The result was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">T</div><p>Preparing Talha&apos;s study plan...</p></main>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">T</div><div><strong>Talha</strong><span>CIE 2027</span></div></div>
        <nav aria-label="Main navigation">
          {([
            ["today", "Today", "01"], ["calendar", "Calendar", "02"],
            ["syllabus", "Syllabus", "03"], ["dates", "Important Dates", "04"],
            ["tests", "Weekend Assessments", "05"], ["parent", "Parent view", "06"], ["help", "How it works", "07"],
          ] as Array<[View, string, string]>).map(([key, label, number]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{number}</span>{label}</button>
          ))}
        </nav>
        <div className="sidebar-card"><span>Exam window</span><strong>{fullDateLabel(settings.examDate)}</strong><small className="days-left">{examDaysLeft} days left</small></div>
        <div className="sidebar-footer"><p>Private family workspace</p><button onClick={signOut}>Sign out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title"><span className="eyebrow">CAMBRIDGE IGCSE · FOUR SUBJECTS</span><h1>{view === "parent" ? "Parent overview" : view === "calendar" ? "Daily study calendar" : view === "syllabus" ? "Syllabus map" : view === "help" ? "How the LMS works" : view === "dates" ? "Important dates" : view === "quizzes" ? "Topic quizzes" : view === "tests" ? "Weekend assessments" : view === "plan" ? "Adaptive study plan" : `${greeting}, Talha`}</h1><div className="topbar-exam-countdown"><span>Exam: {fullDateLabel(settings.examDate)}</span><strong>{examDaysLeft} days left</strong></div></div>
          <div className="account-pill"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : view === "parent" ? "Parent mode" : "Secure family access"}</small></div></div>
        </header>

        {message && <div className={`toast ${message.includes("not") || message.includes("valid") ? "error" : ""}`} role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
        <TabGuide view={view} />
        {view === "today" && (
          <>
            <section className="hero-panel">
              <div><span className="eyebrow light">TODAY&apos;S DIRECTION</span><h2>One clear step.<br />Then the next.</h2><p>{maintenanceTopicIds.size} topics Talha confirmed are in past-paper maintenance; {stats.mastered} active topics are secure through evidence. Complete today&apos;s focused subject blocks to keep the roadmap on schedule.</p><div className="hero-buttons"><button className="hero-action" onClick={() => setView("calendar")}>See complete roadmap <span>→</span></button><button className="hero-secondary" onClick={() => void enableReminders()}>{remindersEnabled ? "Reminders enabled" : "Enable reminders"}</button></div></div>
              <StatRing value={stats.readiness} label="evidence readiness" />
            </section>
            <section className="section-block">
              <div className="section-heading"><div><span className="eyebrow">TODAY&apos;S CHECKLIST</span><h2>{todayRemainingTasks.length} lesson part{todayRemainingTasks.length === 1 ? "" : "s"} left · {todayRemainingMinutes} minutes remaining</h2><small className="today-progress-note">{todayCompletedCount} of {todayTasks.length} completed today</small></div><button className="inline-calendar-button" onClick={() => { setSelectedDate(todayKey); setCalendarMonth(todayKey.slice(0, 7)); setView("calendar"); }}>Open full calendar →</button></div>
              {!readManifest(settings) && <div className="panel"><strong>The new study planner is ready to preview.</strong><p>Choose a daily time budget and inspect the forecast before replacing future assignments. Existing completion records will be preserved.</p><button onClick={() => setView("dates")}>Preview preparation targets</button></div>}<div>{STUDY_STREAMS.filter(stream => todayTasks.some(task => task.stream === stream.name)).map(stream => <section className="panel subject-task-group" key={stream.name}><h3>{todayTasks.filter(task => task.stream === stream.name).every(task => task.kind === "revision") ? "Weekly assessment · all studied subjects" : stream.name}</h3><div className="today-checklist">{todayTasks.filter(task => task.stream === stream.name).map((task) => { const checked = planner.completedTaskIds.has(task.id); const checkOutcome = dailyCheckOutcomeByTask.get(task.id); return <label className={`planner-task ${subjectClass(task.topic.subject)} ${checked ? "done" : ""}`} key={task.id}><input type="checkbox" checked={checked} disabled={saving} onChange={(event) => void togglePlannerTask(task, event.target.checked)} /><span><small>{task.stream} · {task.minutes} min lesson{task.kind === "syllabus" && task.quizMinutes !== 0 ? " + 20 min check allowance" : ""}{task.carriedForward ? " · carried forward" : ""}</small><strong>{task.lesson.title}</strong><small>Syllabus: {task.topic.code} · {task.topic.title}</small><small>{task.lesson.objective}</small>{checkOutcome && <small className="daily-check-status">Latest check: <b>{checkOutcome}</b></small>}</span><span className="planner-task-actions">{!checked && task.kind === "syllabus" && <select aria-label={`Progress on ${task.lesson.title}`} value={settings[`planner.taskPartial.${task.id}`] || "0"} disabled={saving} onChange={(event) => void saveSetting(`planner.taskPartial.${task.id}`, event.target.value)}><option value="0">Not started</option><option value="25">25% done</option><option value="50">50% done</option><option value="75">75% done</option></select>}{checked && task.kind === "syllabus" && <button type="button" disabled={saving} onClick={() => void addNextToday(task.stream)}>Add next lesson today</button>}{task.kind === "syllabus" && <button type="button" className="daily-check-button" onClick={() => setDailyQuizTaskId(task.id)}>{checkOutcome ? "Retake check" : "Daily check"}</button>}<button type="button" onClick={() => window.open(topicPracticeUrl(task.topic), "_blank", "noopener,noreferrer")}>Optional practice search ↗</button><button type="button" onClick={() => { revealTopic(task.topic); setView(task.kind === "revision" ? "tests" : "syllabus"); }}>{task.kind === "revision" ? "Open assessment" : "Study"}</button></span></label>; })}</div></section>)}{!todayTasks.length && <EmptyMessage>No study tasks are scheduled for today.</EmptyMessage>}</div>
            </section>
          </>
        )}

        {view === "calendar" && (
          <section className="calendar-layout no-top">
            <div className="calendar-summary panel">
              <div><span className="eyebrow">HOMESCHOOL STUDY PLAN</span><h2>{planner.overdueCount ? `${planner.overdueCount} missed task${planner.overdueCount === 1 ? "" : "s"} safely carried forward` : "All five streams are on schedule"}</h2><p>Each day contains two principal subjects. Weekday lessons use focused three-hour blocks followed by separate 20-minute checks; weekends use one-hour whole-topic assessments. Missed work moves the remaining timeline forward without adding a future lesson to the same day.</p></div>
              <div className="timeline-status"><span>Predicted syllabus completion</span><strong>{fullDateLabel(planner.predictedCompletion)}</strong><small>{planner.predictedCompletion <= settings.targetDate ? "Within the current target" : "Later than the current target - adjust time or study days"}</small></div>
            </div>
            <div className="syllabus-bars panel">
              <div className="section-heading"><div><span className="eyebrow">SYLLABUS PROGRESS</span><h2>Completed and remaining</h2></div><strong>{stats.coverage}% overall</strong></div>
              <div className="stream-bars">{streamProgress.map((stream) => <div className="stream-progress" key={stream.name}><span><b>{stream.name}</b><small>{stream.percent}% complete · {100 - stream.percent}% remaining</small></span><div className="progress-track" aria-label={`${stream.name}: ${stream.percent}% complete`}><i style={{ width: `${stream.percent}%`, background: stream.color }} /></div></div>)}</div>
            </div>
            <div className="calendar-main">
              <div className="month-calendar panel">
                <div className="month-nav"><button onClick={() => { const date = dateFromKey(`${calendarMonth}-01`); date.setMonth(date.getMonth() - 1); setCalendarMonth(localDateKey(date).slice(0, 7)); }}>←</button><h2>{new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(dateFromKey(`${calendarMonth}-01`))}</h2><button onClick={() => { const date = dateFromKey(`${calendarMonth}-01`); date.setMonth(date.getMonth() + 1); setCalendarMonth(localDateKey(date).slice(0, 7)); }}>→</button></div>
                <div className="calendar-weekdays">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}</div>
                <div className="calendar-grid">{calendarDays.map((day, index) => {
                  if (!day) return <span className="calendar-blank" key={`blank-${index}`} />;
                  const tasks = day < todayKey ? (planner.canonical.get(day) ?? []) : (planner.effective.get(day) ?? []);
                  const done = tasks.filter((task) => planner.completedTaskIds.has(task.id)).length;
                  const missed = day < todayKey && tasks.some((task) => !settings[`planner.done.${task.id}`]);
                  return <button key={day} className={`${selectedDate === day ? "selected" : ""} ${day === todayKey ? "today" : ""} ${missed ? "missed" : ""}`} onClick={() => setSelectedDate(day)}><b>{Number(day.slice(-2))}</b>{tasks.length > 0 && <span>{done}/{tasks.length}</span>}</button>;
                })}</div>
              </div>
              <div className="date-tasks panel">
                <div className="section-heading"><div><span className="eyebrow">ASSIGNED TASKS</span><h2>{fullDateLabel(selectedDate)}</h2></div><strong>{selectedPlannerTasks.reduce((sum, task) => sum + plannedTaskMinutes(task), 0)} min</strong></div>
                {STUDY_STREAMS.map((stream) => {
                  const subjectTasks = selectedPlannerTasks.filter((task) => task.stream === stream.name);
                  if (!subjectTasks.length) return null;
                  return <div className="subject-task-group" key={stream.name}><h3><i style={{ background: stream.color }} />{subjectTasks.every(task => task.kind === "revision") ? "Weekly assessment · all studied subjects" : stream.name}<span>{subjectTasks.reduce((sum, task) => sum + plannedTaskMinutes(task), 0)} min</span></h3>{subjectTasks.map((task) => { const checked = planner.completedTaskIds.has(task.id); const checkOutcome = dailyCheckOutcomeByTask.get(task.id); return <label className={`planner-task ${checked ? "done" : ""}`} key={task.id}><input type="checkbox" checked={checked} disabled={saving} onChange={(event) => void togglePlannerTask(task, event.target.checked)} /><span><strong>{task.lesson.title}</strong><small>Syllabus: {task.topic.code} · {task.topic.title}</small><small>{task.kind === "revision" ? "Weekend assessment" : task.kind === "past-paper" ? (task.topic.code === "PAST PAPER" ? "Past-paper marathon" : "Topical exam practice") : `${task.topic.code} · daily lesson`} · {task.minutes} min{task.kind === "syllabus" && task.quizMinutes !== 0 ? " + 20 min check allowance" : ""}{task.carriedForward ? ` · moved from ${fullDateLabel(task.originalDate)}` : ""}</small><small className="daily-check-status"><b>{calendarTaskStatus(task)}</b></small><small><b>Goal:</b> {task.lesson.objective}</small><small><b>Method:</b> {task.lesson.studyMethod}</small><small><b>Practice:</b> {task.lesson.practice}</small><small><b>Recall:</b> {task.lesson.recall}</small>{checkOutcome && <small className="daily-check-status">Latest check: <b>{checkOutcome}</b></small>}</span><span className="planner-task-actions">{!checked && task.kind === "syllabus" && <select aria-label={`Progress on ${task.lesson.title}`} value={settings[`planner.taskPartial.${task.id}`] || "0"} disabled={saving} onChange={(event) => void saveSetting(`planner.taskPartial.${task.id}`, event.target.value)}><option value="0">Not started</option><option value="25">25% done</option><option value="50">50% done</option><option value="75">75% done</option></select>}{checked && task.kind === "syllabus" && <button type="button" disabled={saving} onClick={() => void addNextToday(task.stream)}>Add next lesson today</button>}{task.kind === "syllabus" && <button type="button" className="daily-check-button" onClick={() => setDailyQuizTaskId(task.id)}>{checkOutcome ? "Retake check" : "Daily check"}</button>}<button type="button" onClick={() => window.open(topicPracticeUrl(task.topic), "_blank", "noopener,noreferrer")}>Optional practice search ↗</button><button type="button" onClick={() => { revealTopic(task.topic); setView(task.kind !== "syllabus" ? "tests" : "syllabus"); }}>{task.kind === "past-paper" ? "Record" : "Open"}</button></span></label>; })}</div>;
                })}
                {!selectedPlannerTasks.length && <EmptyMessage>{isStudyDate(selectedDate, studyDays) ? "No task is assigned on this date." : "Rest and consolidation day. Missed work will move to the next available study day."}</EmptyMessage>}
              </div>
            </div>
            <div className="notification-settings panel"><div><span className="eyebrow">REMINDERS</span><h2>Study notification</h2><p>The browser will ask permission. On devices that restrict background web notifications, the LMS will still show overdue work when opened.</p></div><label>Reminder time<input type="time" value={settings.reminderTime} onChange={(event) => saveSetting("reminderTime", event.target.value)} /></label><button onClick={() => void enableReminders()}>{remindersEnabled ? "Send test notification" : "Enable notifications"}</button></div>
          </section>
        )}

        {view === "syllabus" && (
          <section className="section-block no-top">

            <div className="panel today-syllabus-lessons">
              <div className="section-heading"><div><span className="eyebrow">TODAY'S SYLLABUS LESSONS</span><h2>The exact work assigned today</h2></div><span className="quiet">These lesson names remain linked to their full Cambridge syllabus topics.</span></div>
              <div className="today-checklist">{todayTasks.filter((task) => task.kind === "syllabus").map((task) => {
                const checked = planner.completedTaskIds.has(task.id);
                const checkOutcome = dailyCheckOutcomeByTask.get(task.id);
                return <article className={`planner-task ${subjectClass(task.topic.subject)} ${checked ? "done" : ""}`} key={`syllabus-today-${task.id}`}>
                  <span aria-hidden="true">{checked ? "✓" : "○"}</span>
                  <span><small>{task.stream} · {task.minutes} min lesson + 20 min check</small><strong>{task.lesson.title}</strong><small>Parent syllabus topic: {task.topic.code} · {task.topic.title}</small>{checkOutcome && <small className="daily-check-status">Latest check: <b>{checkOutcome}</b></small>}</span>
                  <span className="planner-task-actions"><button type="button" className="daily-check-button" onClick={() => setDailyQuizTaskId(task.id)}>{checkOutcome ? "Retake 20-minute check" : "Start 20-minute check"}</button><button type="button" onClick={() => { setChosenTopicId(task.topic.id); revealTopic(task.topic); }}>Open syllabus topic</button></span>
                </article>;
              })}</div>
              {!todayTasks.some((task) => task.kind === "syllabus") && <EmptyMessage>No syllabus lesson is assigned today.</EmptyMessage>}
            </div>

            <div className="topic-chooser panel" id="learning-path">
              <div className="topic-chooser-head">
                <div><span className="eyebrow">CHOOSE WHAT TO STUDY</span><h2>Check the learning path first</h2><p>Select any topic. The system shows the foundations Talha has already studied, anything still missing, and the topics that build on it.</p></div>
                <label><span>Topic</span><select value={chosenTopicId} onChange={(event) => setChosenTopicId(event.target.value)}>{SUBJECTS.map((item) => <optgroup key={item} label={item}>{TOPICS.filter((topic) => topic.subject === item).map((topic) => <option key={topic.id} value={topic.id}>{topic.code} · {topic.title} — {topicLessonTitles(topic).join("; ")}</option>)}</optgroup>)}</select></label>
              </div>
              <div className="path-status-row">
                <div className={missingPrerequisites.length ? "path-readiness needs-foundation" : "path-readiness ready"}>
                  <strong>{missingPrerequisites.length ? "Foundation recommended first" : "Ready to study"}</strong>
                  <span>{missingPrerequisites.length ? `${missingPrerequisites.length} linked topic${missingPrerequisites.length === 1 ? "" : "s"} not learned yet` : chosenPrerequisites.length ? "Earlier topics have been started; check that you can apply them before continuing" : "No prerequisite is required"}</span>
                </div>
                <button className="path-primary" onClick={() => revealTopic(chosenTopic)}>Study this topic</button>
                {missingPrerequisites[0] && <button className="path-secondary" onClick={() => { setChosenTopicId(missingPrerequisites[0].id); revealTopic(missingPrerequisites[0]); }}>Learn prerequisites first</button>}
              </div>
              <div className="path-columns">
                <div><strong>Earlier knowledge needed</strong>{chosenPrerequisites.length ? <div className="path-chips">{chosenPrerequisites.map((topic) => { const stage = progressMap.get(topic.id)?.stage ?? 0; const maintenance = maintenanceTopicIds.has(topic.id); return <button key={topic.id} className={maintenance || stage > 0 ? "complete" : "missing"} onClick={() => { setChosenTopicId(topic.id); revealTopic(topic); }}><span>{maintenance || stage > 0 ? "✓" : "!"}</span>{topic.code} · {topic.title}<small>{maintenance ? "Maintenance" : STAGES[stage]}</small></button>; })}</div> : <p>No earlier topic is required. Talha can begin here.</p>}</div>
                <div><strong>Topics that use this knowledge</strong>{chosenLinkedNext.length ? <div className="path-chips">{chosenLinkedNext.map((topic) => <button key={topic.id} onClick={() => { setChosenTopicId(topic.id); revealTopic(topic); }}><span>→</span>{topic.code} · {topic.title}<small>{STAGES[progressMap.get(topic.id)?.stage ?? 0]}</small></button>)}</div> : <p>This is currently an end-point topic in its learning path.</p>}</div>
              </div>
            </div>
            <div className="metrics-row compact"><article><span>Coverage</span><strong>{stats.coverage}%</strong><small>{stats.learned}/{stats.total} topics</small></article><article><span>Practising</span><strong>{stats.practice}%</strong><small>{stats.practised} topics</small></article><article><span>Secure</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics</small></article><article><span>Remaining</span><strong>{Math.ceil(stats.remainingMinutes / 60)}h</strong><small>weighted work to Secure</small></article></div>
            <div className="filter-panel"><div className="subject-tabs"><button className={subject === "All" ? "active" : ""} onClick={() => setSubject("All")}>All <span>{TOPICS.length}</span></button>{SUBJECTS.map((item) => <button key={item} className={subject === item ? "active" : ""} onClick={() => setSubject(item)}>{SUBJECT_META[item].short} <span>{TOPICS.filter((topic) => topic.subject === item).length}</span></button>)}</div><div className="filter-controls"><label><span className="sr-only">Search syllabus</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, unit or topic" /></label><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} aria-label="Filter syllabus completion"><option>All topics</option><option>Completed</option><option>Completed — not yet secure</option><option>Secure</option><option>Partially completed</option><option>Remaining</option><option>Maintenance</option><option>Revision due</option></select><strong>{filteredTopics.length} topics</strong></div></div>
            <div className="topic-list">
              {filteredTopics.map((topic) => {
                const item = progressMap.get(topic.id); const liveTopicStage = item?.stage ?? 0; const topicStage = progressStageFor(topic); const open = expanded === topic.id; const maintenance = maintenanceTopicIds.has(topic.id); const previouslyCompleted = !maintenance && liveTopicStage === 0 && archivedCompletedTopicIds.has(topic.id); const completionAt = item?.lastStudiedAt ?? (archivedCompletedTopicIds.has(topic.id) ? familyState.archivedCompletions[topic.id] : undefined);
                const subjectMinutes = TOPICS.filter((candidate) => candidate.subject === topic.subject).reduce((sum, candidate) => sum + candidate.minutes, 0);
                const workloadShare = ((topic.minutes / subjectMinutes) * 100).toFixed(1);
                const sessions = Math.max(1, Math.ceil(topic.minutes / 45));
                const baseGuidance = effortGuidance(item?.bestScore ?? 0, tests.find((attempt) => attempt.topicId === topic.id)?.errorCategory);
                const guidance = { ...baseGuidance, effort: previouslyCompleted ? "Previously completed" : String(baseGuidance.effort) };
                return <article className="topic-row" key={topic.id}><button disabled={saving} className={`stage-button ${stageClass(topicStage)}`} onClick={() => updateStage(topic, maintenance ? 0 : topicStage === 3 ? 3 : topicStage + 1)} aria-label={maintenance ? `${topic.title} was previously completed and is in maintenance` : `Update ${topic.title}`}><span>{maintenance ? "✓" : topicStage === 0 ? "" : topicStage === 3 ? "★" : "✓"}</span></button><div className="topic-main"><div className="topic-kicker"><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><span>{topic.code}</span><span>{topic.unit}</span></div><h3>{topic.title}</h3><div className="topic-meta"><span>{importanceLabel(topic.importance)} exam priority</span><span>{topic.paper}</span><span>{Math.ceil(topic.minutes / 60 * 10) / 10}h · {sessions} session{sessions === 1 ? "" : "s"}</span><span>{workloadShare}% of subject workload</span><span>{maintenance ? "Done · past-paper maintenance" : topicStage ? guidance.effort : "Not started"}</span>{(maintenance || topicStage > 0) && <span>{completionAt ? `Completed ${fullDateTimeLabel(completionAt)}` : "Completed before reset · exact time unavailable"}</span>}{hasReviewedQuiz(topic.id) && <span>Reviewed quiz ready</span>}</div>{open && <div className="topic-detail"><PastPaperPractice topicIds={[topic.id]} /><div><strong>{maintenance ? "How to maintain it" : "How to complete it"}</strong><p>{maintenance ? "Do topical past-paper questions, mark them strictly, and return to teaching only if repeated errors reveal a gap." : "Learn the key idea, work through an example, practise independently, correct errors, then return for a recall check."}</p></div><div><label>Estimated learning minutes for this whole topic<input key={settings[`planner.estimate.${topic.id}`] || topic.id} type="number" min="20" max="3000" step="5" defaultValue={settings[`planner.estimate.${topic.id}`] || topic.minutes} onBlur={(event) => { if (event.target.value !== (settings[`planner.estimate.${topic.id}`] || String(topic.minutes))) void saveSetting(`planner.estimate.${topic.id}`, event.target.value); }} /></label><p>Adjust after real study experience. Preview and accept a revised plan in Important Dates to apply this estimate to future assignments.</p><strong>Lessons within this topic</strong><ul>{topicLessonTitles(topic).map((title) => <li key={title}>{title}</li>)}</ul><strong>What matters in the exam</strong><p>{topic.tip}</p></div><div className="topic-links"><strong>Linked learning path</strong>{prerequisiteTopics(topic.id).length ? <p>Builds on: {prerequisiteTopics(topic.id).map((linked) => linked.title).join(" · ")}</p> : <p>No earlier foundation required.</p>}{linkedNextTopics(topic.id).length > 0 && <p>Leads to: {linkedNextTopics(topic.id).map((linked) => linked.title).join(" · ")}</p>}<button onClick={() => showFullPath(topic)}>Show full path above</button></div><div className="stuck-box"><strong>Finding this difficult?</strong><p>Choose the help that matches the problem.</p><div><button onClick={() => openPrerequisiteHelp(topic)}>I forgot an earlier idea</button><button onClick={() => openPracticeHelp(topic)}>I cannot solve questions</button><button onClick={() => openRepeatPicker(topic)}>Repeat this later</button></div>{repeatPickerTopicId === topic.id && <div className="repeat-scheduler"><label><span>Choose the repeat date</span><input type="date" min={moveDate(localDateKey(), 1)} value={repeatDateChoice} onChange={(event) => setRepeatDateChoice(event.target.value)} /></label><button onClick={() => void repeatTopicLater(topic)}>Confirm date</button><button className="repeat-cancel" onClick={() => setRepeatPickerTopicId(null)}>Cancel</button></div>}{settings[`planner.repeat.${topic.id}`] && <div className="repeat-scheduled"><span>Scheduled for {fullDateLabel(settings[`planner.repeat.${topic.id}`])}</span><button onClick={() => void undoRepeat(topic)}>Undo repeat</button></div>}</div><a href={topicPracticeUrl(topic)} target="_blank" rel="noreferrer">Search for topic practice (external) ↗</a><a href={youtubeSearchUrl(topic)} target="_blank" rel="noreferrer">Watch a selected topic lesson ↗</a></div>}</div><div className="topic-actions"><label>Lesson progress<select aria-label={`Partial progress for ${topic.title}`} value={settings[`planner.partial.${topic.id}`] || ""} disabled={saving || maintenance || topicStage > 0} onChange={(event) => void saveSetting(`planner.partial.${topic.id}`, event.target.value)}><option value="">Not recorded</option><option value="25">25% studied</option><option value="50">50% studied</option><option value="75">75% studied</option></select></label><span className={`status-pill ${stageClass(topicStage)}`}>{maintenance ? "Done · Maintenance" : previouslyCompleted ? "Previously completed" : STAGES[topicStage]}</span>{hasReviewedQuiz(topic.id) && <button className="quiz-row-button" onClick={() => openQuiz(topic)}>Quiz</button>}{(maintenance || topicStage > 0) && <button onClick={() => updateStage(topic, 0)} aria-label={`Reset ${topic.title} to Not started`}>Reset</button>}<button onClick={() => { setExpanded(open ? null : topic.id); setStuckTopicId(open ? null : topic.id); }}>{open ? "Close" : "Lesson help"}</button></div></article>;
              })}
              {filteredTopics.length === 0 && <EmptyMessage>No topics match these filters.</EmptyMessage>}
            </div>
          </section>
        )}

        {view === "quizzes" && (
          <QuizView
            selectedTopicId={quizTopicId}
            progressMap={progressMap}
            attempts={familyState.attempts}
            onSelectTopic={setQuizTopicId}
            onOpenSyllabus={() => setView("syllabus")}
            onCompleted={handleQuizCompleted}
          />
        )}

        {view === "dates" && (
          <section className="section-block no-top">
            <TargetPlanner settings={settings} completed={planningCompleted} history={[...planner.tasksById.values()]} today={todayKey} onSaved={() => loadFamilyState(false)} />
            <div className="panel"><div className="section-heading"><div><span className="eyebrow">CAMBRIDGE MAY/JUNE 2027 · VARIANT 2</span><h2>Examination countdown</h2></div><span className="quiet">Dates from your tracker · confirm against the examination centre timetable</span></div>
              <div className="daily-check-history-list">{IMPORTANT_DATES.map((exam) => { const left = Math.max(0, Math.ceil((dateFromKey(exam.date).getTime() - dateFromKey(todayKey).getTime()) / 86_400_000)); return <article key={exam.date}><div><strong>{fullDateLabel(exam.date)}</strong><small>{exam.duration}</small></div><p><b>{exam.label}</b><br />{left} days left</p></article>; })}</div>
            </div>
          </section>
        )}

        {view === "tests" && (
          <section className="evidence-layout no-top">
            <WeeklyReview tasks={[...planner.tasksById.values()]} settings={settings} today={todayKey} onStart={setDailyQuizTaskId} />
            <OfficialPaperLibrary />
            <QuizBankSyncCard />
            <div className="diagnostic-grid">
              {SUBJECTS.map((item) => {
                const profile = SUBJECT_PROFILES[item];
                const subjectAttempts = tests.filter((attempt) => attempt.subject === item);
                const average = subjectAttempts.length
                  ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + percentage(attempt.score, attempt.maxScore), 0) / subjectAttempts.length)
                  : null;
                const guidance = average == null ? null : effortGuidance(average, subjectAttempts[0]?.errorCategory);
                return <article key={item} className={subjectClass(item)}><div><span>{SUBJECT_META[item].short} · {SUBJECT_META[item].code}</span><strong>{guidance?.effort ?? "Starting check needed"}</strong></div><p>{guidance ? `Main focus: ${guidance.gap}` : "Record a first attempt to identify the right learning effort."}</p><button onClick={() => { const first = TOPICS.find((topic) => topic.subject === item); if (first) { setTestTopicId(first.id); setTestPaper(profile.papers[0]); setTestType("Diagnostic"); } }}>Record {subjectAttempts.length ? "another attempt" : "starting check"}</button></article>;
              })}
            </div>
            <div className="two-column-section">
              <form className="test-form panel" onSubmit={recordTest}>
                <span className="eyebrow">RECORD EXAM EVIDENCE</span>
                <h2>Add a marked attempt</h2>
                <p>Secure means two results at or above {selectedProfile.secureThreshold}% on different dates, including one timed attempt.</p>
                <div className="form-row"><label>Assessment type<select value={testType} onChange={(event) => setTestType(event.target.value as AssessmentType)}>{ASSESSMENT_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label>Paper or component<select value={testPaper} onChange={(event) => setTestPaper(event.target.value)}>{selectedProfile.papers.map((item) => <option key={item}>{item}</option>)}</select></label></div>
                <label>Subject<select value={selectedTestSubject} onChange={(event) => { const nextSubject = event.target.value as SubjectName; const first = TOPICS.find((item) => item.subject === nextSubject); if (first) { setTestTopicId(first.id); setTestPaper(SUBJECT_PROFILES[nextSubject].papers[0]); } }}>{SUBJECTS.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Topic<select value={testTopicId} onChange={(event) => setTestTopicId(event.target.value)}>{TOPICS.filter((item) => item.subject === selectedTestSubject).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}</select></label>
                <div className="evidence-rule"><strong>Secure proof: {selectedEvidence.passes}/2 passes</strong><span>{selectedEvidence.hasTimed ? "Timed pass recorded ✓" : "A qualifying timed pass is still needed"}</span></div>
                <div className="form-row"><label>Marks obtained<input inputMode="decimal" value={testScore} onChange={(event) => setTestScore(event.target.value)} placeholder="17" /></label><label>Out of<input inputMode="decimal" value={testMax} onChange={(event) => setTestMax(event.target.value)} /></label></div>
                <div className="form-row"><label>Minutes used<input inputMode="numeric" value={testMinutes} onChange={(event) => setTestMinutes(event.target.value)} /></label><label className="check-label"><input type="checkbox" checked={testTimed} onChange={(event) => setTestTimed(event.target.checked)} /><span>Completed under timed conditions</span></label></div>
                <label>Main reason marks were lost<select value={testError} onChange={(event) => setTestError(event.target.value as ErrorCategory)}>{ERROR_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Correction note<textarea value={testNote} onChange={(event) => setTestNote(event.target.value)} placeholder="Write the exact correction or rule Talha should remember next time." /></label>
                <button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save evidence and schedule next step"}</button>
              </form>
              <div className="panel results-panel"><div className="section-heading"><div><span className="eyebrow">RECENT LEARNING EVIDENCE</span><h2>Effort and next actions</h2></div><strong>{tests.length} attempts</strong></div><div className="result-list">{tests.length ? tests.slice(0, 14).map((result) => { const topic = TOPICS.find((item) => item.id === result.topicId); const resultPercentage = percentage(result.score, result.maxScore); const guidance = effortGuidance(resultPercentage, result.errorCategory); return <article key={result.id}><div className={`effort-disc ${resultPercentage >= subjectThreshold(result.subject) ? "good" : resultPercentage >= 55 ? "mid" : "low"}`}>{guidance.effort.split(" ")[0]}</div><div><span>{result.subject} · {result.assessmentType} · {dateLabel(result.createdAt)}{result.timed ? " · timed" : ""}</span><h3>{topic?.title ?? "Recorded assessment"}</h3><p><strong>{guidance.effort}</strong> · Main need: {guidance.gap}</p><p className="error-tag">{guidance.next}{result.note ? ` ${result.note}` : ""}</p></div></article>; }) : <EmptyMessage>Start with the four subject checks. The system will then recommend the right effort and next action.</EmptyMessage>}</div></div>
            </div>
          </section>
        )}

        {view === "plan" && (
          <section className="plan-layout no-top">
            <div className="panel plan-settings"><span className="eyebrow">HOMESCHOOL CAPACITY</span><h2>Set the finish line</h2><p>The supplied master plan uses five 90-minute subject pools Monday-Saturday and a ten-hour Sunday consolidation pool. Changes recalculate every remaining date.</p><label>First syllabus completion date<input type="date" value={settings.targetDate} onChange={(event) => saveSetting("targetDate", event.target.value)} /></label><label>Final examination date<input type="date" value={settings.examDate} onChange={(event) => saveSetting("examDate", event.target.value)} /></label><div className="form-row"><label>Study days each week<input type="number" min="1" max="7" value={settings.studyDays} onChange={(event) => saveSetting("studyDays", event.target.value)} /></label><label>Monday-Saturday total minutes<input type="number" min="150" max="600" step="15" value={settings.dailyMinutes} onChange={(event) => saveSetting("dailyMinutes", event.target.value)} /></label></div></div>
            <div className={`capacity-card ${feasible ? "feasible" : "behind"}`}><span className="eyebrow light">PLAN CHECK</span><h2>{feasible ? "The plan is achievable." : "More time is needed."}</h2><p>{Math.ceil(stats.remainingMinutes / 60)} hours of weighted work remain across learning, practice and secure evidence.</p><div className="capacity-numbers"><div><span>Required daily</span><strong>{requiredDaily}<small> min</small></strong></div><div><span>Available daily</span><strong>{plannedDaily}<small> min</small></strong></div><div><span>Study days left</span><strong>{availableDays}</strong></div></div><p className="capacity-advice">{feasible ? `At this pace, Talha has a ${plannedDaily - requiredDaily}-minute daily buffer for timed papers, corrections and missed work.` : `Add ${requiredDaily - plannedDaily} minutes per study day, add study days, or move the completion date.`}</p></div>
            <div className="panel roadmap-panel"><div className="section-heading"><div><span className="eyebrow">COMPLETE ROADMAP</span><h2>Every subject, hour and next step</h2></div><span className="quiet">Progress is weighted by human study time—not topic count</span></div><div className="roadmap-phases"><article className="active"><span>1</span><div><strong>Learn the syllabus</strong><small>Now → {fullDateLabel(settings.targetDate)}</small></div></article><article><span>2</span><div><strong>Topical exam practice</strong><small>After first coverage</small></div></article><article><span>3</span><div><strong>Mixed timed papers</strong><small>Build speed and application</small></div></article><article><span>4</span><div><strong>Final revision</strong><small>Weak areas and full mocks</small></div></article></div><div className="roadmap-grid">{roadmapSubjects.map((item) => <article key={item.subject} className={subjectClass(item.subject)}><div className="roadmap-title"><i style={{ background: SUBJECT_META[item.subject].color }} /><div><strong>{item.subject}</strong><small>{SUBJECT_META[item.subject].code}</small></div><b>{item.progress}%</b></div><div className="roadmap-bar"><span style={{ width: `${item.progress}%` }} /></div><div className="roadmap-numbers"><span><b>{Math.ceil(item.totalMinutes / 60)}h</b> total</span><span><b>{Math.ceil(item.remainingMinutes / 60)}h</b> remaining</span></div><p>Next: <strong>{item.nextTopic ? `${item.nextTopic.code} · ${item.nextTopic.title}` : "Syllabus learning complete"}</strong></p><button onClick={() => { if (item.nextTopic) { revealTopic(item.nextTopic); setView("syllabus"); } }}>Open next topic</button></article>)}</div></div>
            <div className="panel subject-strategy"><div className="section-heading"><div><span className="eyebrow">CURRENT STUDY ALLOCATION</span><h2>Time follows present learning needs</h2></div><span className="quiet">Rebalanced as real evidence is recorded</span></div><div className="strategy-grid">{SUBJECTS.map((item) => { const profile = SUBJECT_PROFILES[item]; return <article key={item}><div className="strategy-title"><i style={{ background: SUBJECT_META[item].color }} /><strong>{item}</strong><span>{profile.weeklyShare}% of study time</span></div><p><b>{roadmapSubjects.find((row) => row.subject === item)?.progress ?? 0}% workload completed</b></p><p>{profile.diagnostic}</p><small>{profile.examHabit}</small></article>; })}</div></div>
            <div className="panel method-panel"><span className="eyebrow">INDEPENDENT STUDY METHOD</span><h2>One lesson, five moves</h2><ol><li><span>01</span><div><strong>Recall</strong><p>Retrieve yesterday&apos;s and due material without notes.</p></div></li><li><span>02</span><div><strong>Learn</strong><p>Understand one exact syllabus objective or worked method.</p></div></li><li><span>03</span><div><strong>Practise</strong><p>Answer marked exam questions without looking at solutions.</p></div></li><li><span>04</span><div><strong>Correct</strong><p>Identify what was missing and write the corrected response.</p></div></li><li><span>05</span><div><strong>Re-test</strong><p>Return on another date to make sure the learning remains.</p></div></li></ol></div>
          </section>
        )}

        {view === "help" && (
          <section className="section-block no-top">
            <div className="panel">
              <span className="eyebrow">TALHA&apos;S SELF-STUDY MANUAL</span>
              <h2>What this LMS does</h2>
              <p>This is Talha&apos;s daily guide for completing four Cambridge IGCSE subjects without attending school. It turns the 22-week syllabus into dated lessons, keeps large topics in manageable sessions, carries missed work forward, checks understanding, and shows the parent where support is needed. It guides study; it does not replace Cambridge textbooks, official past papers, mark schemes or qualified help when a concept remains unclear.</p>
            </div>

            <div className="strategy-grid">
              <article className="panel"><span className="eyebrow">01 · TODAY</span><h2>Follow only today&apos;s two subjects</h2><p>Open <b>Today</b> and complete the two displayed subject tasks in order. A normal weekday subject block is approximately three hours. Use the method, practice and recall instructions shown inside the task.</p><p><b>Tick a task only after doing the assigned work.</b> Completing one task must not bring tomorrow&apos;s lesson into the same day. The remaining minutes and task count reduce immediately.</p></article>
              <article className="panel"><span className="eyebrow">02 · DAILY CHECK</span><h2>Prove the lesson for 20 minutes</h2><p>After each weekday subject task, use its reviewed Daily Check. Until a matching reviewed check is published, use <b>20-min practice</b> to open topic-specific Cambridge questions and mark them with the matching scheme. Old quiz IDs are blocked from attaching to a new lesson.</p><p><b>Ready to continue</b> means proceed on schedule. <b>More practice needed</b> means correct errors and retry. <b>Repeat foundation</b> means revisit the explanation or prerequisite before moving independently.</p></article>
              <article className="panel"><span className="eyebrow">03 · CALENDAR</span><h2>See the plan by date</h2><p>Select any date to see its assigned tasks. Each date should contain no more than two principal subjects. The small number on a calendar day shows completed tasks against assigned tasks.</p><p>If a day or subject is missed, leave it unticked. The LMS carries unfinished work forward and recalculates the later timeline; it must not erase or silently mark the work complete.</p></article>
              <article className="panel"><span className="eyebrow">04 · SYLLABUS</span><h2>Understand the complete learning path</h2><p><b>Active syllabus</b> contains everything Talha must still complete. <b>Maintenance</b> contains only the topics he explicitly confirmed beforehand. Select a topic to see time, paper, importance, prerequisites and later linked topics.</p><p><b>Not started → Learning → Practising → Secure.</b> Checking today&apos;s task records only that lesson; “Secure” still requires assessment evidence. No old progress stage can check off a new calendar task.</p></article>
              <article className="panel"><span className="eyebrow">05 · IMPORTANT DATES</span><h2>Know every examination deadline</h2><p>This tab lists each Cambridge paper, duration and days remaining. Use it to understand urgency; the calendar remains the source of today&apos;s work.</p></article>
              <article className="panel"><span className="eyebrow">06 · WEEKEND ASSESSMENTS</span><h2>Test a complete topic for one hour</h2><p>At weekends, complete the assigned whole-topic assessment under timed conditions. Mark it using the correct mark scheme, then record marks, time and the main error type.</p><p>The LMS reports effort and improvement actions rather than displaying old school grades. A strong result still returns later for retention.</p></article>
              <article className="panel"><span className="eyebrow">07 · DIFFICULTY & REPEAT</span><h2>Use help without abandoning the topic</h2><p>Open Lesson Help when stuck. Use the prerequisite path if an earlier idea is missing, practise a simpler example when questions cannot be solved, or choose <b>Repeat later</b> and select a date.</p><p>If Repeat later was selected by mistake, use Reset/undo before choosing another date.</p></article>
              <article className="panel"><span className="eyebrow">08 · REMINDERS</span><h2>Build a dependable routine</h2><p>Select <b>Enable reminders</b> and allow browser notifications. Keep a consistent start time. Device or browser restrictions can prevent notifications, so the Today screen remains the authoritative checklist.</p></article>
            </div>

            <div className="panel method-panel">
              <span className="eyebrow">THE DAILY STUDY ROUTINE</span><h2>One subject block, five moves</h2>
              <ol>
                <li><span>01</span><div><strong>Recall</strong><p>Start closed-book: retrieve yesterday&apos;s key ideas.</p></div></li>
                <li><span>02</span><div><strong>Learn</strong><p>Study the exact objective and make concise notes.</p></div></li>
                <li><span>03</span><div><strong>Practise</strong><p>Complete guided examples, then independent Cambridge-style questions.</p></div></li>
                <li><span>04</span><div><strong>Correct</strong><p>Mark carefully and rewrite every weak answer or calculation.</p></div></li>
                <li><span>05</span><div><strong>Check</strong><p>Complete the 20-minute Daily Check and follow its effort guidance.</p></div></li>
              </ol>
            </div>

            <div className="panel">
              <span className="eyebrow">FOR THE PARENT</span><h2>How to use Parent View</h2>
              <p>Parent View shows syllabus coverage, secure evidence, study consistency, overdue recall, recurring errors and recent Daily Check guidance. Use the Google Sheet editor only to prepare reviewed questions; publish only rows marked Approved. Before any major reset, download a progress backup and use the archive-first reset process.</p>
              <p><b>When something looks wrong:</b> do not tick extra tasks to clear them. Refresh once, sign out and back in, and take a screenshot showing the selected date and task count. The adaptive plan uses up to two subjects on a teaching day. A subject block may contain several short, individually tickable parts. Extra work appears only when requested.</p>
            </div>
          </section>
        )}

        {view === "parent" && <ParentView progressMap={progressMap} activity={familyState.activity} attempts={familyState.attempts} stats={stats} settings={settings} requiredDaily={requiredDaily} />}
      </main>
      {dailyQuizTaskId && <DailyQuizView taskId={dailyQuizTaskId} onClose={() => setDailyQuizTaskId(null)} onCompleted={handleDailyQuizCompleted} />}
    </div>
  );
}

function QuizBankSyncCard() {
  const [status, setStatus] = useState("Checking quiz bank...");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/quiz-bank/sync", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setStatus(data.latest?.status === "success"
        ? `Last sync: ${data.latest.approvedRows} approved questions`
        : data.configured ? "Ready to sync approved questions" : "Google Sheet connection needs configuring"))
      .catch(() => setStatus("Quiz-bank status is temporarily unavailable"));
  }, []);

  async function syncNow() {
    setSyncing(true); setStatus("Validating approved questions...");
    try {
      const response = await fetch("/api/quiz-bank/sync", { method: "POST" });
      const data = await response.json() as { error?: string; approvedRows?: number; rejectedRows?: number };
      if (!response.ok) throw new Error(data.error ?? "Sync failed");
      setStatus(`Published ${data.approvedRows} approved questions${data.rejectedRows ? `; rejected ${data.rejectedRows} invalid rows` : ""}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Quiz-bank sync failed");
    } finally { setSyncing(false); }
  }

  return <div className="panel"><div className="section-heading"><div><span className="eyebrow">CONTROLLED QUIZ BANK</span><h2>Google Sheet publishing</h2></div><a href="https://docs.google.com/spreadsheets/d/1IFCOQogNrT9UhwzjLjIzZlLxwqVtQ8_NOsrQfrGSEXI/edit" target="_blank" rel="noreferrer">Open question editor</a></div><p>{status}</p><button type="button" onClick={() => void syncNow()} disabled={syncing}>{syncing ? "Checking..." : "Validate and sync approved rows"}</button><p className="panel-note">Only valid Approved rows publish. Questions are matched by task identity or exact topic and lesson title; unrelated lessons are never substituted. Draft and Reviewed rows stay unpublished. Any invalid Approved row cancels the import and preserves the working bank.</p></div>;
}

function ParentView({ progressMap, activity, attempts, stats, settings, requiredDaily }: { progressMap: Map<string, ProgressItem>; activity: ActivityItem[]; attempts: AssessmentAttempt[]; stats: Stats; settings: Record<string, string>; requiredDaily: number }) {
  const recent = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - offset));
    const key = date.toISOString().slice(0, 10);
    const rows = activity.filter((item) => item.createdAt.slice(0, 10) === key);
    return { key, label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date), minutes: rows.reduce((sum, item) => sum + (item.minutes ?? 0), 0) };
  });
  const maxMinutes = Math.max(60, ...recent.map((day) => day.minutes));
  const subjectStats = SUBJECTS.map((subject) => {
    const topics = TOPICS.filter((topic) => topic.subject === subject);
    const covered = topics.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) >= 1).length;
    const mastered = topics.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) >= 3).length;
    const subjectAttempts = attempts.filter((attempt) => attempt.subject === subject);
    const average = subjectAttempts.length
      ? Math.round(subjectAttempts.reduce((sum, attempt) => sum + percentage(attempt.score, attempt.maxScore), 0) / subjectAttempts.length)
      : 0;
    const errorCounts = new Map<string, number>();
    subjectAttempts.forEach((attempt) => {
      if (attempt.errorCategory && attempt.errorCategory !== "No major error") {
        errorCounts.set(attempt.errorCategory, (errorCounts.get(attempt.errorCategory) ?? 0) + 1);
      }
    });
    const topError = [...errorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Run diagnostic";
    const secureRate = Math.round((mastered / topics.length) * 100);
    const profile = SUBJECT_PROFILES[subject];
    const track = !subjectAttempts.length
      ? "Starting check needed"
      : average >= profile.secureThreshold && secureRate >= 60
        ? "Secure progress"
        : average >= 70
          ? "Steady practice"
          : "Focused support";
    return { subject, total: topics.length, covered, mastered, average, topError, track, profile };
  });
  const overdue = TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id)));
  const errorCounts = new Map<string, number>();
  attempts.forEach((attempt) => {
    if (attempt.errorCategory && attempt.errorCategory !== "No major error") {
      errorCounts.set(attempt.errorCategory, (errorCounts.get(attempt.errorCategory) ?? 0) + 1);
    }
  });
  const leadingErrors = [...errorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const recentDailyChecks = activity.filter((item) => item.kind === "daily-check").slice(0, 10);
  return <section className="parent-layout no-top">
    <QuizBankSyncCard />
    <div className="metrics-row"><article><span>Syllabus covered</span><strong>{stats.coverage}%</strong><small>{stats.learned} of {stats.total} topics</small></article><article><span>Evidence Secure</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics with proof</small></article><article><span>Evidence readiness</span><strong>{stats.readiness}%</strong><small>not a predicted grade</small></article><article><span>Daily checks recorded</span><strong>{activity.filter((item) => item.kind === "daily-check").length}</strong><small>{stats.timedEvidence} timed exam attempts</small></article></div>
    <div className="parent-grid"><div className="panel activity-panel"><div className="section-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>Study consistency</h2></div><strong>{recent.reduce((sum, day) => sum + day.minutes, 0)} min</strong></div><div className="weekly-bars">{recent.map((day) => <div key={day.key}><div className="bar-track"><span style={{ height: `${Math.max(4, (day.minutes / maxMinutes) * 100)}%` }}><b>{day.minutes || ""}</b></span></div><small>{day.label}</small></div>)}</div><p className="panel-note">Daily target currently requires approximately <strong>{requiredDaily} minutes</strong> on each study day.</p></div>
      <div className="panel alert-panel"><span className="eyebrow">PARENT ATTENTION</span><h2>{overdue.length ? `${overdue.length} recalls are overdue` : "Recall schedule is clear"}</h2>{leadingErrors.length ? <><p>Most frequent sources of lost marks:</p><ul>{leadingErrors.map(([error, count]) => <li key={error}><span>{count}×</span><div><strong>{error}</strong><small>Use the correction note, then re-test on a different date.</small></div></li>)}</ul></> : overdue.length ? <ul>{overdue.slice(0, 4).map((topic) => <li key={topic.id}><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><div><strong>{topic.title}</strong><small>Last studied {dateLabel(progressMap.get(topic.id)?.lastStudiedAt)}</small></div></li>)}</ul> : <p>Run the four subject diagnostics to reveal the first performance priorities.</p>}</div></div>
    <div className="panel daily-check-history"><div className="section-heading"><div><span className="eyebrow">RECENT DAILY CHECKS</span><h2>What needs to happen next</h2></div><span className="quiet">Effort guidance—not grades</span></div><div className="daily-check-history-list">{recentDailyChecks.length ? recentDailyChecks.map((item) => <article key={item.id}><div><strong>{dailyCheckOutcome(item.note) ?? "Check completed"}</strong><small>{item.subject ?? "Study lesson"} · {dateLabel(item.createdAt)}</small></div><p>{dailyCheckSummary(item.note)}</p></article>) : <EmptyMessage>Daily-check guidance will appear here after Talha completes a lesson check.</EmptyMessage>}</div></div>
    <div className="panel subject-table"><div className="section-heading"><div><span className="eyebrow">LEARNING SUPPORT TRACKER</span><h2>Progress, effort and next focus</h2></div><div className="backup-actions"><span className="quiet">Syllabus target: {fullDateLabel(settings.targetDate)}</span><a href="/api/backup">Download progress backup</a></div></div><div className="table-head"><span>Subject</span><span>Workload covered</span><span>Secure</span><span>Effort needed</span><span>Present need / next focus</span></div>{subjectStats.map((item) => { const topicMinutes = TOPICS.filter((topic) => topic.subject === item.subject).reduce((sum, topic) => sum + topic.minutes, 0); const coveredMinutes = TOPICS.filter((topic) => topic.subject === item.subject && (progressMap.get(topic.id)?.stage ?? 0) >= 1).reduce((sum, topic) => sum + topic.minutes, 0); const guidance = item.average ? effortGuidance(item.average, item.topError) : null; return <div className="table-row" key={item.subject}><strong><i style={{ background: SUBJECT_META[item.subject].color }} />{item.subject}</strong><span>{Math.round((coveredMinutes / topicMinutes) * 100)}% <small>weighted by time</small></span><span>{Math.round((item.mastered / item.total) * 100)}% <small>{item.mastered}/{item.total}</small></span><span>{guidance?.effort ?? "Starting check"}</span><span><b className={`track-pill ${item.track === "Secure progress" ? "good" : item.track === "Focused support" ? "low" : "mid"}`}>{item.track}</b><small>{item.topError}</small></span></div>; })}</div>
  </section>;
}
