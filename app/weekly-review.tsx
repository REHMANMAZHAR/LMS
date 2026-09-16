"use client";
import { useMemo, useState } from "react";
import PastPaperPractice from "./past-paper-practice";
import type { PlannedTask } from "./adaptive-plan";
export default function WeeklyReview({tasks,settings,today,onStart}:{tasks:PlannedTask[];settings:Record<string,string>;today:string;onStart:(id:string)=>void}) {
  const date=new Date(`${today}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+(7-date.getUTCDay())%7);
  const [end,setEnd]=useState(date.toISOString().slice(0,10));
  const startDate=new Date(`${end}T12:00:00Z`);startDate.setUTCDate(startDate.getUTCDate()-6);
  const start=Number.isFinite(startDate.getTime())?startDate.toISOString().slice(0,10):today;
  const studied=useMemo(()=>tasks.filter(task=>task.kind==="syllabus"&&settings[`planner.done.${task.id}`]>=start&&settings[`planner.done.${task.id}`]<=end),[tasks,settings,start,end]);
  return <article className="panel weekly-review"><span className="eyebrow">SUNDAY · WEEKLY ASSESSMENT</span><h2>Review what you actually studied</h2>
    <label>Week ending Sunday<input type="date" value={end} onChange={event=>setEnd(event.target.value)}/></label>
    <p>{studied.length} completed lesson parts from {start} to {end}. The target is a 60-minute assessment. Available reviewed questions open inside the LMS; missing coverage is reported, and a short set is labelled as practice.</p>
    <details><summary>Studied lessons included in this review</summary><ul>{studied.map(task=><li key={task.id}>{task.stream}: {task.lesson.title}</li>)}</ul></details>
    <button disabled={!studied.length||new Date(`${end}T12:00:00Z`).getUTCDay()!==0} className="primary-button" onClick={()=>onStart(`v3:weekly:${end}`)}>Open available weekly questions</button>
    <PastPaperPractice topicIds={[...new Set(studied.map(task=>task.topic.id))]} />
    <p>Written past-paper answers still need their matching marking scheme and human marking. Use “Add a marked attempt” below after marking that work; a short recall quiz does not prove whole-topic mastery.</p>
  </article>;
}
