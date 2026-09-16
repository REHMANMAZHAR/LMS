"use client";

import { useMemo, useState } from "react";
import type { PlannedTask } from "./adaptive-plan";

export default function WeeklyReview({
  tasks,
  settings,
  today,
  onStart,
}: {
  tasks: PlannedTask[];
  settings: Record<string, string>;
  today: string;
  onStart: (id: string) => void;
}) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (7 - date.getUTCDay()) % 7);
  const [end, setEnd] = useState(date.toISOString().slice(0, 10));
  const startDate = new Date(`${end}T12:00:00Z`);
  startDate.setUTCDate(startDate.getUTCDate() - 6);
  const start = Number.isFinite(startDate.getTime()) ? startDate.toISOString().slice(0, 10) : today;

  const studied = useMemo(
    () => tasks.filter((task) =>
      task.kind === "syllabus"
      && settings[`planner.done.${task.id}`] >= start
      && settings[`planner.done.${task.id}`] <= end),
    [tasks, settings, start, end],
  );
  const topics = [...new Map(studied.map((task) => [task.topic.id, task.topic])).values()];
  const isSunday = new Date(`${end}T12:00:00Z`).getUTCDay() === 0;

  return (
    <article className="panel weekly-review">
      <span className="eyebrow">SUNDAY · 60-MINUTE WEEKEND QUIZ</span>
      <h2>Test the topics completed this week</h2>
      <label>
        Week ending Sunday
        <input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
      </label>
      <p>
        The LMS found {studied.length} completed lesson parts across {topics.length} syllabus
        topics from {start} to {end}. It will build one longer, balanced quiz from those exact
        lessons, mark it automatically and save the result in Talha&apos;s evidence history.
      </p>
      <details>
        <summary>Topics included in this weekend quiz</summary>
        {studied.length ? (
          <ul>{studied.map((task) => <li key={task.id}>{task.stream}: {task.lesson.title}</li>)}</ul>
        ) : (
          <p>No completed lesson has been recorded for this week yet.</p>
        )}
      </details>
      {!isSunday && <p className="quiz-error">Choose a Sunday as the week-ending date.</p>}
      <button
        disabled={!studied.length || !isSunday}
        className="primary-button"
        onClick={() => onStart(`v3:weekly:${end}`)}
      >
        Start 60-minute Weekend Quiz
      </button>
      <p className="quiet">
        No PDF opens. Questions are delivered inside the LMS. Answers and explanations remain
        hidden until submission, and completing this quiz does not automatically mark unfinished
        syllabus work as complete.
      </p>
    </article>
  );
}
