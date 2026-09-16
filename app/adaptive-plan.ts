import { TOPICS, type Topic } from "./data";
import { MAINTENANCE_TOPIC_IDS, STARTER_LESSONS, TOPIC_FOCUSES, topicLesson, type GuidedLesson, type LessonStream } from "./lesson-plan";
import { nextDay, allowedDay } from "./planner-rules";

export type PlannedTask = {
  id: string; topic: Topic; stream: LessonStream; kind: "syllabus" | "revision" | "past-paper";
  lesson: GuidedLesson; session: number; sessions: number; minutes: number;
  originalDate: string; scheduledDate: string; carriedForward: boolean;
  quizMinutes?: number; retired?: boolean; unitId?: string;
};
export type PlanManifest = {
  version: 3; revision: string; startsOn: string; dailyMinutes: number;
  targetDate: string; preparationDate: string; tasks: PlannedTask[]; history: PlannedTask[];
};
export function streamFor(topic: Topic): LessonStream {
  return topic.subject === "Pakistan Studies" ? topic.paper === "P2" ? "Pakistan Geography" : "Pakistan History" : topic.subject;
}
export const taskTime = (task: PlannedTask) => task.minutes + (task.quizMinutes ?? (task.kind === "syllabus" ? 20 : 0));
export function readManifest(settings: Record<string, string>): PlanManifest | undefined {
  try {
    const value = JSON.parse(settings["planner.manifest.v3"] || "null") as PlanManifest | null;
    if (value?.version === 3 && Array.isArray(value.tasks) && Array.isArray(value.history)) return value;
  } catch { /* Legacy plans remain available until a manifest is saved. */ }
  return undefined;
}
export function lessonUnits(settings: Record<string, string>, completedTopics: ReadonlySet<string>): PlannedTask[] {
  const orderedTopics = [...TOPICS].sort((a,b) => {
    if (streamFor(a) !== streamFor(b)) return 0;
    const starters = STARTER_LESSONS[streamFor(a)];
    const ai = starters.findIndex(item => item.topicId === a.id), bi = starters.findIndex(item => item.topicId === b.id);
    return (ai < 0 ? 1000 : ai) - (bi < 0 ? 1000 : bi);
  });
  return orderedTopics.flatMap((topic) => {
    const reopened = settings[`planner.reopened.${topic.id}`];
    if (completedTopics.has(topic.id) || (MAINTENANCE_TOPIC_IDS.has(topic.id) && !reopened)) return [];
    const starters = Object.values(STARTER_LESSONS).flat().filter(item => item.topicId === topic.id);
    // Each focus remains represented: studying one starter never removes its parent.
    const focusCount = TOPIC_FOCUSES[topic.id]?.length ?? 0;
    const lessons = focusCount ? Array.from({ length: focusCount }, (_, i) => topicLesson(topic, i + 1, focusCount))
      : starters.length && !starters.some(item => /Passages \d/.test(item.title)) ? [...starters, { ...topicLesson(topic, 1, 1), title: `${topic.title}: remaining objectives and exam application` }] : [topicLesson(topic, 1, 1)];
    const override = Number(settings[`planner.estimate.${topic.id}`]);
    const estimate = override >= 20 && override <= 3000 ? override : topic.minutes;
    // Provisional estimates, with a minimum usable block; never a fixed three hours per topic.
    const buffer = Math.max(0, Math.min(50, Number(settings["planner.bufferPercent"] ?? 20)));
    const total = Math.ceil(Math.max(estimate, lessons.length * 30) * (1 + buffer / 100));
    return lessons.flatMap((lesson, focus) => {
      const budget = Math.ceil(total / lessons.length);
      const parts = Math.ceil(budget / 45);
      return Array.from({ length: parts }, (_, part) => {
        const minutes = Math.ceil(budget / parts);
        const unitId = `v3:${topic.id}:${focus + 1}:${part + 1}`;
        return {
          id: reopened ? `${unitId}:r${Date.parse(reopened)}` : unitId, unitId,
          topic, stream: streamFor(topic), kind: "syllabus" as const,
          lesson: { ...lesson, title: `${lesson.title}${parts > 1 ? ` · part ${part + 1}/${parts}` : ""}`,
            studyMethod: `Estimated ${minutes} minutes: learn the idea, work an example, practise independently and correct errors. Stop at the end of this part; record partial progress if needed.` },
          session: focus + 1, sessions: lessons.length, minutes, quizMinutes: 0,
          originalDate: "", scheduledDate: "", carriedForward: false,
        };
      });
    });
  });
}
export function assignUnits(units: PlannedTask[], startsOn: string, dailyMinutes: number): PlannedTask[] {
  if (!Number.isFinite(dailyMinutes) || dailyMinutes < 90 || dailyMinutes > 600) throw new Error("Choose 90–600 study minutes per day.");
  const queues = new Map<LessonStream, PlannedTask[]>();
  units.forEach(unit => queues.set(unit.stream, [...(queues.get(unit.stream) ?? []), unit]));
  const result: PlannedTask[] = [];
  const lastAssigned = new Map<LessonStream, string>();
  let date = startsOn;
  let days = 0;
  while ([...queues.values()].some(items => items.length)) {
    if (++days > 3650) throw new Error("The workload cannot be scheduled within ten years. Check the estimates.");
    if (new Date(`${date}T12:00:00Z`).getUTCDay() === 0) { date = nextDay(date); continue; }
    const available = [...queues.entries()].filter(([stream, items]) => items.length && allowedDay(date, stream, "syllabus"));
    // Chemistry is reserved on its three class days. Other streams rotate fairly,
    // then use remaining workload as a tie-breaker rather than starving small subjects.
    available.sort(([sa, a], [sb, b]) => {
      if (sa === "Chemistry") return -1;
      if (sb === "Chemistry") return 1;
      return (lastAssigned.get(sa) ?? "").localeCompare(lastAssigned.get(sb) ?? "") || b.reduce((s,t)=>s+t.minutes,0) - a.reduce((s,t)=>s+t.minutes,0);
    });
    const chosen = available.slice(0, 2);
    let remaining = dailyMinutes - chosen.length * 20;
    chosen.forEach(([stream, queue], index) => {
      const allowance = index === chosen.length - 1 ? remaining : Math.floor(remaining / (chosen.length - index));
      let used = 0;
      const block: PlannedTask[] = [];
      while (queue.length && used + queue[0].minutes <= allowance) {
        const unit = queue.shift()!;
        used += unit.minutes;
        block.push({ ...unit, originalDate: date, scheduledDate: date, carriedForward: false, quizMinutes: 0 });
      }
      if (block.length) {
        block[block.length - 1].quizMinutes = 20;
        result.push(...block);
        lastAssigned.set(stream, date);
      }
      remaining -= used;
    });
    date = nextDay(date);
  }
  return result;
}
export function forecast(units: PlannedTask[], start: string, target: string, dailyMinutes: number) {
  const assignments = assignUnits(units, start, dailyMinutes);
  const finish = assignments.at(-1)?.scheduledDate ?? start;
  let required = dailyMinutes;
  if (finish > target) {
    required = 0;
    for (let minutes = Math.ceil((dailyMinutes + 1) / 15) * 15; minutes <= 600; minutes += 15) {
      if ((assignUnits(units, start, minutes).at(-1)?.scheduledDate ?? start) <= target) { required = minutes; break; }
    }
  }
  return { assignments, finish, required, learningMinutes: units.reduce((sum, unit) => sum + unit.minutes, 0) };
}
export function buildAdaptivePlanner(manifest: PlanManifest, settings: Record<string, string>, today: string) {
  const canonicalTasks = [...manifest.history, ...manifest.tasks];
  const canonical = new Map<string, PlannedTask[]>();
  canonicalTasks.forEach(task => canonical.set(task.originalDate, [...(canonical.get(task.originalDate) ?? []), task]));
  const completedTaskIds = new Set(canonicalTasks.filter(task => settings[`planner.done.${task.id}`]).map(task => task.id));
  const effective = new Map<string, PlannedTask[]>();
  canonicalTasks.filter(task => completedTaskIds.has(task.id)).forEach(task => {
    const date = settings[`planner.done.${task.id}`];
    effective.set(date, [...(effective.get(date) ?? []), { ...task, scheduledDate: date }]);
  });
  manifest.history.filter(task => task.originalDate === today && !completedTaskIds.has(task.id)).forEach(task => {
    effective.set(today, [...(effective.get(today) ?? []), { ...task, scheduledDate: today }]);
  });
  const incomplete = manifest.tasks.filter(task => !completedTaskIds.has(task.id));
  for (const task of incomplete) {
    const extra = settings[`planner.extra.${task.id}`];
    let date = extra && extra >= today ? extra : task.originalDate > today ? task.originalDate : today;
    const repeat = settings[`planner.repeat.${task.topic.id}`];
    if (repeat && repeat > date) date = repeat;
    const partial = Number(settings[`planner.taskPartial.${task.id}`] || 0) / 100;
    const needed = Math.ceil(task.minutes * (1 - partial));
    for (;;) {
      const existing = effective.get(date) ?? [];
      const subjects = new Set(existing.filter(t => t.kind === "syllabus").map(t => t.stream));
      const used = existing.reduce((sum, item) => sum + item.minutes, 0);
      const blocks = new Set([...subjects, task.stream]).size;
      if (allowedDay(date, task.stream, task.kind) && (extra === date || (blocks <= 2 && used + needed + blocks * 20 <= manifest.dailyMinutes))) break;
      date = nextDay(date);
    }
    effective.set(date, [...(effective.get(date) ?? []), { ...task, scheduledDate: date, carriedForward: date > task.originalDate, quizMinutes: 0 }]);
  }
  // One check allowance per subject block, not twenty minutes on every small chunk.
  effective.forEach(tasks => {
    const last = new Map<string, PlannedTask>();
    tasks.forEach(task => { if (task.kind === "syllabus" && !task.retired) { task.quizMinutes = 0; last.set(task.stream, task); } });
    last.forEach(task => { task.quizMinutes = 20; });
  });
  const predictedCompletion = [...effective.entries()].filter(([, tasks]) => tasks.some(task => task.kind === "syllabus" && !completedTaskIds.has(task.id))).map(([date]) => date).sort().at(-1) ?? today;
  // Sunday is reserved for ONE weekly assessment. Its content is selected by the server
  // from actual completed work, never by assigning new teaching on Sunday.
  for (let date = manifest.startsOn; date <= predictedCompletion || date <= today; date = nextDay(date)) {
    if (new Date(`${date}T12:00:00Z`).getUTCDay() !== 0) continue;
    const topic = TOPICS[0];
    const task: PlannedTask = { id: `v3:weekly:${date}`, topic, stream: "Chemistry", kind: "revision", minutes: 60, quizMinutes: 0, session: 1, sessions: 1, originalDate: date, scheduledDate: date, carriedForward: false,
      lesson: { title: "Weekly assessment — all subjects studied this week", objective: "Test the topics actually studied this week. Review the coverage before starting.", keyPoints: "Marked evidence from this week", studyMethod: "60-minute assessment; mark written work using the supplied marking guide afterwards.", practice: "Open Weekend Assessments to see available questions and any coverage gaps.", recall: "Correct errors and plan follow-up practice." } };
    canonical.set(date, [...(canonical.get(date) ?? []), task]);
    effective.set(date, [...(effective.get(date) ?? []), task]);
    canonicalTasks.push(task);
    if (settings[`planner.done.${task.id}`]) completedTaskIds.add(task.id);
  }
  return { canonical, effective, tasksById: new Map(canonicalTasks.map(task => [task.id, task])), completedTaskIds, predictedCompletion, overdueCount: incomplete.filter(task => task.originalDate < today).length };
}
