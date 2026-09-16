import { TOPICS } from "./data";
import { ACTIVE_PLAN_VERSION, STARTER_LESSONS, topicLesson, topicLessonCount } from "./lesson-plan";
export function lessonIdentity(taskId: string) {
  const prefix = `${ACTIVE_PLAN_VERSION}:`;
  if (!taskId.startsWith(prefix)) return undefined;
  const parts = taskId.slice(prefix.length).split(":");
  if (parts[0] === "guided" && parts.length === 4) {
    const lessons = STARTER_LESSONS[parts[1] as keyof typeof STARTER_LESSONS];
    const lesson = lessons?.[Number(parts[3]) - 1];
    if (lesson?.topicId === parts[2]) return { topicId: lesson.topicId, title: lesson.title };
  }
  if (parts[0] === "topic" && parts.length === 3) {
    const topic = TOPICS.find((item) => item.id === parts[1]);
    const index = Number(parts[2]);
    if (topic && Number.isInteger(index) && index > 0 && index <= topicLessonCount(topic, 180)) return { topicId: topic.id, title: topicLesson(topic, index, topicLessonCount(topic, 180)).title };
  }
  return undefined;
}
export const normaliseLessonTitle = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, " ").trim();
