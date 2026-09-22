"use client";

import { FormEvent, useEffect, useState } from "react";
import type { DailyQuizResultPayload, DailyQuizSessionPayload } from "./daily-quiz-model";

type Props = { taskId: string; onClose: () => void; onCompleted: (result: DailyQuizResultPayload) => void | Promise<void> };

export default function DailyQuizView({ taskId, onClose, onCompleted }: Props) {
  const [session, setSession] = useState<DailyQuizSessionPayload | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DailyQuizResultPayload | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!session || result) return;
    const update = () => setRemaining(Math.max(0, Math.ceil((Date.parse(session.expiresAt) - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session, result]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    fetch(`/api/daily-quiz?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as DailyQuizSessionPayload & { error?: string };
        if (response.status === 401) { window.location.reload(); return; }
        if (!response.ok) throw new Error(data.error ?? "The daily check could not be started.");
        if (active) setSession(data);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "The daily check could not be started."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [taskId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session || busy) return;
    const unanswered = session.questions.filter((question) => !responses[question.id]?.trim()).length;
    setBusy(true); setError("");
    if (unanswered) {
      console.info(`Submitting with ${unanswered} skipped question${unanswered === 1 ? "" : "s"}.`);
    }
    try {
      const response = await fetch("/api/daily-quiz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.sessionId, responses }) });
      const data = await response.json() as DailyQuizResultPayload & { error?: string };
      if (response.status === 401) { window.location.reload(); return; }
      if (!response.ok) throw new Error(data.error ?? "The daily check could not be marked.");
      setResult(data); await onCompleted(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The daily check could not be marked."); }
    finally { setBusy(false); }
  }

  return <div className="daily-quiz-overlay" role="dialog" aria-modal="true" aria-label="LMS assessment">
    <div className="daily-quiz-card">
      <button type="button" className="daily-quiz-close" onClick={onClose} aria-label="Close daily check">×</button>
      {busy && !session && <div className="daily-quiz-loading"><strong>Preparing the reviewed daily check…</strong></div>}
      {error && !session && <div className="quiz-error" role="alert">{error}</div>}
      {session && !result && <form onSubmit={submit}>
        <header><span className="eyebrow">{session.mode === "weekly" ? "WHOLE WEEK TOPICS · 60-MINUTE WEEKEND QUIZ" : `${session.stream} · LESSON PRACTICE`}</span><h2>{session.lessonTitle}</h2><strong role="timer">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} remaining</strong>{remaining === 0 && <p>Time is up. You can still submit for feedback; this attempt will be recorded as untimed.</p>}<p>{session.sourceNote}</p>{Boolean(session.verifiedPastPaperReferences?.length) && <details><summary>{session.verifiedPastPaperReferences!.length} verified paper/specimen references for this lesson</summary><ul>{session.verifiedPastPaperReferences!.map((ref) => <li key={ref.reference}><a href={ref.paperUrl} target="_blank" rel="noreferrer">{ref.reference} · {ref.label}</a> <a href={ref.schemeUrl} target="_blank" rel="noreferrer">(mark scheme)</a>{ref.kind === "Specimen" ? " · specimen" : ""}</li>)}</ul></details>}{Boolean(session.missingLessons?.length) && <details><summary>{session.missingLessons!.length} lessons still need reviewed questions</summary><ul>{session.missingLessons!.map((title,index)=><li key={index}>{title}</li>)}</ul></details>}<p>{session.mode === "weekly" ? `${session.questions.length} balanced questions from the lessons completed this week. The result is saved as weekend evidence.` : `${session.questions.length} focused questions from this lesson. This result guides the next effort; it does not mark the whole syllabus topic secure.`}</p><p className="quiz-skip-note">If Talha does not know an answer, he may leave it blank. It will be saved as <strong>Skipped</strong>, not as an ordinary wrong answer.</p></header>
        <div className="daily-question-list">{session.questions.map((question) => <fieldset key={question.id} className="quiz-question">
          <legend><span>{question.number}</span>{question.prompt}</legend>
          {question.type === "choice" ? <div className="quiz-options">{question.options?.map((option) => <label key={option.id} className={responses[question.id] === option.id ? "selected" : ""}><input type="radio" name={question.id} value={option.id} checked={responses[question.id] === option.id} onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))} /><span>{option.label}</span></label>)}</div> : <label className="quiz-numeric-answer"><span>Your answer</span><div><input inputMode="decimal" value={responses[question.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))} placeholder={question.placeholder} />{question.answerSuffix && <b>{question.answerSuffix}</b>}</div></label>}
        </fieldset>)}</div>
        {error && <div className="quiz-error" role="alert">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? "Marking…" : session.mode === "weekly" ? "Submit Weekend Quiz" : "Submit Daily Check"}</button>
      </form>}
      {result && <div className="daily-quiz-results">
        <header className={result.outcome === "Ready to continue" ? "passed" : "review"}><span className="eyebrow">EFFORT GUIDANCE</span><h2>{result.outcome}</h2><p>{result.guidance}</p><strong>{session?.mode === "weekly" ? "Saved to Weekend Assessments and Parent View" : "Saved to this daily task and Parent View"}</strong></header>
        <div className="quiz-feedback-list">{result.feedback.map((item, index) => <article key={item.questionId} className={item.status === "skipped" ? "skipped" : item.correct ? "correct" : "incorrect"}><div className="feedback-mark">{item.status === "skipped" ? "—" : item.correct ? "✓" : "×"}</div><div><span>Question {index + 1} · {item.status === "skipped" ? "Skipped" : item.correct ? "Correct" : "Wrong"}</span><h3>{item.prompt}</h3>{!item.correct && <p><b>Correct answer:</b> {item.correctAnswer}</p>}<p>{item.explanation}</p></div></article>)}</div>
        <div className="daily-result-actions"><button className="secondary-button" onClick={() => { setSession(null); setResult(null); setResponses({}); setError(""); setBusy(true); fetch(`/api/daily-quiz?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as DailyQuizSessionPayload & { error?: string }; if (!response.ok) throw new Error(data.error ?? "Could not restart."); setSession(data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not restart.")).finally(() => setBusy(false)); }}>{session?.mode === "weekly" ? "Retry Weekend Quiz" : "Retry Daily Check"}</button><button className="primary-button" onClick={onClose}>{session?.mode === "weekly" ? "Return to Weekend Assessments" : "Return to Today"}</button></div>
      </div>}
    </div>
  </div>;
}

