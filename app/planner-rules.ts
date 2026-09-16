/** Pure scheduling rules. Calendar dates are local YYYY-MM-DD keys. */
export function nextDay(key: string) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export function allowedDay(date: string, stream: string, kind: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  if (kind === "revision") return day === 0;
  if (day === 0) return false;
  return stream !== "Chemistry" || [2, 4, 6].includes(day);
}
export type DatedTask = { id: string; stream: string; kind: string; originalDate: string; scheduledDate: string; carriedForward: boolean };
export function placeRemaining<T extends DatedTask>(tasks: T[], completed: Map<string, T[]>, settings: Record<string, string>, today: string) {
  const effective = new Map([...completed].map(([date, items]) => [date, [...items]]));
  for (const task of tasks) {
    const candidate = settings[`planner.extra.${task.id}`];
    const requested = candidate && candidate >= today ? candidate : "";
    let date = requested && requested >= today ? requested : task.originalDate > today ? task.originalDate : today;
    const repeat = settings[`planner.repeat.${(task as T & { topic?: { id: string } }).topic?.id}`];
    if (repeat && repeat > date) date = repeat;
    // Completing a task never changes another task's earliest scheduled date.
    // An explicit extra request is the only way to bring future work forward.
    while (!allowedDay(date, task.stream, task.kind) || (!requested && (effective.get(date)?.length ?? 0) >= 2)) date = nextDay(date);
    effective.set(date, [...(effective.get(date) ?? []), { ...task, scheduledDate: date, carriedForward: date > task.originalDate }]);
  }
  return effective;
}
export function teachingDays(start: string, target: string) {
  let count = 0;
  for (let date = start; date <= target; date = nextDay(date)) if (new Date(`${date}T12:00:00Z`).getUTCDay() !== 0) count++;
  return count;
}
