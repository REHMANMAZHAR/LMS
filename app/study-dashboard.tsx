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
import { STARTER_LESSONS, sundayLesson, topicLesson, type GuidedLesson } from "./lesson-plan";

type View = "today" | "calendar" | "syllabus" | "quizzes" | "tests" | "plan" | "parent";
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

type PlannerTask = {
  id: string;
  topic: Topic;
  stream: StudyStream;
  kind: "syllabus" | "revision" | "past-paper";
  lesson: GuidedLesson;
  session: number;
  sessions: number;
  minutes: number;
  originalDate: string;
  scheduledDate: string;
  carriedForward: boolean;
};

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
  targetDate: "2027-02-21",
  examDate: "2027-05-21",
  dailyMinutes: "450",
  studyDays: "7",
  plannerStartDate: "2026-08-31",
  reminderTime: "09:00",
  remindersEnabled: "false",
};

const EMPTY_STATE: FamilyState = {
  progress: [],
  settings: DEFAULT_SETTINGS,
  activity: [],
  attempts: [],
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
  progressMap: ReadonlyMap<string, ProgressItem>,
  settings: Record<string, string>,
  today: string,
) {
  const weekdayCapacity = Math.max(150, Number(settings.dailyMinutes || 450));
  const studyDays = Math.max(1, Number(settings.studyDays || 7));
  const startDate = settings.plannerStartDate || today;
  const minutesForDate = (key: string) => dateFromKey(key).getDay() === 0 ? 120 : Math.round(weekdayCapacity / STUDY_STREAMS.length);
  const streamMinutes = STUDY_STREAMS.map(() => Math.round(weekdayCapacity / STUDY_STREAMS.length));
  const streamQueues = STUDY_STREAMS.map((stream, streamIndex) => {
    const queue: Omit<PlannerTask, "originalDate" | "scheduledDate" | "carriedForward">[] = [];
    const minutesPerSession = streamMinutes[streamIndex];
    const starterTopicIds = new Set<string>();
    STARTER_LESSONS[stream.name].forEach((guided, index) => {
      const topic = TOPICS.find((candidate) => candidate.id === guided.topicId);
      if (!topic) return;
      starterTopicIds.add(topic.id);
      queue.push({
        id: `guided:${stream.name}:${index + 1}`,
        topic,
        stream: stream.name,
        kind: "syllabus",
        lesson: guided,
        session: index + 1,
        sessions: STARTER_LESSONS[stream.name].length,
        minutes: minutesPerSession,
      });
    });
    TOPICS.filter((topic) => topicStream(topic) === stream.name && !starterTopicIds.has(topic.id)).forEach((topic) => {
      const sessions = Math.max(1, Math.ceil(topic.minutes / minutesPerSession));
      for (let session = 1; session <= sessions; session += 1) {
        queue.push({
          id: `${topic.id}:${session}`,
          topic,
          stream: stream.name,
          kind: "syllabus",
          lesson: topicLesson(topic, session, sessions),
          session,
          sessions,
          minutes: minutesPerSession,
        });
      }
    });
    return queue;
  });
  const canonical = new Map<string, PlannerTask[]>();
  let date = startDate;
  let practiceDay = 0;
  const lastLessonTitles = STUDY_STREAMS.map(() => "the week's assigned lessons");
  const examDate = settings.examDate || "2027-05-21";
  while (date <= examDate) {
    if (isStudyDate(date, studyDays)) {
      const isSunday = dateFromKey(date).getDay() === 0;
      const dayTasks = STUDY_STREAMS.map((stream, streamIndex) => {
        if (isSunday) {
          const topic = TOPICS.find((candidate) => topicStream(candidate) === stream.name) ?? TOPICS[0];
          return {
            id: `revision:${stream.name}:${date}`,
            topic,
            stream: stream.name,
            kind: "revision" as const,
            lesson: sundayLesson(stream.name, lastLessonTitles[streamIndex]),
            session: 1,
            sessions: 1,
            minutes: minutesForDate(date),
          };
        }
        const syllabusTask = streamQueues[streamIndex].shift();
        if (syllabusTask) {
          lastLessonTitles[streamIndex] = syllabusTask.lesson.title;
          return syllabusTask;
        }
        const topics = TOPICS.filter((topic) => topicStream(topic) === stream.name);
        const topic = topics[practiceDay % topics.length];
        const paperCycle: Record<StudyStream, string[]> = {
          Mathematics: ["Paper 2 non-calculator", "Paper 4 calculator"],
          Chemistry: ["Paper 2 MCQ", "Paper 4 theory", "Paper 6 practical"],
          Islamiyat: ["Paper 1 structured answers", "Paper 2 structured answers"],
          "Pakistan History": ["Paper 1 source and judgement practice"],
          "Pakistan Geography": ["Paper 2 data and case-study practice"],
        };
        const paperLabel = paperCycle[stream.name][practiceDay % paperCycle[stream.name].length];
        const marathon = date >= "2027-02-22";
        const label = marathon ? paperLabel : `Topical questions: ${topic.title}`;
        const practiceTopic = { ...topic, code: marathon ? "PAST PAPER" : "EXAM PRACTICE", title: label };
        const guide = topicLesson(practiceTopic, 1, 1);
        return { id: `past:${stream.name}:${date}`, topic: practiceTopic, stream: stream.name, kind: "past-paper" as const, lesson: { ...guide, title: label }, session: 1, sessions: 1, minutes: minutesForDate(date) };
      });
      canonical.set(date, dayTasks.map((task) => ({ ...task, minutes: minutesForDate(date), originalDate: date, scheduledDate: date, carriedForward: false })));
      practiceDay += 1;
    }
    date = moveDate(date, 1);
  }
  const logicalCompletion = (task: PlannerTask) => {
    if (task.kind !== "syllabus") return false;
    const stage = progressMap.get(task.topic.id)?.stage ?? 0;
    const completedShare = [0, .45, .75, 1][stage] ?? 0;
    return task.session <= Math.floor(task.sessions * completedShare);
  };
  const doneDate = (taskId: string) => settings[`planner.done.${taskId}`] || "";
  const incomplete = [...canonical.values()].flat().filter((task) => !doneDate(task.id) && !logicalCompletion(task));
  const effective = new Map<string, PlannerTask[]>();
  const repeatedTopics = new Set<string>();
  STUDY_STREAMS.forEach((stream) => {
    const queue = incomplete.filter((task) => task.stream === stream.name).sort((a, b) => a.originalDate.localeCompare(b.originalDate));
    let effectiveDate = today;
    queue.forEach((task) => {
      const repeatDate = settings[`planner.repeat.${task.topic.id}`];
      if (repeatDate && repeatDate >= today && !repeatedTopics.has(task.topic.id)) {
        repeatedTopics.add(task.topic.id);
        const repeated = { ...task, scheduledDate: repeatDate, carriedForward: repeatDate !== task.originalDate };
        effective.set(repeatDate, [...(effective.get(repeatDate) ?? []), repeated]);
        return;
      }
      while (!isStudyDate(effectiveDate, studyDays)) effectiveDate = moveDate(effectiveDate, 1);
      const moved = { ...task, minutes: minutesForDate(effectiveDate), scheduledDate: effectiveDate, carriedForward: task.originalDate < effectiveDate };
      effective.set(effectiveDate, [...(effective.get(effectiveDate) ?? []), moved]);
      effectiveDate = moveDate(effectiveDate, 1);
    });
  });
  [...canonical.values()].flat().forEach((task) => {
    const completedOn = doneDate(task.id);
    if (completedOn) effective.set(completedOn, [...(effective.get(completedOn) ?? []), { ...task, scheduledDate: completedOn, carriedForward: false }]);
  });
  const tasksById = new Map([...canonical.values()].flat().map((task) => [task.id, task]));
  return {
    canonical,
    effective,
    tasksById,
    predictedCompletion: [...effective.entries()].flatMap(([key, tasks]) => tasks.some((task) => task.kind === "syllabus") ? [key] : []).sort().at(-1) ?? today,
    overdueCount: incomplete.filter((task) => task.originalDate < today).length,
  };
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
  const [stageFilter, setStageFilter] = useState("All stages");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chosenTopicId, setChosenTopicId] = useState<string>(TOPICS[0].id);
  const [quizTopicId, setQuizTopicId] = useState<string>(REVIEWED_QUIZ_TOPIC_IDS[0]);
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
      const data = (await response.json()) as FamilyState;
      const legacyTwoHourPlan = data.settings?.dailyMinutes === "120" && data.settings?.studyDays === "6";
      const oldWeekendStart = data.settings?.plannerStartDate === "2026-08-29";
      const migratedSettings = {
        ...data.settings,
        ...(legacyTwoHourPlan ? { dailyMinutes: "450", studyDays: "7", targetDate: "2027-02-21", examDate: "2027-05-21" } : {}),
        ...(oldWeekendStart ? { plannerStartDate: "2026-08-31" } : {}),
      };
      setFamilyState({
        progress: data.progress ?? [],
        activity: data.activity ?? [],
        attempts: data.attempts ?? [],
        settings: { ...DEFAULT_SETTINGS, ...(migratedSettings ?? {}) },
      });
      if (legacyTwoHourPlan || oldWeekendStart) {
        const changes = {
          ...(legacyTwoHourPlan ? { dailyMinutes: "450", studyDays: "7", targetDate: "2027-02-21", examDate: "2027-05-21" } : {}),
          ...(oldWeekendStart ? { plannerStartDate: "2026-08-31" } : {}),
        };
        await Promise.all(Object.entries(changes).map(([key, value]) => fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setting", key, value }) })));
      }
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

  const stats = useMemo<Stats>(() => {
    const total = TOPICS.length;
    const learned = TOPICS.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) >= 1).length;
    const practised = TOPICS.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) >= 2).length;
    const mastered = TOPICS.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) >= 3).length;
    const totalMinutes = TOPICS.reduce((sum, topic) => sum + topic.minutes, 0);
    const weighted = (minimumStage: number) => Math.round(
      (TOPICS.reduce((sum, topic) => sum + ((progressMap.get(topic.id)?.stage ?? 0) >= minimumStage ? topic.minutes : 0), 0) / totalMinutes) * 100,
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
    const remainingMinutes = TOPICS.reduce((sum, topic) => {
      const stage = progressMap.get(topic.id)?.stage ?? 0;
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
  }, [familyState.attempts, progressMap]);

  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...familyState.settings }), [familyState.settings]);
  const remindersEnabled = settings.remindersEnabled === "true" && typeof Notification !== "undefined" && Notification.permission === "granted";
  const studyDays = Number(settings.studyDays || 7);
  const availableDays = studyDaysUntil(settings.targetDate, studyDays);
  const requiredDaily = Math.ceil(stats.remainingMinutes / availableDays);
  const plannedDaily = Number(settings.dailyMinutes || 450);
  const feasible = plannedDaily >= requiredDaily;
  const todayKey = localDateKey();
  const planner = useMemo(
    () => buildPlanner(progressMap, settings, todayKey),
    [progressMap, settings, todayKey],
  );
  const streamProgress = useMemo(() => STUDY_STREAMS.map((stream) => {
    const topics = TOPICS.filter((topic) => topicStream(topic) === stream.name);
    const total = topics.reduce((sum, topic) => sum + topic.minutes, 0);
    const completed = topics.reduce((sum, topic) => sum + topic.minutes * ([0, .45, .75, 1][progressMap.get(topic.id)?.stage ?? 0] ?? 0), 0);
    return { ...stream, percent: total ? Math.round(completed / total * 100) : 0 };
  }), [progressMap]);
  const selectedPlannerTasks = selectedDate < todayKey
    ? (planner.canonical.get(selectedDate) ?? [])
    : (planner.effective.get(selectedDate) ?? []);
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
      new Notification("Talha's study plan is ready", { body: `${tasks.length} tasks · ${tasks.reduce((sum, task) => sum + task.minutes, 0)} minutes planned.` });
    }, Math.min(delay, 2_147_000_000));
    return () => window.clearTimeout(timer);
  }, [planner.effective, settings.reminderTime, settings.remindersEnabled]);

  const roadmapSubjects = useMemo<RoadmapSubject[]>(() => SUBJECTS.map((roadmapSubject) => {
    const topics = TOPICS.filter((topic) => topic.subject === roadmapSubject);
    const totalMinutes = topics.reduce((sum, topic) => sum + topic.minutes, 0);
    const completedMinutes = topics.reduce((sum, topic) => {
      const stage = progressMap.get(topic.id)?.stage ?? 0;
      return sum + topic.minutes * [0, 0.45, 0.75, 1][stage];
    }, 0);
    return {
      subject: roadmapSubject,
      totalMinutes,
      completedMinutes: Math.round(completedMinutes),
      remainingMinutes: Math.max(0, Math.round(totalMinutes - completedMinutes)),
      progress: Math.round((completedMinutes / totalMinutes) * 100),
      nextTopic: topics.find((topic) => (progressMap.get(topic.id)?.stage ?? 0) < 3),
    };
  }), [progressMap]);

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TOPICS.filter((topic) => {
      const topicStage = progressMap.get(topic.id)?.stage ?? 0;
      const matchesSubject = subject === "All" || topic.subject === subject;
      const matchesStage = stageFilter === "All stages" ||
        (stageFilter === "Revision due" ? isRevisionDue(progressMap.get(topic.id)) : STAGES[topicStage] === stageFilter);
      const matchesQuery = !query || `${topic.code} ${topic.unit} ${topic.title}`.toLowerCase().includes(query);
      return matchesSubject && matchesStage && matchesQuery;
    });
  }, [progressMap, search, stageFilter, subject]);

  const chosenTopic = TOPICS.find((topic) => topic.id === chosenTopicId) ?? TOPICS[0];
  const chosenPrerequisites = prerequisiteTopics(chosenTopic.id);
  const missingPrerequisites = chosenPrerequisites.filter(
    (topic) => (progressMap.get(topic.id)?.stage ?? 0) === 0,
  );
  const chosenLinkedNext = linkedNextTopics(chosenTopic.id);

  function revealTopic(topic: Topic) {
    setSubject(topic.subject);
    setSearch(topic.code);
    setStageFilter("All stages");
    setExpanded(topic.id);
  }

  const tests = familyState.attempts;
  const selectedTestTopic = TOPICS.find((item) => item.id === testTopicId) ?? TOPICS[0];
  const selectedTestSubject = selectedTestTopic.subject;
  const selectedProfile = SUBJECT_PROFILES[selectedTestSubject];
  const selectedEvidence = evidenceForTopic(tests, selectedTestTopic.id, selectedTestSubject);

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
      new Notification("Talha's study plan is ready", { body: `${tasks.length} tasks · ${tasks.reduce((sum, task) => sum + task.minutes, 0)} minutes planned.` });
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
    }));
    try {
      await sendUpdate({
        action: "progress",
        topicId: topic.id,
        subject: topic.subject,
        stage: safeStage,
        minutes: safeStage > (existing?.stage ?? 0) ? Math.max(15, Math.round(topic.minutes * 0.35)) : 0,
      });
      setMessage(safeStage === 0 ? "Topic reset to Not started." : "Progress saved and synchronized.");
    } catch (error) {
      setFamilyState((current) => ({
        ...current,
        progress: [
          ...current.progress.filter((item) => item.topicId !== topic.id),
          ...(existing ? [existing] : []),
        ],
      }));
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
    const previousValue = familyState.settings[key] ?? "";
    const completedDate = checked ? task.scheduledDate : "";
    setFamilyState((current) => ({ ...current, settings: { ...current.settings, [key]: completedDate } }));
    setSaving(true);
    try {
      await sendUpdate({ action: "planner", taskId: task.id, topicId: task.topic.id, subject: task.topic.subject, checked, completedDate, minutes: task.minutes });
      setMessage(checked ? "Task completed. The remaining calendar has been recalculated." : "Task reopened. Future dates have been updated.");
      if (checked && task.kind === "syllabus") {
        const topicTasks = [...planner.tasksById.values()].filter((candidate) => candidate.topic.id === task.topic.id);
        const allDone = topicTasks.every((candidate) => candidate.id === task.id || Boolean(settings[`planner.done.${candidate.id}`]));
        if (allDone && (progressMap.get(task.topic.id)?.stage ?? 0) === 0) await updateStage(task.topic, 1);
      }
    } catch (error) {
      setFamilyState((current) => ({ ...current, settings: { ...current.settings, [key]: previousValue } }));
      setMessage(error instanceof Error ? error.message : "The task was not saved.");
    } finally {
      setSaving(false);
    }
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

  async function repeatTopicLater(topic: Topic) {
    let repeatDate = moveDate(localDateKey(), 1);
    while (!isStudyDate(repeatDate, studyDays)) repeatDate = moveDate(repeatDate, 1);
    await saveSetting(`planner.repeat.${topic.id}`, repeatDate);
    setSelectedDate(repeatDate);
    setCalendarMonth(repeatDate.slice(0, 7));
    setView("calendar");
    setMessage(`${topic.title} has been moved to ${fullDateLabel(repeatDate)}.`);
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
            ["syllabus", "Syllabus", "03"], ["quizzes", "Quizzes", "04"],
            ["tests", "Tests", "05"], ["plan", "Study plan", "06"], ["parent", "Parent view", "07"],
          ] as Array<[View, string, string]>).map(([key, label, number]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{number}</span>{label}</button>
          ))}
        </nav>
        <div className="sidebar-card"><span>Exam window</span><strong>{fullDateLabel(settings.examDate)}</strong><small>{daysBetween(new Date(), new Date(`${settings.examDate}T12:00:00`))} days remaining</small></div>
        <div className="sidebar-footer"><p>Private family workspace</p><button onClick={signOut}>Sign out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">CAMBRIDGE IGCSE · FOUR SUBJECTS</span><h1>{view === "parent" ? "Parent overview" : view === "calendar" ? "Daily study calendar" : view === "syllabus" ? "Syllabus map" : view === "quizzes" ? "Topic quizzes" : view === "tests" ? "Tests & retention" : view === "plan" ? "Adaptive study plan" : `${greeting}, Talha`}</h1></div>
          <div className="account-pill"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : view === "parent" ? "Parent mode" : "Secure family access"}</small></div></div>
        </header>

        {message && <div className={`toast ${message.includes("not") || message.includes("valid") ? "error" : ""}`} role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
        {view === "today" && (
          <>
            <section className="hero-panel">
              <div><span className="eyebrow light">TODAY&apos;S DIRECTION</span><h2>One clear step.<br />Then the next.</h2><p>{stats.mastered} topics are secure and {TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id))).length} recalls are due. Complete today&apos;s focused steps to keep the full roadmap on schedule.</p><div className="hero-buttons"><button className="hero-action" onClick={() => setView("plan")}>See complete roadmap <span>→</span></button><button className="hero-secondary" onClick={() => void enableReminders()}>{remindersEnabled ? "Reminders enabled" : "Enable reminders"}</button></div></div>
              <StatRing value={stats.readiness} label="evidence readiness" />
            </section>
            <section className="section-block">
              <div className="section-heading"><div><span className="eyebrow">TODAY&apos;S CHECKLIST</span><h2>{(planner.effective.get(todayKey) ?? []).length} tasks · {(planner.effective.get(todayKey) ?? []).reduce((sum, task) => sum + task.minutes, 0)} minutes</h2></div><button className="inline-calendar-button" onClick={() => { setSelectedDate(todayKey); setCalendarMonth(todayKey.slice(0, 7)); setView("calendar"); }}>Open full calendar →</button></div>
              <div className="today-checklist">{(planner.effective.get(todayKey) ?? []).map((task) => { const checked = Boolean(settings[`planner.done.${task.id}`]); return <label className={`planner-task ${subjectClass(task.topic.subject)} ${checked ? "done" : ""}`} key={task.id}><input type="checkbox" checked={checked} disabled={saving} onChange={(event) => void togglePlannerTask(task, event.target.checked)} /><span><small>{task.topic.subject} · {task.minutes} min{task.carriedForward ? " · carried forward" : ""}</small><strong>{task.lesson.title}</strong><small>{task.lesson.objective}</small></span><button type="button" onClick={() => { revealTopic(task.topic); setView("syllabus"); }}>Study</button></label>; })}{!(planner.effective.get(todayKey) ?? []).length && <EmptyMessage>Today&apos;s work is complete. Well done—take the win and return tomorrow.</EmptyMessage>}</div>
            </section>
          </>
        )}

        {view === "calendar" && (
          <section className="calendar-layout no-top">
            <div className="calendar-summary panel">
              <div><span className="eyebrow">HOMESCHOOL STUDY PLAN</span><h2>{planner.overdueCount ? `${planner.overdueCount} missed task${planner.overdueCount === 1 ? "" : "s"} safely carried forward` : "All five streams are on schedule"}</h2><p>Monday-Saturday assigns 90 minutes per stream. Sunday assigns two hours per stream for consolidation, correction and testing. A missed stream moves its own remaining sequence forward.</p></div>
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
                  const done = tasks.filter((task) => Boolean(settings[`planner.done.${task.id}`])).length;
                  const missed = day < todayKey && tasks.some((task) => !settings[`planner.done.${task.id}`]);
                  return <button key={day} className={`${selectedDate === day ? "selected" : ""} ${day === todayKey ? "today" : ""} ${missed ? "missed" : ""}`} onClick={() => setSelectedDate(day)}><b>{Number(day.slice(-2))}</b>{tasks.length > 0 && <span>{done}/{tasks.length}</span>}</button>;
                })}</div>
              </div>
              <div className="date-tasks panel">
                <div className="section-heading"><div><span className="eyebrow">ASSIGNED TASKS</span><h2>{fullDateLabel(selectedDate)}</h2></div><strong>{selectedPlannerTasks.reduce((sum, task) => sum + task.minutes, 0)} min</strong></div>
                {STUDY_STREAMS.map((stream) => {
                  const subjectTasks = selectedPlannerTasks.filter((task) => task.stream === stream.name);
                  if (!subjectTasks.length) return null;
                  return <div className="subject-task-group" key={stream.name}><h3><i style={{ background: stream.color }} />{stream.name}<span>{subjectTasks.reduce((sum, task) => sum + task.minutes, 0)} min</span></h3>{subjectTasks.map((task) => { const checked = Boolean(settings[`planner.done.${task.id}`]); return <label className={`planner-task ${checked ? "done" : ""}`} key={task.id}><input type="checkbox" checked={checked} disabled={saving} onChange={(event) => void togglePlannerTask(task, event.target.checked)} /><span><strong>{task.lesson.title}</strong><small>{task.kind === "revision" ? "Sunday consolidation" : task.kind === "past-paper" ? (task.topic.code === "PAST PAPER" ? "Past-paper marathon" : "Topical exam practice") : `${task.topic.code} · daily lesson`} · today {task.minutes} min{task.carriedForward ? ` · moved from ${fullDateLabel(task.originalDate)}` : ""}</small><small><b>Goal:</b> {task.lesson.objective}</small><small><b>Method:</b> {task.lesson.studyMethod}</small><small><b>Practice:</b> {task.lesson.practice}</small><small><b>Recall:</b> {task.lesson.recall}</small></span><button type="button" onClick={() => { revealTopic(task.topic); setView(task.kind === "past-paper" ? "tests" : "syllabus"); }}>{task.kind === "past-paper" ? "Record" : "Open"}</button></label>; })}</div>;
                })}
                {!selectedPlannerTasks.length && <EmptyMessage>{isStudyDate(selectedDate, studyDays) ? "No task is assigned on this date." : "Rest and consolidation day. Missed work will move to the next available study day."}</EmptyMessage>}
              </div>
            </div>
            <div className="notification-settings panel"><div><span className="eyebrow">REMINDERS</span><h2>Study notification</h2><p>The browser will ask permission. On devices that restrict background web notifications, the LMS will still show overdue work when opened.</p></div><label>Reminder time<input type="time" value={settings.reminderTime} onChange={(event) => saveSetting("reminderTime", event.target.value)} /></label><button onClick={() => void enableReminders()}>{remindersEnabled ? "Send test notification" : "Enable notifications"}</button></div>
          </section>
        )}

        {view === "syllabus" && (
          <section className="section-block no-top">

            <div className="topic-chooser panel">
              <div className="topic-chooser-head">
                <div><span className="eyebrow">CHOOSE WHAT TO STUDY</span><h2>Check the learning path first</h2><p>Select any topic. The system shows the foundations Talha has already studied, anything still missing, and the topics that build on it.</p></div>
                <label><span>Topic</span><select value={chosenTopicId} onChange={(event) => setChosenTopicId(event.target.value)}>{SUBJECTS.map((item) => <optgroup key={item} label={item}>{TOPICS.filter((topic) => topic.subject === item).map((topic) => <option key={topic.id} value={topic.id}>{topic.code} · {topic.title}</option>)}</optgroup>)}</select></label>
              </div>
              <div className="path-status-row">
                <div className={missingPrerequisites.length ? "path-readiness needs-foundation" : "path-readiness ready"}>
                  <strong>{missingPrerequisites.length ? "Foundation recommended first" : "Ready to study"}</strong>
                  <span>{missingPrerequisites.length ? `${missingPrerequisites.length} linked topic${missingPrerequisites.length === 1 ? "" : "s"} not learned yet` : chosenPrerequisites.length ? "All direct prerequisites have been started" : "No prerequisite is required"}</span>
                </div>
                <button className="path-primary" onClick={() => { revealTopic(chosenTopic); if ((progressMap.get(chosenTopic.id)?.stage ?? 0) === 0) void updateStage(chosenTopic, 1); }}>Study this topic</button>
                {missingPrerequisites[0] && <button className="path-secondary" onClick={() => { setChosenTopicId(missingPrerequisites[0].id); revealTopic(missingPrerequisites[0]); }}>Learn prerequisites first</button>}
              </div>
              <div className="path-columns">
                <div><strong>Earlier knowledge needed</strong>{chosenPrerequisites.length ? <div className="path-chips">{chosenPrerequisites.map((topic) => { const stage = progressMap.get(topic.id)?.stage ?? 0; return <button key={topic.id} className={stage > 0 ? "complete" : "missing"} onClick={() => { setChosenTopicId(topic.id); revealTopic(topic); }}><span>{stage > 0 ? "✓" : "!"}</span>{topic.code} · {topic.title}<small>{STAGES[stage]}</small></button>; })}</div> : <p>No earlier topic is required. Talha can begin here.</p>}</div>
                <div><strong>Topics that use this knowledge</strong>{chosenLinkedNext.length ? <div className="path-chips">{chosenLinkedNext.map((topic) => <button key={topic.id} onClick={() => { setChosenTopicId(topic.id); revealTopic(topic); }}><span>→</span>{topic.code} · {topic.title}<small>{STAGES[progressMap.get(topic.id)?.stage ?? 0]}</small></button>)}</div> : <p>This is currently an end-point topic in its learning path.</p>}</div>
              </div>
            </div>
            <div className="metrics-row compact"><article><span>Coverage</span><strong>{stats.coverage}%</strong><small>{stats.learned}/{stats.total} topics</small></article><article><span>Practising</span><strong>{stats.practice}%</strong><small>{stats.practised} topics</small></article><article><span>Secure</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics</small></article><article><span>Remaining</span><strong>{Math.ceil(stats.remainingMinutes / 60)}h</strong><small>weighted work to Secure</small></article></div>
            <div className="filter-panel"><div className="subject-tabs"><button className={subject === "All" ? "active" : ""} onClick={() => setSubject("All")}>All <span>{TOPICS.length}</span></button>{SUBJECTS.map((item) => <button key={item} className={subject === item ? "active" : ""} onClick={() => setSubject(item)}>{SUBJECT_META[item].short} <span>{TOPICS.filter((topic) => topic.subject === item).length}</span></button>)}</div><div className="filter-controls"><label><span className="sr-only">Search syllabus</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, unit or topic" /></label><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} aria-label="Filter by status"><option>All stages</option>{STAGES.map((item) => <option key={item}>{item}</option>)}<option>Revision due</option></select><strong>{filteredTopics.length} topics</strong></div></div>
            <div className="topic-list">
              {filteredTopics.map((topic) => {
                const item = progressMap.get(topic.id); const topicStage = item?.stage ?? 0; const open = expanded === topic.id;
                const subjectMinutes = TOPICS.filter((candidate) => candidate.subject === topic.subject).reduce((sum, candidate) => sum + candidate.minutes, 0);
                const workloadShare = ((topic.minutes / subjectMinutes) * 100).toFixed(1);
                const sessions = Math.max(1, Math.ceil(topic.minutes / 45));
                const guidance = effortGuidance(item?.bestScore ?? 0, tests.find((attempt) => attempt.topicId === topic.id)?.errorCategory);
                return <article className="topic-row" key={topic.id}><button className={`stage-button ${stageClass(topicStage)}`} onClick={() => updateStage(topic, topicStage === 3 ? 3 : topicStage + 1)} aria-label={`Update ${topic.title}`}><span>{topicStage === 0 ? "" : topicStage === 3 ? "★" : "✓"}</span></button><div className="topic-main"><div className="topic-kicker"><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><span>{topic.code}</span><span>{topic.unit}</span></div><h3>{topic.title}</h3><div className="topic-meta"><span>{importanceLabel(topic.importance)} exam priority</span><span>{topic.paper}</span><span>{Math.ceil(topic.minutes / 60 * 10) / 10}h · {sessions} session{sessions === 1 ? "" : "s"}</span><span>{workloadShare}% of subject workload</span><span>{topicStage ? guidance.effort : "Not started"}</span>{hasReviewedQuiz(topic.id) && <span>Reviewed quiz ready</span>}</div>{open && <div className="topic-detail"><div><strong>How to complete it</strong><p>Learn the key idea, work through an example, practise independently, correct errors, then return for a recall check.</p></div><div><strong>What matters in the exam</strong><p>{topic.tip}</p></div><div className="topic-links"><strong>Linked learning path</strong>{prerequisiteTopics(topic.id).length ? <p>Builds on: {prerequisiteTopics(topic.id).map((linked) => linked.title).join(" · ")}</p> : <p>No earlier foundation required.</p>}{linkedNextTopics(topic.id).length > 0 && <p>Leads to: {linkedNextTopics(topic.id).map((linked) => linked.title).join(" · ")}</p>}<button onClick={() => setChosenTopicId(topic.id)}>Show full path above</button></div><div className="stuck-box"><strong>Finding this difficult?</strong><p>Choose the help that matches the problem.</p><div><button onClick={() => openPrerequisiteHelp(topic)}>I forgot an earlier idea</button><button onClick={() => openPracticeHelp(topic)}>I cannot solve questions</button><button onClick={() => void repeatTopicLater(topic)}>Repeat this later</button></div></div><a href={youtubeSearchUrl(topic)} target="_blank" rel="noreferrer">Watch a selected topic lesson ↗</a></div>}</div><div className="topic-actions"><span className={`status-pill ${stageClass(topicStage)}`}>{STAGES[topicStage]}</span>{hasReviewedQuiz(topic.id) && topicStage > 0 && <button className="quiz-row-button" onClick={() => openQuiz(topic)}>Quiz</button>}{topicStage > 0 && <button onClick={() => updateStage(topic, 0)} aria-label={`Reset ${topic.title} to Not started`}>Reset</button>}<button onClick={() => { setExpanded(open ? null : topic.id); setStuckTopicId(open ? null : topic.id); }}>{open ? "Close" : "Lesson help"}</button></div></article>;
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

        {view === "tests" && (
          <section className="evidence-layout no-top">
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

        {view === "parent" && <ParentView progressMap={progressMap} activity={familyState.activity} attempts={familyState.attempts} stats={stats} settings={settings} requiredDaily={requiredDaily} />}
      </main>
    </div>
  );
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
  return <section className="parent-layout no-top">
    <div className="metrics-row"><article><span>Syllabus covered</span><strong>{stats.coverage}%</strong><small>{stats.learned} of {stats.total} topics</small></article><article><span>Evidence Secure</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics with proof</small></article><article><span>Evidence readiness</span><strong>{stats.readiness}%</strong><small>not a predicted grade</small></article><article><span>Assessment average</span><strong>{stats.assessmentAverage || "—"}{stats.assessmentAverage ? "%" : ""}</strong><small>{stats.timedEvidence} timed attempts</small></article></div>
    <div className="parent-grid"><div className="panel activity-panel"><div className="section-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>Study consistency</h2></div><strong>{recent.reduce((sum, day) => sum + day.minutes, 0)} min</strong></div><div className="weekly-bars">{recent.map((day) => <div key={day.key}><div className="bar-track"><span style={{ height: `${Math.max(4, (day.minutes / maxMinutes) * 100)}%` }}><b>{day.minutes || ""}</b></span></div><small>{day.label}</small></div>)}</div><p className="panel-note">Daily target currently requires approximately <strong>{requiredDaily} minutes</strong> on each study day.</p></div>
      <div className="panel alert-panel"><span className="eyebrow">PARENT ATTENTION</span><h2>{overdue.length ? `${overdue.length} recalls are overdue` : "Recall schedule is clear"}</h2>{leadingErrors.length ? <><p>Most frequent sources of lost marks:</p><ul>{leadingErrors.map(([error, count]) => <li key={error}><span>{count}×</span><div><strong>{error}</strong><small>Use the correction note, then re-test on a different date.</small></div></li>)}</ul></> : overdue.length ? <ul>{overdue.slice(0, 4).map((topic) => <li key={topic.id}><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><div><strong>{topic.title}</strong><small>Last studied {dateLabel(progressMap.get(topic.id)?.lastStudiedAt)}</small></div></li>)}</ul> : <p>Run the four subject diagnostics to reveal the first performance priorities.</p>}</div></div>
    <div className="panel subject-table"><div className="section-heading"><div><span className="eyebrow">LEARNING SUPPORT TRACKER</span><h2>Progress, effort and next focus</h2></div><div className="backup-actions"><span className="quiet">Syllabus target: {fullDateLabel(settings.targetDate)}</span><a href="/api/backup">Download progress backup</a></div></div><div className="table-head"><span>Subject</span><span>Workload covered</span><span>Secure</span><span>Effort needed</span><span>Present need / next focus</span></div>{subjectStats.map((item) => { const topicMinutes = TOPICS.filter((topic) => topic.subject === item.subject).reduce((sum, topic) => sum + topic.minutes, 0); const coveredMinutes = TOPICS.filter((topic) => topic.subject === item.subject && (progressMap.get(topic.id)?.stage ?? 0) >= 1).reduce((sum, topic) => sum + topic.minutes, 0); const guidance = item.average ? effortGuidance(item.average, item.topError) : null; return <div className="table-row" key={item.subject}><strong><i style={{ background: SUBJECT_META[item.subject].color }} />{item.subject}</strong><span>{Math.round((coveredMinutes / topicMinutes) * 100)}% <small>weighted by time</small></span><span>{Math.round((item.mastered / item.total) * 100)}% <small>{item.mastered}/{item.total}</small></span><span>{guidance?.effort ?? "Starting check"}</span><span><b className={`track-pill ${item.track === "Secure progress" ? "good" : item.track === "Focused support" ? "low" : "mid"}`}>{item.track}</b><small>{item.topError}</small></span></div>; })}</div>
  </section>;
}
