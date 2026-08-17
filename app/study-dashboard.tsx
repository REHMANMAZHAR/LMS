"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  STAGES,
  SUBJECT_META,
  SUBJECTS,
  TOPICS,
  SubjectName,
  Topic,
  youtubeSearchUrl,
} from "./data";
import {
  ASSESSMENT_TYPES,
  ERROR_CATEGORIES,
  SUBJECT_PROFILES,
  AssessmentAttempt,
  AssessmentType,
  ErrorCategory,
  evidenceForTopic,
  gradeBand,
  percentage,
  subjectThreshold,
} from "./learning-model";
import QuizView from "./quiz-view";
import { REVIEWED_QUIZ_TOPIC_IDS, hasReviewedQuiz, type QuizResultPayload } from "./quiz-model";

type View = "today" | "syllabus" | "quizzes" | "tests" | "plan" | "parent";
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
type Mission = {
  topic: Topic;
  label: string;
  reason: string;
  minutes: number;
  action: "learn" | "practise" | "test" | "correct";
};

const DEFAULT_SETTINGS: Record<string, string> = {
  targetDate: "2027-02-15",
  examDate: "2027-05-01",
  dailyMinutes: "120",
  studyDays: "6",
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
  const [rotationIndex, setRotationIndex] = useState(0);
  const [subject, setSubject] = useState<SubjectName | "All">("All");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
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

  const loadFamilyState = useCallback(async (showError = false) => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.status === 401) {
        window.location.reload();
        return;
      }
      if (!response.ok) throw new Error("Progress could not be synchronized.");
      const data = (await response.json()) as FamilyState;
      setFamilyState({
        progress: data.progress ?? [],
        activity: data.activity ?? [],
        attempts: data.attempts ?? [],
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
      setRotationIndex(new Date().getDate() % 3);
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
    const coverage = Math.round((learned / total) * 100);
    const practice = Math.round((practised / total) * 100);
    const mastery = Math.round((mastered / total) * 100);
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

  const settings = { ...DEFAULT_SETTINGS, ...familyState.settings };
  const studyDays = Number(settings.studyDays || 6);
  const availableDays = studyDaysUntil(settings.targetDate, studyDays);
  const requiredDaily = Math.ceil(stats.remainingMinutes / availableDays);
  const plannedDaily = Number(settings.dailyMinutes || 120);
  const feasible = plannedDaily >= requiredDaily;

  const todayMissions = useMemo<Mission[]>(() => {
    const selected = new Set<string>();
    const missions: Mission[] = [];
    const budgetParts = [0.17, 0.33, 0.33, 0.17].map((share) =>
      Math.max(10, Math.round((plannedDaily * share) / 5) * 5),
    );
    const take = (
      candidates: Topic[],
      label: string,
      reason: string,
      action?: Mission["action"],
    ) => {
      const topic = candidates.find((candidate) => !selected.has(candidate.id));
      if (!topic) return;
      selected.add(topic.id);
      const stage = progressMap.get(topic.id)?.stage ?? 0;
      missions.push({
        topic,
        label,
        reason,
        minutes: budgetParts[missions.length] ?? 20,
        action: action ?? (stage === 0 ? "learn" : stage === 1 ? "practise" : "test"),
      });
    };

    const prioritySort = (a: Topic, b: Topic) => {
      const stageDifference = (progressMap.get(a.id)?.stage ?? 0) - (progressMap.get(b.id)?.stage ?? 0);
      return stageDifference || b.importance - a.importance;
    };
    const due = TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id))).sort(prioritySort);
    const unfinishedMath = TOPICS.filter(
      (topic) => topic.subject === "Mathematics" && (progressMap.get(topic.id)?.stage ?? 0) < 3,
    ).sort(prioritySort);
    const rotatingSubjects: SubjectName[] = ["Chemistry", "Pakistan Studies", "Islamiyat"];
    const rotatingSubject = rotatingSubjects[rotationIndex % rotatingSubjects.length];
    const rotatingTopics = TOPICS.filter(
      (topic) => topic.subject === rotatingSubject && (progressMap.get(topic.id)?.stage ?? 0) < 3,
    ).sort(prioritySort);
    const recentErrorTopicIds = familyState.attempts
      .filter((attempt) => attempt.errorCategory && attempt.errorCategory !== "No major error")
      .map((attempt) => attempt.topicId)
      .filter((topicId): topicId is string => Boolean(topicId));
    const correctionTopics = recentErrorTopicIds
      .map((topicId) => TOPICS.find((topic) => topic.id === topicId))
      .filter((topic): topic is Topic => Boolean(topic));

    take(due, "Recall", "Revision is due now", "practise");
    take(unfinishedMath, "Math priority", "Math receives 40% while moving from C to A* range");
    take(rotatingTopics, `${SUBJECT_META[rotatingSubject].short} rotation`, "Balanced A* coverage across the other three subjects");
    take(correctionTopics, "Correct", "Repair a recently recorded source of lost marks", "correct");

    const fallback = TOPICS.filter((topic) => (progressMap.get(topic.id)?.stage ?? 0) < 3).sort(prioritySort);
    while (missions.length < 4) {
      const before = missions.length;
      take(fallback, "High-impact work", "Next unfinished priority in the syllabus");
      if (missions.length === before) break;
    }
    return missions;
  }, [familyState.attempts, plannedDaily, progressMap, rotationIndex]);

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

  async function handleQuizCompleted(result: QuizResultPayload) {
    await loadFamilyState(false);
    if (result.secure) {
      setMessage(`${result.percentage}% — this topic is now Secure with repeated, timed evidence.`);
    } else if (result.passed) {
      setMessage(`${result.percentage}% — quiz passed. The topic is now Practising; re-test on another date for Secure.`);
    } else {
      setMessage(`${result.percentage}% — review the corrections, then retry the quiz.`);
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
      const evidencePasses = Number(result.evidencePasses ?? 0);
      const hasTimedPass = result.hasTimedPass === true;
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
      if (secure) {
        setMessage(`${resultPercentage}% — topic is Secure with repeated, timed evidence.`);
      } else if (resultPercentage >= subjectThreshold(topic.subject)) {
        setMessage(
          `${resultPercentage}% — secure evidence ${evidencePasses}/2${hasTimedPass ? " with timed proof" : "; one pass must be timed"}.`,
        );
      } else {
        setMessage(`${resultPercentage}% — the lost-mark category has been added to the correction plan.`);
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
            ["today", "Today", "01"], ["syllabus", "Syllabus", "02"],
            ["quizzes", "Quizzes", "03"], ["tests", "Tests", "04"],
            ["plan", "Study plan", "05"], ["parent", "Parent view", "06"],
          ] as Array<[View, string, string]>).map(([key, label, number]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{number}</span>{label}</button>
          ))}
        </nav>
        <div className="sidebar-card"><span>Exam window</span><strong>{fullDateLabel(settings.examDate)}</strong><small>{daysBetween(new Date(), new Date(`${settings.examDate}T12:00:00`))} days remaining</small></div>
        <div className="sidebar-footer"><p>Private family workspace</p><button onClick={signOut}>Sign out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">CAMBRIDGE IGCSE · FOUR SUBJECTS</span><h1>{view === "parent" ? "Parent overview" : view === "syllabus" ? "Syllabus map" : view === "quizzes" ? "Topic quizzes" : view === "tests" ? "Tests & retention" : view === "plan" ? "Adaptive study plan" : `${greeting}, Talha`}</h1></div>
          <div className="account-pill"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : view === "parent" ? "Parent mode" : "Secure family access"}</small></div></div>
        </header>

        {message && <div className={`toast ${message.includes("not") || message.includes("valid") ? "error" : ""}`} role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
        {view === "today" && (
          <>
            <section className="hero-panel">
              <div><span className="eyebrow light">TODAY&apos;S A* DIRECTION</span><h2>Learn it. Prove it.<br />Keep it.</h2><p>{stats.mastered} topics are secure, {TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id))).length} recalls are due, and Math receives extra priority while moving from C toward A* standard.</p><button className="hero-action" onClick={() => setView("tests")}>Record diagnostic evidence <span>→</span></button></div>
              <StatRing value={stats.readiness} label="evidence readiness" />
            </section>
            <section className="section-block">
              <div className="section-heading"><div><span className="eyebrow">TODAY&apos;S MISSIONS</span><h2>Four focused blocks · {todayMissions.reduce((sum, mission) => sum + mission.minutes, 0)} minutes</h2></div><span className="quiet">Recall · priority · exam work · correction</span></div>
              <div className="today-grid">
                {todayMissions.map((mission) => {
                  const topic = mission.topic;
                  const item = progressMap.get(topic.id);
                  const topicStage = item?.stage ?? 0;
                  const reviewedQuiz = hasReviewedQuiz(topic.id);
                  const actionLabel = topicStage === 0
                    ? "Mark learning"
                    : topicStage === 1 && reviewedQuiz
                      ? "Take quiz"
                      : "Record evidence";
                  return <article className={`focus-card ${subjectClass(topic.subject)}`} key={`${mission.label}-${topic.id}`}><div className="card-top"><span>{mission.label} · {SUBJECT_META[topic.subject].short} {topic.code}</span>{isRevisionDue(item) && <b>RECALL DUE</b>}</div><h3>{topic.title}</h3><p className="mission-reason">{mission.reason}</p><p>{topic.tip}</p><div className="card-bottom"><span>{mission.minutes} min today</span><button disabled={saving} onClick={() => { if (topicStage === 1 && reviewedQuiz) { openQuiz(topic); } else if (mission.action === "test" || mission.action === "correct" || topicStage >= 1) { setTestTopicId(topic.id); setTestPaper(SUBJECT_PROFILES[topic.subject].papers[0]); setView("tests"); setMessage(`Record evidence after completing ${topic.title}.`); } else { void updateStage(topic, 1); } }}>{actionLabel}</button></div></article>;
                })}
              </div>
            </section>
          </>
        )}

        {view === "syllabus" && (
          <section className="section-block no-top">
            <div className="metrics-row compact"><article><span>Coverage</span><strong>{stats.coverage}%</strong><small>{stats.learned}/{stats.total} topics</small></article><article><span>Practising</span><strong>{stats.practice}%</strong><small>{stats.practised} topics</small></article><article><span>Secure</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics</small></article><article><span>Remaining</span><strong>{Math.ceil(stats.remainingMinutes / 60)}h</strong><small>weighted work to Secure</small></article></div>
            <div className="filter-panel"><div className="subject-tabs"><button className={subject === "All" ? "active" : ""} onClick={() => setSubject("All")}>All <span>{TOPICS.length}</span></button>{SUBJECTS.map((item) => <button key={item} className={subject === item ? "active" : ""} onClick={() => setSubject(item)}>{SUBJECT_META[item].short} <span>{TOPICS.filter((topic) => topic.subject === item).length}</span></button>)}</div><div className="filter-controls"><label><span className="sr-only">Search syllabus</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, unit or topic" /></label><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} aria-label="Filter by status"><option>All stages</option>{STAGES.map((item) => <option key={item}>{item}</option>)}<option>Revision due</option></select><strong>{filteredTopics.length} topics</strong></div></div>
            <div className="topic-list">
              {filteredTopics.map((topic) => {
                const item = progressMap.get(topic.id); const topicStage = item?.stage ?? 0; const open = expanded === topic.id; const evidence = evidenceForTopic(tests, topic.id, topic.subject);
                return <article className="topic-row" key={topic.id}><button className={`stage-button ${stageClass(topicStage)}`} onClick={() => updateStage(topic, topicStage === 3 ? 3 : topicStage + 1)} aria-label={`Update ${topic.title}`}><span>{topicStage === 0 ? "" : topicStage === 3 ? "★" : "✓"}</span></button><div className="topic-main"><div className="topic-kicker"><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><span>{topic.code}</span><span>{topic.unit}</span></div><h3>{topic.title}</h3><div className="topic-meta"><span>{importanceLabel(topic.importance)}</span><span>{topic.paper}</span><span>{topic.minutes} min</span><span>{item?.bestScore != null ? `Best ${item.bestScore}%` : "No evidence yet"}</span><span>Secure proof {evidence.passes}/2 · {evidence.hasTimed ? "timed ✓" : "timed needed"}</span>{hasReviewedQuiz(topic.id) && <span>Reviewed quiz ready</span>}</div>{open && <div className="topic-detail"><div><strong>Examiner habit</strong><p>{topic.tip}</p></div><div><strong>Secure evidence rule</strong><p>Reach at least {evidence.target}% twice on different dates. At least one qualifying result must be completed under timed conditions.</p></div><a href={youtubeSearchUrl(topic)} target="_blank" rel="noreferrer">Find a topic lesson on YouTube ↗</a></div>}</div><div className="topic-actions"><span className={`status-pill ${stageClass(topicStage)}`}>{STAGES[topicStage]}</span>{hasReviewedQuiz(topic.id) && topicStage > 0 && <button className="quiz-row-button" onClick={() => openQuiz(topic)}>Quiz</button>}{topicStage > 0 && <button onClick={() => updateStage(topic, 0)} aria-label={`Reset ${topic.title} to Not started`}>Reset</button>}<button onClick={() => setExpanded(open ? null : topic.id)}>{open ? "Close" : "Help"}</button></div></article>;
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
                return <article key={item} className={subjectClass(item)}><div><span>{SUBJECT_META[item].short} · {SUBJECT_META[item].code}</span><strong>{profile.baselineGrade} → {profile.targetGrade}</strong></div><p>{average == null ? "Diagnostic needed" : `${average}% evidence average · ${gradeBand(average)}`}</p><button onClick={() => { const first = TOPICS.find((topic) => topic.subject === item); if (first) { setTestTopicId(first.id); setTestPaper(profile.papers[0]); setTestType("Diagnostic"); } }}>Record {subjectAttempts.length ? "more" : "diagnostic"}</button></article>;
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
              <div className="panel results-panel"><div className="section-heading"><div><span className="eyebrow">RECENT EVIDENCE</span><h2>Performance & errors</h2></div><strong>{tests.length} attempts</strong></div><div className="result-list">{tests.length ? tests.slice(0, 14).map((result) => { const topic = TOPICS.find((item) => item.id === result.topicId); const resultPercentage = percentage(result.score, result.maxScore); return <article key={result.id}><div className={`score-disc ${resultPercentage >= subjectThreshold(result.subject) ? "good" : resultPercentage >= 60 ? "mid" : "low"}`}>{resultPercentage}%</div><div><span>{result.subject} · {result.assessmentType} · {dateLabel(result.createdAt)}{result.timed ? " · timed" : ""}</span><h3>{topic?.title ?? "Recorded assessment"}</h3><p>{result.score}/{result.maxScore} marks · {result.minutes ?? 0} min · {result.paper ?? "Component not set"}</p><p className="error-tag">{result.errorCategory ?? "No error category"}{result.note ? ` · ${result.note}` : ""}</p></div></article>; }) : <EmptyMessage>Start with the four diagnostics above. The system will then expose the weakest mark-loss patterns.</EmptyMessage>}</div></div>
            </div>
          </section>
        )}

        {view === "plan" && (
          <section className="plan-layout no-top">
            <div className="panel plan-settings"><span className="eyebrow">YOUR CAPACITY</span><h2>Set the finish line</h2><p>Changes recalculate the remaining daily workload instantly.</p><label>First syllabus completion date<input type="date" value={settings.targetDate} onChange={(event) => saveSetting("targetDate", event.target.value)} /></label><label>Final examination date<input type="date" value={settings.examDate} onChange={(event) => saveSetting("examDate", event.target.value)} /></label><div className="form-row"><label>Study days each week<input type="number" min="1" max="7" value={settings.studyDays} onChange={(event) => saveSetting("studyDays", event.target.value)} /></label><label>Minutes available daily<input type="number" min="15" max="600" step="15" value={settings.dailyMinutes} onChange={(event) => saveSetting("dailyMinutes", event.target.value)} /></label></div></div>
            <div className={`capacity-card ${feasible ? "feasible" : "behind"}`}><span className="eyebrow light">PLAN CHECK</span><h2>{feasible ? "The plan is achievable." : "More time is needed."}</h2><p>{Math.ceil(stats.remainingMinutes / 60)} hours of weighted work remain across learning, practice and secure evidence.</p><div className="capacity-numbers"><div><span>Required daily</span><strong>{requiredDaily}<small> min</small></strong></div><div><span>Available daily</span><strong>{plannedDaily}<small> min</small></strong></div><div><span>Study days left</span><strong>{availableDays}</strong></div></div><p className="capacity-advice">{feasible ? `At this pace, Talha has a ${plannedDaily - requiredDaily}-minute daily buffer for timed papers, corrections and missed work.` : `Add ${requiredDaily - plannedDaily} minutes per study day, add study days, or move the completion date.`}</p></div>
            <div className="panel subject-strategy"><div className="section-heading"><div><span className="eyebrow">PROVISIONAL BASELINE</span><h2>Subject allocation until diagnostics replace estimates</h2></div><span className="quiet">Math C · Chemistry, Pakistan Studies and Islamiyat B</span></div><div className="strategy-grid">{SUBJECTS.map((item) => { const profile = SUBJECT_PROFILES[item]; return <article key={item}><div className="strategy-title"><i style={{ background: SUBJECT_META[item].color }} /><strong>{item}</strong><span>{profile.weeklyShare}% of study time</span></div><p><b>{profile.baselineGrade} → {profile.targetGrade}</b> · secure threshold {profile.secureThreshold}%</p><p>{profile.diagnostic}</p><small>{profile.examHabit}</small></article>; })}</div></div>
            <div className="panel method-panel"><span className="eyebrow">DAILY A* METHOD</span><h2>One session, five moves</h2><ol><li><span>01</span><div><strong>Recall</strong><p>Retrieve yesterday&apos;s and due material without notes.</p></div></li><li><span>02</span><div><strong>Learn</strong><p>Understand one exact syllabus objective or worked method.</p></div></li><li><span>03</span><div><strong>Practise</strong><p>Answer marked exam questions without looking at solutions.</p></div></li><li><span>04</span><div><strong>Correct</strong><p>Classify every lost mark and write the corrected response.</p></div></li><li><span>05</span><div><strong>Re-test</strong><p>Return on a different date; one qualifying pass must be timed.</p></div></li></ol></div>
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
      ? "Diagnostic needed"
      : average >= profile.secureThreshold && secureRate >= 60
        ? "On A* track"
        : average >= 70
          ? "Developing"
          : "Priority rebuild";
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
    <div className="panel subject-table"><div className="section-heading"><div><span className="eyebrow">A* TRACKER</span><h2>Baseline, proof and next focus</h2></div><div className="backup-actions"><span className="quiet">Syllabus target: {fullDateLabel(settings.targetDate)}</span><a href="/api/backup">Download progress backup</a></div></div><div className="table-head"><span>Subject</span><span>Baseline → target</span><span>Secure</span><span>Evidence</span><span>Status / next focus</span></div>{subjectStats.map((item) => <div className="table-row" key={item.subject}><strong><i style={{ background: SUBJECT_META[item.subject].color }} />{item.subject}</strong><span>{item.profile.baselineGrade} → {item.profile.targetGrade}</span><span>{Math.round((item.mastered / item.total) * 100)}% <small>{item.mastered}/{item.total}</small></span><span>{item.average ? `${item.average}%` : "No diagnostic"}</span><span><b className={`track-pill ${item.track === "On A* track" ? "good" : item.track === "Priority rebuild" ? "low" : "mid"}`}>{item.track}</b><small>{item.topError}</small></span></div>)}</div>
  </section>;
}
