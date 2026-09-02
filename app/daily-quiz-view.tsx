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
    if (unanswered) { setError(`Answer all three questions first. ${unanswered} remain.`); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/daily-quiz", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.sessionId, responses }) });
      const data = await response.json() as DailyQuizResultPayload & { error?: string };
      if (response.status === 401) { window.location.reload(); return; }
      if (!response.ok) throw new Error(data.error ?? "The daily check could not be marked.");
      setResult(data); await onCompleted(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The daily check could not be marked."); }
    finally { setBusy(false); }
  }

  return <div className="daily-quiz-overlay" role="dialog" aria-modal="true" aria-label="Daily lesson check">
    <div className="daily-quiz-card">
      <button type="button" className="daily-quiz-close" onClick={onClose} aria-label="Close daily check">×</button>
      {busy && !session && <div className="daily-quiz-loading"><strong>Preparing the reviewed daily check…</strong></div>}
      {error && !session && <div className="quiz-error" role="alert">{error}</div>}
      {session && !result && <form onSubmit={submit}>
        <header><span className="eyebrow">{session.stream} · DAILY CHECK</span><h2>{session.lessonTitle}</h2><p>Three short questions check today&apos;s exact lesson. This result guides the next effort; it does not mark the whole syllabus topic secure.</p></header>
        <div className="daily-question-list">{session.questions.map((question) => <fieldset key={question.id} className="quiz-question">
          <legend><span>{question.number}</span>{question.prompt}</legend>
          {question.type === "choice" ? <div className="quiz-options">{question.options?.map((option) => <label key={option.id} className={responses[question.id] === option.id ? "selected" : ""}><input type="radio" name={question.id} value={option.id} checked={responses[question.id] === option.id} onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))} /><span>{option.label}</span></label>)}</div> : <label className="quiz-numeric-answer"><span>Your answer</span><div><input inputMode="decimal" value={responses[question.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))} placeholder={question.placeholder} />{question.answerSuffix && <b>{question.answerSuffix}</b>}</div></label>}
        </fieldset>)}</div>
        {error && <div className="quiz-error" role="alert">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? "Marking…" : "Submit daily check"}</button>
      </form>}
      {result && <div className="daily-quiz-results">
        <header className={result.outcome === "Ready to continue" ? "passed" : "review"}><span className="eyebrow">EFFORT GUIDANCE</span><h2>{result.outcome}</h2><p>{result.guidance}</p><strong>{result.score}/{result.maxScore} ideas secure in this check</strong></header>
        <div className="quiz-feedback-list">{result.feedback.map((item, index) => <article key={item.questionId} className={item.correct ? "correct" : "incorrect"}><div className="feedback-mark">{item.correct ? "✓" : "×"}</div><div><span>Question {index + 1}</span><h3>{item.prompt}</h3>{!item.correct && <p><b>Correct answer:</b> {item.correctAnswer}</p>}<p>{item.explanation}</p></div></article>)}</div>
        <div className="daily-result-actions"><button className="secondary-button" onClick={() => { setSession(null); setResult(null); setResponses({}); setError(""); setBusy(true); fetch(`/api/daily-quiz?taskId=${encodeURIComponent(taskId)}`, { cache: "no-store" }).then(async (response) => { const data = await response.json() as DailyQuizSessionPayload & { error?: string }; if (!response.ok) throw new Error(data.error ?? "Could not restart."); setSession(data); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not restart.")).finally(() => setBusy(false)); }}>Retry check</button><button className="primary-button" onClick={onClose}>Return to today</button></div>
      </div>}
    </div>
  </div>;
}
