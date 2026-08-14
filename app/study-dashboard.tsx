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

type View = "today" | "syllabus" | "tests" | "plan" | "parent";
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
};
type Stats = {
  total: number;
  learned: number;
  practised: number;
  mastered: number;
  coverage: number;
  practice: number;
  mastery: number;
  readiness: number;
  remainingMinutes: number;
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

function isRevisionDue(item: ProgressItem | undefined) {
  if (!item || item.stage === 0) return false;
  const wait = item.stage === 1 ? 3 : item.stage === 2 ? 7 : 21;
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
  const [subject, setSubject] = useState<SubjectName | "All">("All");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [testTopicId, setTestTopicId] = useState(TOPICS[0].id);
  const [testScore, setTestScore] = useState("");
  const [testMax, setTestMax] = useState("20");
  const [testMinutes, setTestMinutes] = useState("30");
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
    void loadFamilyState(true);
    const refresh = () => void loadFamilyState(false);
    const interval = window.setInterval(refresh, 30_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadFamilyState]);

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
    const readiness = Math.round(coverage * 0.25 + practice * 0.35 + mastery * 0.4);
    const remainingMinutes = TOPICS.reduce((sum, topic) => {
      const stage = progressMap.get(topic.id)?.stage ?? 0;
      return sum + topic.minutes * [1, 0.55, 0.25, 0][stage];
    }, 0);
    return { total, learned, practised, mastered, coverage, practice, mastery, readiness, remainingMinutes };
  }, [progressMap]);

  const settings = { ...DEFAULT_SETTINGS, ...familyState.settings };
  const studyDays = Number(settings.studyDays || 6);
  const availableDays = studyDaysUntil(settings.targetDate, studyDays);
  const requiredDaily = Math.ceil(stats.remainingMinutes / availableDays);
  const plannedDaily = Number(settings.dailyMinutes || 120);
  const feasible = plannedDaily >= requiredDaily;

  const todayTopics = useMemo(() => {
    const due = TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id))).sort(
      (a, b) => b.importance - a.importance,
    );
    const next: Topic[] = [];
    for (const itemSubject of SUBJECTS) {
      const candidate = TOPICS.find(
        (topic) => topic.subject === itemSubject && (progressMap.get(topic.id)?.stage ?? 0) < 2,
      );
      if (candidate) next.push(candidate);
    }
    for (const topic of TOPICS) {
      if (next.length >= 6) break;
      if ((progressMap.get(topic.id)?.stage ?? 0) < 2 && !next.some((item) => item.id === topic.id)) {
        next.push(topic);
      }
    }
    return [...due, ...next.filter((topic) => !due.some((dueTopic) => dueTopic.id === topic.id))].slice(0, 6);
  }, [progressMap]);

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

  const tests = familyState.activity.filter((item) => item.kind === "test");

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

  async function updateStage(topic: Topic, requestedStage: number) {
    const existing = progressMap.get(topic.id);
    const safeStage = Math.max(0, Math.min(3, requestedStage));
    if (safeStage === 3 && (existing?.bestScore ?? 0) < 80) {
      setTestTopicId(topic.id);
      setView("tests");
      setMessage("Record a score of at least 80% to demonstrate mastery.");
      return;
    }
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
      setMessage("Progress saved and synchronized.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The update was not saved.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSetting(key: string, value: string) {
    setFamilyState((current) => ({
      ...current,
      settings: { ...current.settings, [key]: value },
    }));
    try {
      await sendUpdate({ action: "setting", key, value });
      setMessage("Plan updated and synchronized.");
    } catch (error) {
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
      const percentage = Math.round((score / maxScore) * 100);
      const awardedStage = percentage >= 80 ? 3 : percentage >= 60 ? 2 : 1;
      const now = new Date().toISOString();
      await sendUpdate({ action: "test", topicId: topic.id, subject: topic.subject, score, maxScore, minutes: Number(testMinutes || 0), note: testNote });
      const existing = progressMap.get(topic.id);
      const newProgress: ProgressItem = {
        topicId: topic.id,
        stage: Math.max(existing?.stage ?? 0, awardedStage),
        bestScore: Math.max(existing?.bestScore ?? 0, percentage),
        lastStudiedAt: now,
        updatedAt: now,
      };
      const temporaryResult: ActivityItem = {
        id: Date.now(), topicId: topic.id, subject: topic.subject, kind: "test",
        stage: awardedStage, score, maxScore, minutes: Number(testMinutes || 0), note: testNote, createdAt: now,
      };
      setFamilyState((current) => ({
        ...current,
        progress: [...current.progress.filter((item) => item.topicId !== topic.id), newProgress],
        activity: [temporaryResult, ...current.activity],
      }));
      setTestScore("");
      setTestNote("");
      setMessage(percentage >= 80 ? `${percentage}% - topic mastered.` : `${percentage}% - revision has been scheduled.`);
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
            ["tests", "Tests", "03"], ["plan", "Study plan", "04"],
            ["parent", "Parent view", "05"],
          ] as Array<[View, string, string]>).map(([key, label, number]) => (
            <button key={key} className={view === key ? "active" : ""} onClick={() => setView(key)}><span>{number}</span>{label}</button>
          ))}
        </nav>
        <div className="sidebar-card"><span>Exam window</span><strong>{fullDateLabel(settings.examDate)}</strong><small>{daysBetween(new Date(), new Date(`${settings.examDate}T12:00:00`))} days remaining</small></div>
        <div className="sidebar-footer"><p>Private family workspace</p><button onClick={signOut}>Sign out</button></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><span className="eyebrow">CAMBRIDGE IGCSE · FOUR SUBJECTS</span><h1>{view === "parent" ? "Parent overview" : view === "syllabus" ? "Syllabus map" : view === "tests" ? "Tests & retention" : view === "plan" ? "Adaptive study plan" : "Good morning, Talha"}</h1></div>
          <div className="account-pill"><span>{displayName.slice(0, 1).toUpperCase()}</span><div><strong>{displayName}</strong><small>{lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : view === "parent" ? "Parent mode" : "Secure family access"}</small></div></div>
        </header>

        {message && <div className={`toast ${message.includes("not") || message.includes("valid") ? "error" : ""}`} role="status">{message}<button onClick={() => setMessage("")} aria-label="Dismiss">×</button></div>}
        {view === "today" && (
          <>
            <section className="hero-panel">
              <div><span className="eyebrow light">TODAY&apos;S DIRECTION</span><h2>Learn it. Prove it.<br />Remember it.</h2><p>{stats.mastered} topics mastered, {TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id))).length} revisions due. The plan adjusts as results are recorded.</p><button className="hero-action" onClick={() => setView("syllabus")}>Open full syllabus <span>→</span></button></div>
              <StatRing value={stats.readiness} label="readiness" />
            </section>
            <section className="section-block">
              <div className="section-heading"><div><span className="eyebrow">TODAY&apos;S QUEUE</span><h2>Six focused study blocks</h2></div><span className="quiet">Tap once after honest work</span></div>
              <div className="today-grid">
                {todayTopics.map((topic) => {
                  const item = progressMap.get(topic.id);
                  const topicStage = item?.stage ?? 0;
                  return <article className={`focus-card ${subjectClass(topic.subject)}`} key={topic.id}><div className="card-top"><span>{SUBJECT_META[topic.subject].short} · {topic.code}</span>{isRevisionDue(item) && <b>REVISION DUE</b>}</div><h3>{topic.title}</h3><p>{topic.tip}</p><div className="card-bottom"><span>{topic.minutes} min total</span><button disabled={saving} onClick={() => updateStage(topic, Math.min(3, topicStage + 1))}>{topicStage === 0 ? "Mark learned" : topicStage === 1 ? "Mark practised" : topicStage === 2 ? "Prove mastery" : "Review again"}</button></div></article>;
                })}
              </div>
            </section>
          </>
        )}

        {view === "syllabus" && (
          <section className="section-block no-top">
            <div className="metrics-row compact"><article><span>Coverage</span><strong>{stats.coverage}%</strong><small>{stats.learned}/{stats.total} topics</small></article><article><span>Practised</span><strong>{stats.practice}%</strong><small>{stats.practised} topics</small></article><article><span>Mastered</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics</small></article><article><span>Remaining</span><strong>{Math.ceil(stats.remainingMinutes / 60)}h</strong><small>to mastery</small></article></div>
            <div className="filter-panel"><div className="subject-tabs"><button className={subject === "All" ? "active" : ""} onClick={() => setSubject("All")}>All <span>{TOPICS.length}</span></button>{SUBJECTS.map((item) => <button key={item} className={subject === item ? "active" : ""} onClick={() => setSubject(item)}>{SUBJECT_META[item].short} <span>{TOPICS.filter((topic) => topic.subject === item).length}</span></button>)}</div><div className="filter-controls"><label><span className="sr-only">Search syllabus</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search code, unit or topic" /></label><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} aria-label="Filter by status"><option>All stages</option>{STAGES.map((item) => <option key={item}>{item}</option>)}<option>Revision due</option></select><strong>{filteredTopics.length} topics</strong></div></div>
            <div className="topic-list">
              {filteredTopics.map((topic) => {
                const item = progressMap.get(topic.id); const topicStage = item?.stage ?? 0; const open = expanded === topic.id;
                return <article className="topic-row" key={topic.id}><button className={`stage-button ${stageClass(topicStage)}`} onClick={() => updateStage(topic, topicStage === 3 ? 3 : topicStage + 1)} aria-label={`Update ${topic.title}`}><span>{topicStage === 0 ? "" : topicStage === 3 ? "★" : "✓"}</span></button><div className="topic-main"><div className="topic-kicker"><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><span>{topic.code}</span><span>{topic.unit}</span></div><h3>{topic.title}</h3><div className="topic-meta"><span>{importanceLabel(topic.importance)}</span><span>{topic.paper}</span><span>{topic.minutes} min</span><span>{item?.bestScore != null ? `Best ${item.bestScore}%` : "No test yet"}</span></div>{open && <div className="topic-detail"><div><strong>Examiner habit</strong><p>{topic.tip}</p></div><div><strong>Past-paper evidence</strong><p>Paper coverage is shown. Exact appearance counts will only be added after paper-by-paper tagging; no frequency has been guessed.</p></div><a href={youtubeSearchUrl(topic)} target="_blank" rel="noreferrer">Find a topic lesson on YouTube ↗</a></div>}</div><div className="topic-actions"><span className={`status-pill ${stageClass(topicStage)}`}>{STAGES[topicStage]}</span><button onClick={() => setExpanded(open ? null : topic.id)}>{open ? "Close" : "Help"}</button></div></article>;
              })}
              {filteredTopics.length === 0 && <EmptyMessage>No topics match these filters.</EmptyMessage>}
            </div>
          </section>
        )}

        {view === "tests" && (
          <section className="two-column-section no-top">
            <form className="test-form panel" onSubmit={recordTest}><span className="eyebrow">RECORD EVIDENCE</span><h2>Add a test result</h2><p>A score of 80% or more awards mastery. Lower scores schedule more revision.</p><label>Subject<select value={TOPICS.find((item) => item.id === testTopicId)?.subject ?? "Chemistry"} onChange={(event) => { const first = TOPICS.find((item) => item.subject === event.target.value); if (first) setTestTopicId(first.id); }}>{SUBJECTS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Topic<select value={testTopicId} onChange={(event) => setTestTopicId(event.target.value)}>{TOPICS.filter((item) => item.subject === (TOPICS.find((topic) => topic.id === testTopicId)?.subject ?? "Chemistry")).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title}</option>)}</select></label><div className="form-row"><label>Marks obtained<input inputMode="decimal" value={testScore} onChange={(event) => setTestScore(event.target.value)} placeholder="16" /></label><label>Out of<input inputMode="decimal" value={testMax} onChange={(event) => setTestMax(event.target.value)} /></label></div><label>Minutes<input inputMode="numeric" value={testMinutes} onChange={(event) => setTestMinutes(event.target.value)} /></label><label>What caused lost marks?<textarea value={testNote} onChange={(event) => setTestNote(event.target.value)} placeholder="Knowledge gap, misread question, method, calculation or timing..." /></label><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save result"}</button></form>
            <div className="panel results-panel"><div className="section-heading"><div><span className="eyebrow">RECENT RESULTS</span><h2>Retention record</h2></div><strong>{tests.length} tests</strong></div><div className="result-list">{tests.length ? tests.slice(0, 12).map((result) => { const topic = TOPICS.find((item) => item.id === result.topicId); const percentage = result.maxScore ? Math.round(((result.score ?? 0) / result.maxScore) * 100) : 0; return <article key={result.id}><div className={`score-disc ${percentage >= 80 ? "good" : percentage >= 60 ? "mid" : "low"}`}>{percentage}%</div><div><span>{result.subject} · {dateLabel(result.createdAt)}</span><h3>{topic?.title ?? "Recorded test"}</h3><p>{result.score}/{result.maxScore} marks · {result.minutes ?? 0} min{result.note ? ` · ${result.note}` : ""}</p></div></article>; }) : <EmptyMessage>No test has been recorded yet.</EmptyMessage>}</div></div>
          </section>
        )}

        {view === "plan" && (
          <section className="plan-layout no-top">
            <div className="panel plan-settings"><span className="eyebrow">YOUR CAPACITY</span><h2>Set the finish line</h2><p>Changes recalculate the remaining daily workload instantly.</p><label>First syllabus completion date<input type="date" value={settings.targetDate} onChange={(event) => saveSetting("targetDate", event.target.value)} /></label><label>Final examination date<input type="date" value={settings.examDate} onChange={(event) => saveSetting("examDate", event.target.value)} /></label><div className="form-row"><label>Study days each week<input type="number" min="1" max="7" value={settings.studyDays} onChange={(event) => saveSetting("studyDays", event.target.value)} /></label><label>Minutes available daily<input type="number" min="15" max="600" step="15" value={settings.dailyMinutes} onChange={(event) => saveSetting("dailyMinutes", event.target.value)} /></label></div></div>
            <div className={`capacity-card ${feasible ? "feasible" : "behind"}`}><span className="eyebrow light">PLAN CHECK</span><h2>{feasible ? "The plan is achievable." : "More time is needed."}</h2><p>{Math.ceil(stats.remainingMinutes / 60)} hours of weighted work remain across learning, practice and mastery.</p><div className="capacity-numbers"><div><span>Required daily</span><strong>{requiredDaily}<small> min</small></strong></div><div><span>Available daily</span><strong>{plannedDaily}<small> min</small></strong></div><div><span>Study days left</span><strong>{availableDays}</strong></div></div><p className="capacity-advice">{feasible ? `At this pace, Talha has a ${plannedDaily - requiredDaily}-minute daily buffer for missed work and revision.` : `Add ${requiredDaily - plannedDaily} minutes per study day, add study days, or move the completion date.`}</p></div>
            <div className="panel method-panel"><span className="eyebrow">DAILY METHOD</span><h2>One session, four moves</h2><ol><li><span>01</span><div><strong>Learn</strong><p>Understand the exact syllabus objective using notes, a lesson or worked example.</p></div></li><li><span>02</span><div><strong>Retrieve</strong><p>Close the material and explain the idea from memory.</p></div></li><li><span>03</span><div><strong>Practise</strong><p>Answer marked questions without looking at the solution.</p></div></li><li><span>04</span><div><strong>Correct</strong><p>Record why marks were lost and schedule the next retrieval.</p></div></li></ol></div>
          </section>
        )}

        {view === "parent" && <ParentView progressMap={progressMap} activity={familyState.activity} stats={stats} settings={settings} requiredDaily={requiredDaily} />}
      </main>
    </div>
  );
}

function ParentView({ progressMap, activity, stats, settings, requiredDaily }: { progressMap: Map<string, ProgressItem>; activity: ActivityItem[]; stats: Stats; settings: Record<string, string>; requiredDaily: number }) {
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
    const tested = topics.filter((topic) => progressMap.get(topic.id)?.bestScore != null);
    const average = tested.length ? Math.round(tested.reduce((sum, topic) => sum + (progressMap.get(topic.id)?.bestScore ?? 0), 0) / tested.length) : 0;
    return { subject, total: topics.length, covered, mastered, average };
  });
  const overdue = TOPICS.filter((topic) => isRevisionDue(progressMap.get(topic.id)));
  return <section className="parent-layout no-top">
    <div className="metrics-row"><article><span>Syllabus covered</span><strong>{stats.coverage}%</strong><small>{stats.learned} of {stats.total} topics</small></article><article><span>Evidence mastered</span><strong>{stats.mastery}%</strong><small>{stats.mastered} topics</small></article><article><span>Readiness score</span><strong>{stats.readiness}%</strong><small>coverage + practice + mastery</small></article><article><span>Revision overdue</span><strong>{overdue.length}</strong><small>topics requiring recall</small></article></div>
    <div className="parent-grid"><div className="panel activity-panel"><div className="section-heading"><div><span className="eyebrow">LAST 7 DAYS</span><h2>Study consistency</h2></div><strong>{recent.reduce((sum, day) => sum + day.minutes, 0)} min</strong></div><div className="weekly-bars">{recent.map((day) => <div key={day.key}><div className="bar-track"><span style={{ height: `${Math.max(4, (day.minutes / maxMinutes) * 100)}%` }}><b>{day.minutes || ""}</b></span></div><small>{day.label}</small></div>)}</div><p className="panel-note">Daily target currently requires approximately <strong>{requiredDaily} minutes</strong> on each study day.</p></div>
      <div className="panel alert-panel"><span className="eyebrow">PARENT ATTENTION</span><h2>{overdue.length ? `${overdue.length} revisions need attention` : "No overdue revisions"}</h2>{overdue.length ? <ul>{overdue.slice(0, 5).map((topic) => <li key={topic.id}><span className={subjectClass(topic.subject)}>{SUBJECT_META[topic.subject].short}</span><div><strong>{topic.title}</strong><small>Last studied {dateLabel(progressMap.get(topic.id)?.lastStudiedAt)}</small></div></li>)}</ul> : <p>Once topics are studied, this panel will flag knowledge that is becoming overdue for retrieval.</p>}</div></div>
    <div className="panel subject-table"><div className="section-heading"><div><span className="eyebrow">SUBJECT HEALTH</span><h2>Coverage versus demonstrated performance</h2></div><div className="backup-actions"><span className="quiet">Target: {fullDateLabel(settings.targetDate)}</span><a href="/api/backup">Download progress backup</a></div></div><div className="table-head"><span>Subject</span><span>Coverage</span><span>Mastered</span><span>Test average</span></div>{subjectStats.map((item) => <div className="table-row" key={item.subject}><strong><i style={{ background: SUBJECT_META[item.subject].color }} />{item.subject}</strong><span>{Math.round((item.covered / item.total) * 100)}% <small>{item.covered}/{item.total}</small></span><span>{Math.round((item.mastered / item.total) * 100)}% <small>{item.mastered}/{item.total}</small></span><span>{item.average ? `${item.average}%` : "No tests"}</span></div>)}</div>
  </section>;
}
