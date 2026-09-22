import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { quizBankQuestions, settings } from "@/db/schema";
import { DAILY_QUIZ_VERSION, DAILY_QUIZZES, getDailyQuiz, type DailyQuiz, type PrivateQuestion } from "./daily-quiz-bank";
import { lessonIdentity, normaliseLessonTitle } from "./lesson-identity";
import { readManifest } from "./adaptive-plan";
import { getTopicObjectiveBank } from "./full-topic-objective-bank";
import { PAST_PAPER_REFERENCES, type PaperReference } from "./past-paper-catalogue";

const FAMILY_ID = "talha-family";
type BankRow = typeof quizBankQuestions.$inferSelect;
export type ResolvedQuiz = { quiz: DailyQuiz; version: string; durationSeconds: number; mode: "daily"|"weekly"; missingLessons: string[]; sourceNote: string; verifiedPastPaperReferences: PaperReference[] };
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
    if (original) return {...original,taskId:id};
    if (identity) {
      const fallback=getTopicObjectiveBank(identity.topicId);
      if (fallback?.questions.length) {
        return {taskId:id,stream:fallback.stream,topicId:fallback.topicId,lessonTitle:identity.title,questions:fallback.questions};
      }
    }
    return undefined;
  }
  let quiz: DailyQuiz | undefined;
  const missingLessons:string[]=[];
  let mode:"daily"|"weekly"="daily";
  const referenceTopicIds = new Set<string>();
  if (/^v3:weekly:\d{4}-\d{2}-\d{2}$/.test(taskId)) {
    mode="weekly";
    const end=taskId.slice(-10), startDate=new Date(`${end}T12:00:00Z`);
    if (!Number.isFinite(startDate.getTime()) || startDate.getUTCDay()!==0) return;
    startDate.setUTCDate(startDate.getUTCDate()-6);
    const start=startDate.toISOString().slice(0,10);
    const studied=[...new Map(tasks.filter(task=>task.kind==="syllabus" && values[`planner.done.${task.id}`]>=start && values[`planner.done.${task.id}`]<=end).map(task=>[task.id,task])).values()];
    const pools:Array<{topicId:string;title:string;questions:PrivateQuestion[];cursor:number}>=[];
    for(const task of studied) {
      const set=resolveOne(task.id);
      if(!set){missingLessons.push(task.lesson.title);continue;}
      referenceTopicIds.add(set.topicId);
      const deepQuestions = set.questions.filter((question) => question.id.includes("-deep-"));
      const otherQuestions = set.questions.filter((question) => !question.id.includes("-deep-"));
      pools.push({topicId:set.topicId,title:task.lesson.title,questions:[...deepQuestions, ...otherQuestions],cursor:0});
    }
    const questions:PrivateQuestion[]=[];
    const seen=new Set<string>();
    let estimatedMinutes=0;
    let madeProgress=true;
    while(madeProgress && estimatedMinutes<60 && questions.length<80) {
      madeProgress=false;
      for(const pool of pools) {
        while(pool.cursor<pool.questions.length) {
          const question=pool.questions[pool.cursor++];
          const key=`${pool.topicId}:${question.id}`;
          if(seen.has(key))continue;
          seen.add(key);
          const minutes=Math.max(1,question.estimatedMinutes ?? 1);
          if(estimatedMinutes+minutes>60)continue;
          questions.push({...question,id:key});
          estimatedMinutes+=minutes;
          madeProgress=true;
          break;
        }
        if(estimatedMinutes>=60 || questions.length>=80)break;
      }
    }
    if(!questions.length)return;
    quiz={taskId,stream:"Mathematics",topicId:"weekly",lessonTitle:`Weekend Quiz: ${start} to ${end}`,questions};
  } else {
    quiz=resolveOne(taskId);
    if (quiz?.topicId && quiz.topicId !== "weekly") referenceTopicIds.add(quiz.topicId);
  }
  if(!quiz)return;
  const target=mode==="weekly"?60:20;
  const estimated=quiz.questions.reduce((sum,q)=>sum+(q.estimatedMinutes ?? 1),0);
  const durationSeconds=(mode==="weekly" ? 60 : Math.min(target,Math.max(1,Math.ceil(estimated))))*60;
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify({quiz,missingLessons,version:DAILY_QUIZ_VERSION})));
  const version=Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
  const verifiedPastPaperReferences = PAST_PAPER_REFERENCES.filter((entry) => referenceTopicIds.has(entry.topicId)).slice(0, 8);
  return {quiz,version,durationSeconds,mode,missingLessons,verifiedPastPaperReferences,sourceNote:estimated<target || missingLessons.length
    ? `The quiz covers every completed lesson for which reviewed questions are available. ${estimated} estimated question minutes were selected; ${target} minutes is reserved for the weekend attempt and review.`
    : "A balanced 60-minute quiz was assembled from the lessons completed during this week. Source references remain in the controlled bank."};
}
