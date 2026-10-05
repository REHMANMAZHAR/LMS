"use client";

import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { hoursAndMinutes, shortDate, stageLabel, type OverdueRecall, type SubjectWorkload, type TopicWorkloadRow } from "./parent-report";

/** Small "i" button. Hover or focus shows the explanation; a tap toggles it on touch screens. */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);
  const tipId = useId();
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && wrapper.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return <span className={`info-tip${open ? " open" : ""}`} ref={wrapper}>
    <button type="button" aria-label={`What does ${label} mean?`} aria-describedby={tipId} aria-expanded={open} onClick={() => setOpen((value) => !value)}>i</button>
    <span role="tooltip" id={tipId}>{children}</span>
  </span>;
}

/** Native modal dialog: traps focus, closes with Escape, the close button or a click outside. */
export function InsightDialog({ title, kicker, onClose, children }: { title: string; kicker?: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    return () => node?.close();
  }, []);
  return <dialog
    ref={dialog}
    className="insight-dialog"
    aria-labelledby={titleId}
    onClose={onClose}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}
  >
    <div className="insight-dialog-body">
      <header>
        <div>{kicker ? <span className="eyebrow">{kicker}</span> : null}<h2 id={titleId}>{title}</h2></div>
        <button type="button" className="dialog-close" onClick={onClose} aria-label="Close">×</button>
      </header>
      {children}
    </div>
  </dialog>;
}

export function OverdueRecallsDialog({ recalls, explanation, onClose }: { recalls: OverdueRecall[]; explanation: string; onClose: () => void }) {
  const subjects = [...new Set(recalls.map((item) => item.subject))];
  return <InsightDialog kicker="Parent attention" title={`${recalls.length} overdue recall${recalls.length === 1 ? "" : "s"}`} onClose={onClose}>
    <p className="dialog-note">{explanation}</p>
    <p className="dialog-note">Most overdue first. Ask Talha to close the book and explain or solve one question from each topic; re-teach any topic he can&apos;t recall.</p>
    {subjects.map((subject) => {
      const rows = recalls.filter((item) => item.subject === subject);
      return <section key={subject} className="dialog-section">
        <h3><span className={`subject-chip ${rows[0].subjectClass}`}>{rows[0].subjectShort}</span>{subject} <small>{rows.length} topic{rows.length === 1 ? "" : "s"}</small></h3>
        <ol className="dialog-list">
          {rows.map((item) => <li key={item.id}>
            <div><strong>{item.title}</strong><small>{item.unit}</small></div>
            <div className="dialog-list-meta">
              <span className="overdue-tag">{item.overdueBy === 0 ? "Due today" : `${item.overdueBy} day${item.overdueBy === 1 ? "" : "s"} overdue`}</span>
              <small>{stageLabel(item.stage)} · last studied {shortDate(item.lastStudiedAt)} · recall after {item.waitDays} day{item.waitDays === 1 ? "" : "s"}</small>
            </div>
          </li>)}
        </ol>
      </section>;
    })}
  </InsightDialog>;
}

function TopicList({ rows, empty, mode }: { rows: TopicWorkloadRow[]; empty: string; mode: "covered" | "remaining" | "maintenance" }) {
  if (!rows.length) return <p className="dialog-note">{empty}</p>;
  return <ol className="dialog-list">
    {rows.map((row) => <li key={row.id}>
      <div><strong>{row.title}</strong><small>{row.code ? `${row.code} · ` : ""}{row.unit}</small></div>
      <div className="dialog-list-meta">
        <span>{hoursAndMinutes(row.minutes)}</span>
        <small>{mode === "remaining" ? "Not started" : mode === "maintenance" ? "Confident before plan" : `${stageLabel(row.stage)}${row.completedOn ? ` · ${shortDate(row.completedOn)}` : ""}`}</small>
      </div>
    </li>)}
  </ol>;
}

export function SubjectWorkloadDialog({ workload, onClose }: { workload: SubjectWorkload; onClose: () => void }) {
  const remainingMinutes = workload.totalMinutes - workload.coveredMinutes;
  return <InsightDialog kicker="Workload covered" title={workload.subject} onClose={onClose}>
    <div className="workload-summary" style={{ ["--subject" as string]: workload.color }}>
      <div className="workload-bar" aria-hidden="true"><span style={{ width: `${workload.coveredPercent}%` }} /></div>
      <dl>
        <div><dt>Covered</dt><dd>{workload.coveredPercent}%<small>{hoursAndMinutes(workload.coveredMinutes)} · {workload.covered.length} topics</small></dd></div>
        <div><dt>Remaining</dt><dd>{100 - workload.coveredPercent}%<small>{hoursAndMinutes(remainingMinutes)} · {workload.remaining.length} topics</small></dd></div>
        <div><dt>Planned total</dt><dd>{hoursAndMinutes(workload.totalMinutes)}<small>{workload.covered.length + workload.remaining.length} active topics</small></dd></div>
      </dl>
    </div>
    <section className="dialog-section">
      <h3>Covered <small>{workload.covered.length} topics · {hoursAndMinutes(workload.coveredMinutes)}</small></h3>
      <TopicList rows={workload.covered} empty="No topic in this subject has been started yet." mode="covered" />
    </section>
    <section className="dialog-section">
      <h3>Remaining <small>{workload.remaining.length} topics · {hoursAndMinutes(remainingMinutes)}</small></h3>
      <TopicList rows={workload.remaining} empty="Every active topic in this subject has been started." mode="remaining" />
    </section>
    {workload.maintenance.length ? <section className="dialog-section">
      <h3>Already confident <small>{workload.maintenance.length} topics · kept fresh with past papers, not counted above</small></h3>
      <TopicList rows={workload.maintenance} empty="" mode="maintenance" />
    </section> : null}
  </InsightDialog>;
}
