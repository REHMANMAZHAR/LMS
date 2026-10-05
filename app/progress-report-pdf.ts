import { hoursAndMinutes, PARENT_GLOSSARY, shortDate, stageLabel, type OverdueRecall, type SubjectWorkload } from "./parent-report";

export type ReportSubjectRow = {
  subject: string;
  workloadPercent: number;
  secureText: string;
  effort: string;
  track: string;
  topError: string;
  attempts: number;
  average: number | null;
};

export type ProgressReportData = {
  learnerName: string;
  targetDate: string;
  metrics: Array<{ label: string; value: string; note: string }>;
  week: Array<{ label: string; minutes: number }>;
  requiredDaily: number;
  subjects: ReportSubjectRow[];
  workloads: SubjectWorkload[];
  overdue: OverdueRecall[];
  leadingErrors: Array<[string, number]>;
  dailyChecks: Array<{ title: string; subject: string; date: string; summary: string }>;
  adaptive: { wrong: number; skipped: number; needsReview: number; message: string };
};

const INK: [number, number, number] = [24, 58, 55];
const MUTED: [number, number, number] = [111, 125, 120];
const LINE: [number, number, number] = [220, 215, 202];
const HEAD_FILL: [number, number, number] = [240, 236, 227];

/** Standard PDF fonts only cover Latin-1; NFKD turns subscripts (H₂O) and transliteration marks into plain letters. */
function pdfText(value: string) {
  return value
    .replace(/[→⟶]/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "*")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e\u00a0-\u00ff]/g, "");
}

export async function downloadProgressReport(data: ProgressReportData) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const generated = new Date();
  let y = margin;

  const lastTableEnd = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  const ensureSpace = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
  };
  const heading = (text: string, note?: string) => {
    ensureSpace(note ? 60 : 40);
    y += 18;
    doc.setFont("times", "bold").setFontSize(15).setTextColor(...INK).text(pdfText(text), margin, y);
    y += 6;
    if (note) {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(...MUTED);
      const lines = doc.splitTextToSize(pdfText(note), contentWidth);
      doc.text(lines, margin, y + 10);
      y += 10 + lines.length * 10;
    }
    y += 4;
  };
  const table = (head: string[], body: Array<Array<string | number>>, columnStyles: Record<number, { cellWidth?: number | "auto"; halign?: "left" | "right" | "center" }> = {}) => {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [head.map(pdfText)],
      body: body.map((row) => row.map((cell) => pdfText(String(cell)))),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 4, textColor: INK, lineColor: LINE, lineWidth: 0.5, valign: "top" },
      headStyles: { fillColor: HEAD_FILL, textColor: MUTED, fontStyle: "bold", fontSize: 7.5 },
      columnStyles,
    });
    y = lastTableEnd() + 6;
  };

  // Title block
  doc.setFont("times", "bold").setFontSize(22).setTextColor(...INK).text(pdfText(`${data.learnerName} · CIE progress report`), margin, y + 16);
  y += 34;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED)
    .text(pdfText(`Generated ${shortDate(generated.toISOString())} ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(generated)} · Syllabus target ${shortDate(data.targetDate)}`), margin, y);
  y += 8;

  heading("Summary");
  table(data.metrics.map((item) => item.label), [data.metrics.map((item) => item.value), data.metrics.map((item) => item.note)]);

  heading("Study time, last 7 days", `Total ${hoursAndMinutes(data.week.reduce((sum, day) => sum + day.minutes, 0))}. Daily target is about ${data.requiredDaily} minutes on each study day. Re-opened tasks are removed from the day they were first completed.`);
  table(data.week.map((day) => day.label), [data.week.map((day) => `${day.minutes} min`)]);

  heading("Progress, effort and next focus by subject");
  table(
    ["Subject", "Workload covered", "Secure", "Tests", "Effort needed", "Present need", "Main lost-mark reason"],
    data.subjects.map((row) => [row.subject, `${row.workloadPercent}%`, row.secureText, row.attempts ? `${row.attempts} · avg ${row.average}%` : "None", row.effort, row.track, row.topError]),
  );

  heading("What the columns mean");
  table(["Term", "Meaning"], [
    ["Workload covered", PARENT_GLOSSARY.workload.replace(/ Select a subject name.*$/, "")],
    ["Secure", PARENT_GLOSSARY.secure],
    ["Effort needed", PARENT_GLOSSARY.effort],
    ["Present need", PARENT_GLOSSARY.track],
    ["Recalls", PARENT_GLOSSARY.recalls],
  ], { 0: { cellWidth: 95 } });

  heading(data.overdue.length ? `Overdue recalls (${data.overdue.length})` : "Overdue recalls", data.overdue.length ? "Most overdue first." : "Recall schedule is clear.");
  if (data.overdue.length) {
    table(
      ["Subject", "Topic", "Stage", "Last studied", "Overdue"],
      data.overdue.map((item) => [item.subject, item.title, stageLabel(item.stage), shortDate(item.lastStudiedAt), item.overdueBy ? `${item.overdueBy} d` : "Today"]),
      { 1: { cellWidth: 200 }, 4: { halign: "right" } },
    );
  }

  if (data.leadingErrors.length) {
    heading("Most frequent sources of lost marks");
    table(["Reason", "Times recorded"], data.leadingErrors.map(([reason, count]) => [reason, count]), { 1: { halign: "right", cellWidth: 90 } });
  }

  heading("Adaptive review queue", data.adaptive.message);
  table(["Wrong", "Skipped", "Attempts needing review"], [[data.adaptive.wrong, data.adaptive.skipped, data.adaptive.needsReview]]);

  if (data.dailyChecks.length) {
    heading("Recent daily checks");
    table(["Date", "Subject", "Outcome", "Next step"], data.dailyChecks.map((item) => [item.date, item.subject, item.title, item.summary]), { 0: { cellWidth: 55 }, 1: { cellWidth: 75 }, 2: { cellWidth: 85 } });
  }

  for (const workload of data.workloads) {
    doc.addPage();
    y = margin;
    heading(`${workload.subject}: workload covered ${workload.coveredPercent}%`, `${hoursAndMinutes(workload.coveredMinutes)} of ${hoursAndMinutes(workload.totalMinutes)} planned study time started. ${workload.covered.length} topics covered, ${workload.remaining.length} remaining.`);
    heading(`Covered (${workload.covered.length})`);
    if (workload.covered.length) {
      table(["Code", "Topic", "Unit", "Stage", "Since", "Time"], workload.covered.map((row) => [row.code, row.title, row.unit, stageLabel(row.stage), shortDate(row.completedOn), hoursAndMinutes(row.minutes)]), { 1: { cellWidth: 170 }, 5: { halign: "right" } });
    } else table(["Covered"], [["No topic in this subject has been started yet."]]);
    heading(`Remaining (${workload.remaining.length})`);
    if (workload.remaining.length) {
      table(["Code", "Topic", "Unit", "Time"], workload.remaining.map((row) => [row.code, row.title, row.unit, hoursAndMinutes(row.minutes)]), { 1: { cellWidth: 210 }, 3: { halign: "right" } });
    } else table(["Remaining"], [["Every active topic in this subject has been started."]]);
    if (workload.maintenance.length) {
      heading(`Already confident (${workload.maintenance.length})`, "Kept fresh with past-paper practice; not counted in workload.");
      table(["Code", "Topic", "Unit"], workload.maintenance.map((row) => [row.code, row.title, row.unit]));
    }
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...MUTED)
      .text(pdfText(`${data.learnerName} · progress report · page ${page} of ${pages}`), pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });
  }

  doc.save(`talha-progress-report-${generated.toISOString().slice(0, 10)}.pdf`);
}
