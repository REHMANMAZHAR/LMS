import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { quizBankQuestions, settings } from "@/db/schema";
import { DAILY_QUIZ_VERSION, DAILY_QUIZZES, getDailyQuiz, type DailyQuiz, type PrivateQuestion } from "./daily-quiz-bank";
import { lessonIdentity, normaliseLessonTitle } from "./lesson-identity";
import { readManifest } from "./adaptive-plan";

const FAMILY_ID = "talha-family";
type BankRow = typeof quizBankQuestions.$inferSelect;
export type ResolvedQuiz = { quiz: DailyQuiz; version: string; durationSeconds: number; mode: "daily"|"weekly"; missingLessons: string[]; sourceNote: string };
function fromRows(rows: BankRow[], taskId: string): DailyQuiz | undefined {
  if (!rows.length) return;
  rows.sort((a,b)=>a.questionId.localeCompare(b.questionId));
  const questions: PrivateQuestion[] = rows.map(row => {
    const options = JSON.parse(row.optionsJson) as Array<{id:string;label:string}>;
    return { id: row.questionId, type: row.questionType as "choice"|"numeric", prompt: row.prompt,
      answer: row.answer, correctAnswer: row.correctAnswer, explanation: row.explanation,
      estimatedMinutes: row.estimatedMinutes, sourceReference: row.sourceReference ?? "Source not supplied",
      ...(row.questionType === "numeric" ? {placeholder:"Enter a number",tolerance:Number(options.find(item=>item.id==="tolerance")?.label || 0)} : {options}) };
  });
  return {taskId,stream:rows[0].subject as DailyQuiz["stream"],topicId:rows[0].topicId,lessonTitle:rows[0].lessonTitle,questions};
}
export async function resolveDailyQuiz(taskId: string): Promise<ResolvedQuiz | undefined> {
  const db=await getDb();
  const [bank,settingRows]=await Promise.all([
    db.select().from(quizBankQuestions).where(eq(quizBankQuestions.familyId,FAMILY_ID)),
    db.select().from(settings).where(eq(settings.familyId,FAMILY_ID)),
  ]);
  const values=Object.fromEntries(settingRows.map(row=>[row.key,row.value]));
  const manifest=readManifest(values);
  const tasks=manifest ? [...manifest.tasks,...manifest.history] : [];
  function resolveOne(id:string) {
    const scheduled=tasks.find(task=>task.id===id);
    const identity=scheduled?{topicId:scheduled.topic.id,title:scheduled.lesson.title}:lessonIdentity(id);
    let rows=bank.filter(row=>row.taskId===id && (!identity || row.topicId===identity.topicId));
    if (!rows.length && identity) {
      const candidates=bank.filter(row=>row.topicId===identity.topicId && normaliseLessonTitle(row.lessonTitle)===normaliseLessonTitle(identity.title));
      if(new Set(candidates.map(row=>row.taskId)).size===1)rows=candidates;
    }
    const imported=fromRows(rows,id);
    if(imported)return imported;
    const matches=identity?DAILY_QUIZZES.filter(quiz=>quiz.topicId===identity.topicId && normaliseLessonTitle(quiz.lessonTitle)===normaliseLessonTitle(identity.title)):[];
    const original=getDailyQuiz(id) ?? (matches.length===1?matches[0]:undefined);
    return original?{...original,taskId:id}:undefined;
  }
  let quiz: DailyQuiz | undefined;
  const missingLessons:string[]=[];
  let mode:"daily"|"weekly"="daily";
  if (/^v3:weekly:\d{4}-\d{2}-\d{2}$/.test(taskId)) {
    mode="weekly";
    const end=taskId.slice(-10), startDate=new Date(`${end}T12:00:00Z`);
    if (!Number.isFinite(startDate.getTime()) || startDate.getUTCDay()!==0) return;
    startDate.setUTCDate(startDate.getUTCDate()-6);
    const start=startDate.toISOString().slice(0,10);
    const studied=[...new Map(tasks.filter(task=>task.kind==="syllabus" && values[`planner.done.${task.id}`]>=start && values[`planner.done.${task.id}`]<=end).map(task=>[task.id,task])).values()];
    const questions:PrivateQuestion[]=[];
    const seen=new Set<string>();
    for(const task of studied) {
      const set=resolveOne(task.id);
      if(!set){missingLessons.push(task.lesson.title);continue;}
      for(const question of set.questions) {
        const key=`${set.topicId}:${question.id}`;
        if(seen.has(key))continue;
        seen.add(key);questions.push({...question,id:key});
      }
    }
    if(!questions.length)return;
    if(questions.length>80)missingLessons.push("Question limit reached: some reviewed questions were omitted.");
    quiz={taskId,stream:"Mathematics",topicId:"weekly",lessonTitle:`Weekly practice: ${start} to ${end}`,questions:questions.slice(0,80)};
  } else quiz=resolveOne(taskId);
  if(!quiz)return;
  const target=mode==="weekly"?60:20;
  const estimated=quiz.questions.reduce((sum,q)=>sum+(q.estimatedMinutes ?? 1),0);
  const durationSeconds=Math.min(target,Math.max(1,Math.ceil(estimated)))*60;
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify({quiz,missingLessons,version:DAILY_QUIZ_VERSION})));
  const version=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
  return {quiz,version,durationSeconds,mode,missingLessons,sourceNote:estimated<target || missingLessons.length
    ? `Partial practice bank: ${estimated} estimated question minutes available; ${target} minutes is the assessment target. This is not a complete past-paper assessment.`
    : "Question timings and source references come from the reviewed bank. This is an LMS assessment, not an official Cambridge paper."};
}
