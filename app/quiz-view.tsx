"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STAGES, SUBJECT_META, SUBJECTS, TOPICS } from "./data";
import { effortGuidance, subjectThreshold, type AssessmentAttempt } from "./learning-model";
import {
  REVIEWED_QUIZ_TOPIC_IDS,
  type QuizResultPayload,
  type QuizSessionPayload,
} from "./quiz-model";

type QuizViewProps = {
  selectedTopicId: string;
  progressMap: ReadonlyMap<string, { stage: number }>;
  attempts: AssessmentAttempt[];
  onSelectTopic: (topicId: string) => void;
  onOpenSyllabus: () => void;
  onCompleted: (result: QuizResultPayload) => void | Promise<void>;
};

const reviewedTopics = REVIEWED_QUIZ_TOPIC_IDS.map((topicId) =>
  TOPICS.find((topic) => topic.id === topicId),
).filter((topic) => topic != null);

const reviewedTopicsBySubject = SUBJECTS.map((subject) => ({
  subject,
  topics: reviewedTopics.filter((topic) => topic.subject === subject),
})).filter((group) => group.topics.length > 0);

function timeLabel(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export default function QuizView({
  selectedTopicId,
  progressMap,
  attempts,
  onSelectTopic,
  onOpenSyllabus,
  onCompleted,
}: QuizViewProps) {
  const selectedTopic = reviewedTopics.find((topic) => topic.id === selectedTopicId) ?? reviewedTopics[0];
  const stage = progressMap.get(selectedTopic.id)?.stage ?? 0;
  const threshold = subjectThreshold(selectedTopic.subject);
  const [session, setSession] = useState<QuizSessionPayload | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResultPayload | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const autoSubmitStarted = useRef(false);

  const recentAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.assessmentType === "Topic quiz").slice(0, 6),
    [attempts],
  );

  const submitQuiz = useCallback(async (automatic = false) => {
    if (!session || result || busy) return;
    const unanswered = session.questions.filter((question) => !responses[question.id]?.trim()).length;
    if (unanswered && !automatic) {
      setError(`Answer all ${session.questions.length} questions before submitting. ${unanswered} remain.`);
      return;
    }
    setBusy(true);
    setError(automatic ? "Time is up. Submitting the answers already entered…" : "");
    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session.sessionId, responses }),
      });
      const data = (await response.json()) as QuizResultPayload & { error?: string };
      if (response.status === 401) {
        window.location.reload();
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "The quiz could not be submitted.");
      setResult(data);
      setError("");
      await onCompleted(data);
    } catch (submissionError) {
      if (!automatic) autoSubmitStarted.current = false;
      setError(submissionError instanceof Error ? submissionError.message : "The quiz could not be submitted.");
    } finally {
      setBusy(false);
    }
  }, [busy, onCompleted, responses, result, session]);

  useEffect(() => {
    if (!session || result) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && !autoSubmitStarted.current) {
        autoSubmitStarted.current = true;
        void submitQuiz(true);
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [result, session, submitQuiz]);

  async function startQuiz() {
    if (stage < 1) {
      setError("Study this topic and mark it as Learning in the Syllabus before taking its quiz.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    setResponses({});
    autoSubmitStarted.current = false;
    try {
      const response = await fetch(`/api/quiz?topicId=${encodeURIComponent(selectedTopic.id)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as QuizSessionPayload & { error?: string };
      if (response.status === 401) {
        window.location.reload();
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "The quiz could not be started.");
      setSession(data);
      setRemainingSeconds(data.durationSeconds);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "The quiz could not be started.");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submitQuiz(false);
  }

  function selectTopic(topicId: string) {
    setSession(null);
    setResponses({});
    setResult(null);
    setRemainingSeconds(0);
    setError("");
    autoSubmitStarted.current = false;
    onSelectTopic(topicId);
  }

  const answered = session?.questions.filter((question) => responses[question.id]?.trim()).length ?? 0;

  return (
    <section className="quiz-layout no-top">
      <aside className="panel quiz-launcher">
        <span className="eyebrow">BUILT-IN TOPIC QUIZZES</span>
        <h2>Prove the learning</h2>
        <p>Answers are marked automatically. Every subject now has reviewed quiz sets, with a subject-specific passing mark.</p>
        <label>
          Reviewed topic
          <select value={selectedTopic.id} onChange={(event) => selectTopic(event.target.value)} disabled={Boolean(session && !result)}>
            {reviewedTopicsBySubject.map((group) => (
              <optgroup key={group.subject} label={`${group.subject} · ${group.topics.length} quizzes`}>
                {group.topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.code} · {topic.title}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="quiz-topic-status">
          <span style={{ background: SUBJECT_META[selectedTopic.subject].color }}>{SUBJECT_META[selectedTopic.subject].short}</span>
          <div><strong>{STAGES[stage]}</strong><small>{stage < 1 ? "Learning must be recorded first" : "Ready for a reviewed quiz"}</small></div>
        </div>
        {stage < 1 ? (
          <button className="secondary-button" onClick={onOpenSyllabus}>Open Syllabus first</button>
        ) : (
          <button className="primary-button" disabled={busy || Boolean(session && !result)} onClick={() => void startQuiz()}>
            {busy && !session ? "Preparing quiz…" : session && !result ? "Quiz in progress" : result ? "Start another attempt" : "Start 12-minute quiz"}
          </button>
        )}
        <div className="quiz-rules">
          <strong>Evidence rules</strong>
          <ul>
            <li>8 reviewed questions, 1 mark each</li>
            <li>{threshold}% is required for {selectedTopic.subject}</li>
            <li>Secure requires two passes on different dates</li>
            <li>At least one qualifying pass must be timed</li>
            <li>Use Tests for essays and full exam responses</li>
          </ul>
        </div>
        <div className="quiz-recent">
          <strong>Recent quiz evidence</strong>
          {recentAttempts.length ? recentAttempts.map((attempt) => {
            const topic = TOPICS.find((item) => item.id === attempt.topicId);
            const guidance = effortGuidance(Math.round((attempt.score / attempt.maxScore) * 100), attempt.errorCategory);
            return <div key={attempt.id}><span>{guidance.effort}</span><p>{topic?.code ?? "Quiz"} · {topic?.title ?? "Topic"}<small>{new Date(attempt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{attempt.timed ? " · timed" : " · untimed"}</small></p></div>;
          }) : <p className="quiz-empty">No built-in quiz attempts yet.</p>}
        </div>
      </aside>

      <div className="panel quiz-workspace">
        {!session && !result && (
          <div className="quiz-welcome">
            <div className="quiz-welcome-mark">Q</div>
            <span className="eyebrow">REVIEWED TOPIC SET</span>
            <h2>{selectedTopic.code} · {selectedTopic.title}</h2>
            <p>Work without notes. These questions check core recall and application; use Tests for longer written exam answers. The answer key appears only after submission.</p>
          </div>
        )}

        {session && !result && (
          <form onSubmit={handleSubmit} className="quiz-form">
            <header className="quiz-progress-header">
              <div><span className="eyebrow">{session.topicCode} · TIMED QUIZ</span><h2>{session.topicTitle}</h2></div>
              <div className={`quiz-timer ${remainingSeconds <= 60 ? "urgent" : ""}`}><span>Time left</span><strong>{timeLabel(remainingSeconds)}</strong></div>
            </header>
            <div className="quiz-progress-line"><span style={{ width: `${(answered / session.questions.length) * 100}%` }} /></div>
            <p className="quiz-answer-count">{answered} of {session.questions.length} answered</p>
            <div className="quiz-question-list">
              {session.questions.map((question) => (
                <fieldset className="quiz-question" key={question.id}>
                  <legend><span>{question.number}</span>{question.prompt}</legend>
                  {question.type === "choice" ? (
                    <div className="quiz-options">
                      {question.options?.map((option) => (
                        <label key={option.id} className={responses[question.id] === option.id ? "selected" : ""}>
                          <input
                            type="radio"
                            name={question.id}
                            value={option.id}
                            checked={responses[question.id] === option.id}
                            onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <label className="quiz-numeric-answer">
                      <span>Your answer</span>
                      <div><input inputMode="decimal" value={responses[question.id] ?? ""} onChange={(event) => setResponses((current) => ({ ...current, [question.id]: event.target.value }))} placeholder={question.placeholder ?? "Enter a number"} />{question.answerSuffix && <b>{question.answerSuffix}</b>}</div>
                    </label>
                  )}
                </fieldset>
              ))}
            </div>
            {error && <div className="quiz-error" role="alert">{error}</div>}
            <button className="primary-button quiz-submit" disabled={busy}>{busy ? "Marking answers…" : "Submit and mark quiz"}</button>
          </form>
        )}

        {result && (() => {
          const guidance = effortGuidance(result.percentage, result.feedback.some((item) => !item.correct) ? "Concept or application gap" : "No major error");
          return (
          <div className="quiz-results">
            <header className={result.passed ? "passed" : "review"}>
              <div className="quiz-effort"><strong>{guidance.effort}</strong><span>Recommended effort</span></div>
              <div><span className="eyebrow">YOUR NEXT LEARNING STEP</span><h2>{result.secure ? "Keep this learning strong" : result.passed ? "Strengthen and retain" : "Review, practise and return"}</h2><p>Main need: {guidance.gap}. {guidance.next}</p></div>
            </header>
            <div className="quiz-evidence-summary"><strong>Secure proof {result.evidencePasses}/2</strong><span>{result.hasTimedPass ? "Timed qualifying pass ✓" : "Timed qualifying pass still needed"}</span></div>
            <div className="quiz-feedback-list">
              {result.feedback.map((item, index) => (
                <article key={item.questionId} className={item.correct ? "correct" : "incorrect"}>
                  <div className="feedback-mark">{item.correct ? "✓" : "×"}</div>
                  <div><span>Question {index + 1}</span><h3>{item.prompt}</h3>{!item.correct && <p><b>Correct answer:</b> {item.correctAnswer}</p>}<p>{item.explanation}</p>{!item.correct && <button type="button" className="feedback-tools-button" onClick={onOpenSyllabus}>Review this topic lesson</button>}</div>
                </article>
              ))}
            </div>
            {error && <div className="quiz-error" role="alert">{error}</div>}
            <button className="primary-button" onClick={() => void startQuiz()} disabled={busy}>{busy ? "Preparing quiz…" : "Try this topic again"}</button>
          </div>
          );
        })()}
      </div>
    </section>
  );
}
