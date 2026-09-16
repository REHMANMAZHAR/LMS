import { TOPICS } from "./data";

const FAMILY_ID = "talha-family";
const HEADERS = ["question_id","task_id","subject","topic_id","lesson_title","question_type","prompt","option_a","option_b","option_c","option_d","correct_answer","explanation","estimated_minutes","review_status","source_reference","version"];

export function parseCsv(csv: string) {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = "";
    } else value += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(value); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function validateQuizCsv(csv: string) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((item) => item.trim()) ?? [];
  if (HEADERS.some((header, index) => headers[index] !== header)) throw new Error("The Daily Checks headers do not match the LMS template.");
  const approved = rows.filter((row) => row[14]?.trim().toLowerCase() === "approved");
  const rejected: string[] = []; const seen = new Set<string>();
  const valid = approved.flatMap((row) => {
    const [questionId, taskId, subject, topicId, lessonTitle, type, prompt, a, b, c, d, answer, explanation, minutes, , source, version] = row.map((item) => item.trim());
    const key = `${taskId}:${questionId}`;
    const options = [a,b,c,d].map((label, index) => ({ id: String.fromCharCode(97 + index), label })).filter((option) => Boolean(option.label));
    const tolerance = Number(row[headers.indexOf("tolerance")] || 0);
    if (!questionId || questionId.length > 50 || !taskId || taskId.length > 160 || !subject || !TOPICS.some((topic) => topic.id === topicId && (topic.subject === subject || topic.subject === "Pakistan Studies" && ["Pakistan History", "Pakistan Geography"].includes(subject))) || !lessonTitle || !prompt || !answer || !explanation || !["choice","numeric"].includes(type) || !source || !Number.isFinite(Number(minutes)) || Number(minutes) <= 0 || !Number.isFinite(tolerance) || tolerance < 0 || (type === "numeric" && !Number.isFinite(Number(answer))) || seen.has(key) || (type === "choice" && !options.some((option) => option.id === answer))) {
      rejected.push(key || "unnamed row"); return [];
    }
    seen.add(key);
    return [{ familyId: FAMILY_ID, taskId, questionId, subject, topicId, lessonTitle, questionType: type, prompt,
      optionsJson: JSON.stringify(type === "numeric" ? [{ id: "tolerance", label: String(tolerance) }] : options), answer, correctAnswer: type === "choice" ? (options.find((option) => option.id === answer)?.label ?? answer) : answer,
      explanation, estimatedMinutes: Math.max(1, Number(minutes) || 4), sourceReference: source || null,
      version: Math.max(1, Number(version) || 1), importedAt: new Date().toISOString() }];
  });
  if (rejected.length) throw new Error(`Nothing published: invalid Approved rows: ${rejected.slice(0, 8).join(", ")}. Correct them and retry.`);
  const counts = new Map<string, number>(); valid.forEach((item) => counts.set(item.taskId, (counts.get(item.taskId) ?? 0) + 1));
  for (const [taskId, count] of counts) if (count < 5) throw new Error(`${taskId} has only ${count} approved questions; at least 5 are required.`);
  if (!valid.length) throw new Error("No valid Approved questions are available to publish.");
  return { valid, rejected };
}

