"use client";
import { useMemo, useState } from "react";
import { forecast, lessonUnits, readManifest, type PlannedTask } from "./adaptive-plan";
import { nextDay } from "./planner-rules";
type Props = { settings: Record<string,string>; completed: Set<string>; history: PlannedTask[]; today: string; onSaved:()=>Promise<void> };
export default function TargetPlanner({settings,completed,history,today,onSaved}:Props) {
  const manifest=readManifest(settings);
  const [minutes,setMinutes]=useState(manifest?.dailyMinutes ?? 180);
  const [target,setTarget]=useState(manifest?.targetDate ?? "2027-02-15");
  const [preparation,setPreparation]=useState(manifest?.preparationDate ?? "2027-04-15");
  const [buffer,setBuffer]=useState(Number(settings["planner.bufferPercent"] ?? 20));
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const start=nextDay(today);
  const units=useMemo(()=>lessonUnits({...settings,"planner.bufferPercent":String(buffer)},completed).filter(unit=>!settings[`planner.done.${unit.id}`]),[settings,completed,buffer]);
  const preview=useMemo(()=>forecast(units,start,target,Math.max(90,Math.min(600,minutes || 180))),[units,start,target,minutes]);
  async function apply() {
    setBusy(true);setMessage("");
    try {
      const response=await fetch("/api/plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({dailyMinutes:minutes,bufferPercent:buffer,startsOn:start,targetDate:target,preparationDate:preparation,expectedRevision:manifest?.revision ?? "",history})});
      const result=await response.json(); if(!response.ok)throw new Error(result.error || "Could not save the plan.");
      await onSaved();setMessage(`Plan saved from ${start}. A backup was preserved. Today's original work and all completion records are retained.`);
    }catch(error){setMessage(error instanceof Error?error.message:"Could not save the plan.");}finally{setBusy(false);}
  }
  return <article className="panel target-planner"><span className="eyebrow">PREPARATION TARGETS</span><h2>Preview your study pace</h2>
    <p>Estimates are starting points, not a promise. The plan uses Monday–Saturday, up to two subjects each day, Chemistry on Tuesday/Thursday/Saturday, and a separate Sunday assessment. Online class time and breaks are additional to this self-study budget.</p>
    <div className="form-grid"><label>Self-study minutes per day<input type="number" min="90" max="600" step="15" value={minutes} onChange={event=>setMinutes(Number(event.target.value))}/></label><label>Correction / catch-up allowance (%)<input type="number" min="0" max="50" step="5" value={buffer} onChange={event=>setBuffer(Number(event.target.value))}/></label><label>Finish syllabus by<input type="date" min={start} value={target} onChange={event=>setTarget(event.target.value)}/></label><label>Finish revision and paper preparation by<input type="date" min={target} value={preparation} onChange={event=>setPreparation(event.target.value)}/></label></div>
    <p><strong>{Math.ceil(preview.learningMinutes/60)} estimated learning hours remaining · forecast finish {preview.finish}</strong><br/>Learning estimates include your {buffer}% correction/catch-up allowance. Daily budgets include one 20-minute check allowance per subject block. A long topic spans several days; short parts can share a subject block.</p>
    {preview.finish>target?<p role="status">This budget misses the syllabus target. {preview.required?`The scheduler needs about ${preview.required} minutes/day (${preview.required-minutes} more) to fit the current estimates.`:"Even ten hours/day does not fit this target with the subject-day constraints. Move the target and review the estimates."}</p>:<p>The estimated schedule fits this syllabus target. Leave room for harder topics and missed days.</p>}
    <p>The period {target} to {preparation} is reserved as your preparation window. This release does not promise exam readiness or automatically populate a full-paper revision programme.</p>
    {preview.required>minutes&&<button disabled={busy} onClick={()=>setMinutes(preview.required)}>Preview {preview.required} minutes/day</button>}
    <button className="primary-button" disabled={busy||minutes<90||minutes>600||target<start||preparation<target} onClick={()=>void apply()}>{busy?"Saving backed-up plan…":`Accept this plan from ${start}`}</button>
    {message&&<p role="status">{message}</p>}
  </article>;
}
