import type { ErrorCategory } from "./learning-model";
import type {
  QuizFeedback,
  QuizOption,
  QuizQuestion,
  ReviewedQuizTopicId,
} from "./quiz-model";

type ChoiceQuestion = {
  id: string;
  prompt: string;
  type: "choice";
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  errorCategory: ErrorCategory;
};

type NumericQuestion = {
  id: string;
  prompt: string;
  type: "numeric";
  correctValue: number;
  tolerance?: number;
  answerLabel: string;
  answerSuffix?: string;
  placeholder?: string;
  explanation: string;
  errorCategory: ErrorCategory;
};

export type StoredQuizQuestion = ChoiceQuestion | NumericQuestion;

export const QUIZ_DURATION_SECONDS = 12 * 60;
export const QUIZ_VERSION = "math-foundations-v1";

const choice = (
  id: string,
  prompt: string,
  labels: string[],
  correctIndex: number,
  explanation: string,
  errorCategory: ErrorCategory = "Knowledge gap",
): ChoiceQuestion => ({
  id,
  prompt,
  type: "choice",
  options: labels.map((label, index) => ({ id: `${id}-${String.fromCharCode(97 + index)}`, label })),
  correctOptionId: `${id}-${String.fromCharCode(97 + correctIndex)}`,
  explanation,
  errorCategory,
});

const numeric = (
  id: string,
  prompt: string,
  correctValue: number,
  answerLabel: string,
  explanation: string,
  options: Partial<Pick<NumericQuestion, "tolerance" | "answerSuffix" | "placeholder" | "errorCategory">> = {},
): NumericQuestion => ({
  id,
  prompt,
  type: "numeric",
  correctValue,
  answerLabel,
  explanation,
  tolerance: options.tolerance,
  answerSuffix: options.answerSuffix,
  placeholder: options.placeholder,
  errorCategory: options.errorCategory ?? "Calculation error",
});

export const QUIZ_BANK: Record<ReviewedQuizTopicId, StoredQuizQuestion[]> = {
  "math-e1-1": [
    choice("e11-q1", "Which number is prime?", ["21", "29", "39", "51"], 1, "29 has exactly two positive factors: 1 and 29."),
    choice("e11-q2", "Which statement describes √50?", ["It is a natural number", "It is an integer", "It is rational", "It is irrational"], 3, "√50 = 5√2, and √2 is irrational."),
    choice("e11-q3", "Which is the prime factorisation of 360?", ["2³ × 3² × 5", "2² × 3³ × 5", "2³ × 3 × 5²", "2 × 3² × 5²"], 0, "360 = 36 × 10 = 2³ × 3² × 5."),
    numeric("e11-q4", "Find the highest common factor of 84 and 126.", 42, "42", "84 = 2² × 3 × 7 and 126 = 2 × 3² × 7, so the shared product is 2 × 3 × 7 = 42."),
    numeric("e11-q5", "Find the lowest common multiple of 18 and 24.", 72, "72", "Use the highest powers in the prime factors: 2³ × 3² = 72."),
    choice("e11-q6", "Which number is both a square number and a cube number?", ["24", "36", "64", "81"], 2, "64 = 8² and 64 = 4³."),
    numeric("e11-q7", "Write the reciprocal of −2.5 as a decimal.", -0.4, "−0.4", "The reciprocal is 1 ÷ (−2.5) = −0.4."),
    choice("e11-q8", "Write six billion, forty-two million, five thousand in figures.", ["6,042,005,000", "6,420,005,000", "6,042,050,000", "6,004,205,000"], 0, "Separate the place-value groups: 6 billion + 42 million + 5 thousand = 6,042,005,000."),
  ],
  "math-e1-4": [
    numeric("e14-q1", "Write 0.375 as a fraction in its simplest form. Enter a fraction.", 0.375, "3/8", "0.375 = 375/1000 = 3/8.", { tolerance: 1e-9, placeholder: "For example, 3/8", errorCategory: "Wrong method" }),
    numeric("e14-q2", "Write 7/20 as a percentage.", 35, "35%", "7/20 = 0.35, so multiply by 100 to get 35%.", { answerSuffix: "%" }),
    numeric("e14-q3", "Write 2 3/5 as a decimal.", 2.6, "2.6", "3/5 = 0.6, so 2 3/5 = 2.6."),
    numeric("e14-q4", "Write 0.272727… as a fraction in its simplest form. Enter a fraction.", 3 / 11, "3/11", "Let x = 0.272727… Then 100x − x = 27, so 99x = 27 and x = 3/11.", { tolerance: 1e-9, placeholder: "For example, 3/11", errorCategory: "Wrong method" }),
    choice("e14-q5", "Which decimal is equivalent to 5/6?", ["0.83", "0.8333…", "0.85", "0.8666…"], 1, "5 ÷ 6 = 0.8333…, with the 3 recurring."),
    numeric("e14-q6", "Simplify 42/56 fully. Enter a fraction.", 0.75, "3/4", "Divide the numerator and denominator by their HCF, 14: 42/56 = 3/4.", { tolerance: 1e-9, placeholder: "For example, 3/4", errorCategory: "Wrong method" }),
    numeric("e14-q7", "Write 135% as a decimal.", 1.35, "1.35", "Divide a percentage by 100: 135% = 1.35."),
    choice("e14-q8", "Which improper fraction equals 3 2/7?", ["19/7", "21/7", "23/7", "25/7"], 2, "3 × 7 + 2 = 23, so the improper fraction is 23/7."),
  ],
  "math-e1-10": [
    choice("e110-q1", "A length is 7.4 cm correct to the nearest 0.1 cm. Which interval is correct?", ["7.3 ≤ x < 7.5", "7.35 ≤ x < 7.45", "7.39 ≤ x < 7.41", "7.4 ≤ x < 7.5"], 1, "Half of 0.1 is 0.05, so subtract and add 0.05. The upper bound is not included."),
    numeric("e110-q2", "A population is 260 correct to the nearest 10. State its lower bound.", 255, "255", "Half of 10 is 5, so the lower bound is 260 − 5 = 255."),
    numeric("e110-q3", "A mass is 4.82 kg correct to the nearest 0.01 kg. State its upper bound.", 4.825, "4.825 kg", "Half of 0.01 is 0.005, so the upper bound is 4.82 + 0.005 = 4.825 kg.", { answerSuffix: "kg" }),
    numeric("e110-q4", "A rectangle has length 8.2 cm and width 5.6 cm, each correct to the nearest 0.1 cm. Find the upper bound of its perimeter.", 27.8, "27.8 cm", "Use both upper bounds: 2(8.25 + 5.65) = 27.8 cm.", { answerSuffix: "cm", errorCategory: "Wrong method" }),
    numeric("e110-q5", "The same rectangle is 8.2 cm by 5.6 cm, each correct to the nearest 0.1 cm. Find the lower bound of its area.", 45.2325, "45.2325 cm²", "Use both lower bounds: 8.15 × 5.55 = 45.2325 cm².", { answerSuffix: "cm²", tolerance: 1e-6, errorCategory: "Wrong method" }),
    numeric("e110-q6", "A distance is 150 m correct to the nearest 10 m and a time is 12 s correct to the nearest second. Find the lower bound of the speed.", 11.6, "11.6 m/s", "For the smallest speed, divide the lower distance by the upper time: 145 ÷ 12.5 = 11.6 m/s.", { answerSuffix: "m/s", tolerance: 1e-6, errorCategory: "Wrong method" }),
    numeric("e110-q7", "A value 25 is correct to the nearest whole number and 4.0 is correct to the nearest 0.1. Find the upper bound of 25 ÷ 4.0, giving 3 significant figures.", 6.46, "6.46", "For the largest quotient use 25.5 ÷ 3.95 = 6.455… = 6.46 to 3 significant figures.", { tolerance: 0.005, errorCategory: "Wrong method" }),
    choice("e110-q8", "Which value is included when x = 18 correct to the nearest whole number?", ["17.49", "17.5", "18.5", "18.51"], 1, "The interval is 17.5 ≤ x < 18.5, so 17.5 is included but 18.5 is not."),
  ],
  "math-e1-11": [
    choice("e111-q1", "Simplify the ratio 84 : 126.", ["2 : 3", "3 : 2", "4 : 5", "7 : 9"], 0, "Divide both parts by their HCF, 42, to get 2 : 3."),
    numeric("e111-q2", "Divide 420 in the ratio 3 : 4. What is the larger share?", 240, "240", "There are 7 parts. Each part is 420 ÷ 7 = 60, so the larger share is 4 × 60 = 240."),
    numeric("e111-q3", "A recipe uses 300 g of flour for 8 servings. How much flour is needed for 14 servings?", 525, "525 g", "300 ÷ 8 = 37.5 g per serving, and 37.5 × 14 = 525 g.", { answerSuffix: "g" }),
    numeric("e111-q4", "A map scale is 1 : 50 000. A road measures 7.2 cm on the map. Find its real length in kilometres.", 3.6, "3.6 km", "7.2 × 50 000 = 360 000 cm = 3.6 km.", { answerSuffix: "km", errorCategory: "Units or rounding" }),
    choice("e111-q5", "Which rice pack gives the lower price per kilogram?", ["750 g for Rs 390", "1.2 kg for Rs 600", "They cost the same per kg", "There is not enough information"], 1, "The prices are Rs 520/kg and Rs 500/kg, so the 1.2 kg pack is better value."),
    choice("e111-q6", "a : b = 5 : 7 and b : c = 14 : 9. Find a : b : c.", ["5 : 14 : 9", "10 : 14 : 9", "10 : 7 : 9", "5 : 7 : 9"], 1, "Double 5 : 7 to make b = 14, giving 10 : 14 : 9."),
    numeric("e111-q7", "The ratio of red counters to blue counters is 3 : 5. There are 64 counters altogether. How many are blue?", 40, "40", "There are 8 equal parts. Each is 64 ÷ 8 = 8, so blue = 5 × 8 = 40."),
    numeric("e111-q8", "A model uses a scale of 1 : 40. A real door is 3.6 m high. Find the model height in centimetres.", 9, "9 cm", "3.6 m = 360 cm, and 360 ÷ 40 = 9 cm.", { answerSuffix: "cm", errorCategory: "Units or rounding" }),
  ],
  "math-e1-13": [
    numeric("e113-q1", "Find 17.5% of 480.", 84, "84", "10% is 48, 5% is 24 and 2.5% is 12; together they make 84."),
    numeric("e113-q2", "Write 54 as a percentage of 72.", 75, "75%", "54 ÷ 72 × 100 = 75%.", { answerSuffix: "%" }),
    numeric("e113-q3", "Increase 640 by 12.5%.", 720, "720", "12.5% of 640 is 80, so the increased value is 640 + 80 = 720."),
    numeric("e113-q4", "A price falls from 250 to 215. Find the percentage decrease.", 14, "14%", "The decrease is 35. Calculate 35 ÷ 250 × 100 = 14%.", { answerSuffix: "%" }),
    numeric("e113-q5", "Rs 8000 is invested at 6% compound interest per year for 3 years. Find the final amount to the nearest paisa.", 9528.13, "Rs 9528.13", "8000 × 1.06³ = 9528.128, which is Rs 9528.13 to the nearest paisa.", { tolerance: 0.005 }),
    numeric("e113-q6", "A jacket costs Rs 680 after a 15% discount. Find its original price.", 800, "Rs 800", "The sale price is 85% of the original. Divide 680 by 0.85 to get 800.", { errorCategory: "Wrong method" }),
    numeric("e113-q7", "An item costs Rs 450 and is sold for Rs 540. Find the profit as a percentage of the cost price.", 20, "20%", "Profit = 540 − 450 = 90. Then 90 ÷ 450 × 100 = 20%.", { answerSuffix: "%" }),
    numeric("e113-q8", "A machine worth Rs 24 000 loses 8% of its value each year. Find its value after 2 years.", 20313.6, "Rs 20,313.60", "Repeated decrease uses a multiplier: 24 000 × 0.92² = 20 313.6."),
  ],
};

export function getQuizQuestions(topicId: ReviewedQuizTopicId) {
  return QUIZ_BANK[topicId];
}

export function publicQuestion(question: StoredQuizQuestion, number: number): QuizQuestion {
  return {
    id: question.id,
    number,
    prompt: question.prompt,
    type: question.type,
    options: question.type === "choice" ? question.options : undefined,
    answerSuffix: question.type === "numeric" ? question.answerSuffix : undefined,
    placeholder: question.type === "numeric" ? question.placeholder : undefined,
  };
}

function parseNumericResponse(value: string) {
  const normalized = value.trim().replace(/,/g, "").replace(/−/g, "-").replace(/%$/, "").trim();
  const mixed = normalized.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const numerator = Number(mixed[2]);
    const denominator = Number(mixed[3]);
    if (denominator === 0) return Number.NaN;
    return whole < 0 ? whole - numerator / denominator : whole + numerator / denominator;
  }
  const fraction = normalized.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? Number.NaN : Number(fraction[1]) / denominator;
  }
  return Number(normalized);
}

export function markQuestion(question: StoredQuizQuestion, rawResponse: unknown): {
  feedback: QuizFeedback;
  errorCategory: ErrorCategory | null;
} {
  const response = typeof rawResponse === "string" ? rawResponse.trim() : "";
  let responseLabel = response;
  let correct = false;
  let correctAnswer = "";
  if (question.type === "choice") {
    correct = response === question.correctOptionId;
    responseLabel = question.options.find((option) => option.id === response)?.label ?? response;
    correctAnswer = question.options.find((option) => option.id === question.correctOptionId)?.label ?? "";
  } else {
    const supplied = parseNumericResponse(response);
    const tolerance = question.tolerance ?? Math.max(1e-9, Math.abs(question.correctValue) * 1e-9);
    correct = Number.isFinite(supplied) && Math.abs(supplied - question.correctValue) <= tolerance;
    correctAnswer = question.answerLabel;
  }
  return {
    feedback: {
      questionId: question.id,
      prompt: question.prompt,
      response: responseLabel,
      correct,
      correctAnswer,
      explanation: question.explanation,
    },
    errorCategory: correct ? null : question.errorCategory,
  };
}
