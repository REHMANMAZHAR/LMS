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
export const QUIZ_VERSION = "all-subjects-phase-2-v1";

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
  "chem-2-4": [
    choice("c24-q1", "How does a magnesium atom form a magnesium ion, Mg²⁺?", ["It gains two electrons", "It loses two electrons", "It gains two protons", "It loses two neutrons"], 1, "Magnesium has two outer-shell electrons and forms Mg²⁺ by losing both of them."),
    choice("c24-q2", "Which change forms an oxide ion, O²⁻, from an oxygen atom?", ["Gain two electrons", "Lose two electrons", "Gain two protons", "Lose two protons"], 0, "An oxygen atom gains two electrons to complete its outer shell, giving it a 2− charge."),
    choice("c24-q3", "Which statement gives the best definition of an ionic bond?", ["A shared pair of electrons", "Attraction between nuclei and shared electrons", "Strong electrostatic attraction between oppositely charged ions", "Weak attraction between simple molecules"], 2, "An ionic bond is the strong electrostatic attraction between positive and negative ions."),
    choice("c24-q4", "What is the correct formula of aluminium oxide, formed from Al³⁺ and O²⁻ ions?", ["AlO", "Al₂O", "AlO₂", "Al₂O₃"], 3, "Two Al³⁺ ions give +6 and three O²⁻ ions give −6, so the neutral formula is Al₂O₃."),
    choice("c24-q5", "Why does solid sodium chloride not conduct electricity?", ["It contains no charged particles", "Its ions are fixed in lattice positions", "Its electrons have all been removed", "Its ions are neutral in the solid"], 1, "The ions are charged, but in a solid lattice they cannot move and carry current."),
    choice("c24-q6", "Why does molten sodium chloride conduct electricity?", ["Its molecules become charged", "Its ions become free to move", "It produces delocalised electrons", "Its covalent bonds break into atoms"], 1, "Melting frees the ions to move through the liquid and carry charge."),
    choice("c24-q7", "Why do ionic compounds usually have high melting points?", ["They contain weak forces between molecules", "They contain strong attractions throughout a giant lattice", "Their ions have no outer electrons", "They always contain very heavy atoms"], 1, "A large amount of energy is needed to overcome strong electrostatic attractions throughout the giant ionic lattice."),
    choice("c24-q8", "Which description correctly explains the formation of calcium chloride, CaCl₂?", ["Calcium gains one electron from each chlorine atom", "Calcium shares one electron with two chlorine atoms", "Calcium loses two electrons and each chlorine gains one", "Calcium loses one electron and chlorine gains two"], 2, "Calcium forms Ca²⁺ by losing two electrons; two chlorine atoms each gain one electron to form two Cl⁻ ions."),
  ],
  "chem-3-1": [
    choice("c31-q1", "What does the molecular formula of a compound show?", ["The simplest ratio of its elements", "The number and type of atoms in one molecule", "Only the elements present, not their numbers", "The arrangement of every bond in the molecule"], 1, "A molecular formula states the actual number and type of each atom in one molecule."),
    choice("c31-q2", "What is meant by the empirical formula of a compound?", ["The total number of atoms in one molecule", "The simplest whole-number ratio of its atoms or ions", "The displayed arrangement of all its bonds", "The relative mass of one molecule"], 1, "An empirical formula gives the simplest whole-number ratio of the different atoms or ions."),
    choice("c31-q3", "What is the correct formula of magnesium nitrate?", ["MgNO₃", "Mg₂NO₃", "Mg(NO₃)₂", "Mg₂(NO₃)₃"], 2, "Mg²⁺ needs two nitrate ions, NO₃⁻, to balance the charge, giving Mg(NO₃)₂."),
    choice("c31-q4", "Which set of coefficients balances C₃H₈ + O₂ → CO₂ + H₂O?", ["1, 3, 3, 4", "1, 4, 3, 4", "1, 5, 3, 4", "2, 5, 6, 8"], 2, "The balanced equation is C₃H₈ + 5O₂ → 3CO₂ + 4H₂O."),
    choice("c31-q5", "Which state symbol means that a substance is dissolved in water?", ["(s)", "(l)", "(g)", "(aq)"], 3, "The symbol (aq) means aqueous: dissolved in water."),
    choice("c31-q6", "Which is the ionic equation for neutralisation by an acid and an alkali?", ["H⁺ + Cl⁻ → HCl", "H⁺ + OH⁻ → H₂O", "Na⁺ + OH⁻ → NaOH", "2H⁺ + O²⁻ → H₂"], 1, "The reacting ions are H⁺ and OH⁻; spectator ions are omitted."),
    choice("c31-q7", "Which coefficients balance Al + O₂ → Al₂O₃?", ["2, 1, 1", "4, 3, 2", "2, 3, 1", "3, 2, 1"], 1, "4Al + 3O₂ → 2Al₂O₃ gives four aluminium atoms and six oxygen atoms on each side."),
    choice("c31-q8", "Which equation correctly represents calcium carbonate reacting with hydrochloric acid?", ["CaCO₃ + HCl → CaCl + H₂O + CO₂", "CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂", "CaCO₃ + 2HCl → CaCl₂ + H₂ + CO₃", "CaCO₃ + HCl → CaCl₂ + H₂O"], 1, "An acid plus a carbonate forms a salt, water and carbon dioxide; two HCl are needed to balance the equation."),
  ],
  "chem-3-3a": [
    choice("c33a-q1", "What is the value of the Avogadro constant used in this syllabus?", ["6.02 × 10²⁰", "6.02 × 10²²", "6.02 × 10²³", "6.02 × 10²⁴"], 2, "One mole contains 6.02 × 10²³ specified particles."),
    numeric("c33a-q2", "How many moles are present in 9.0 g of water, H₂O? Use Ar: H = 1, O = 16.", 0.5, "0.50 mol", "Mr(H₂O) = 18. Amount = 9.0 ÷ 18 = 0.50 mol.", { answerSuffix: "mol" }),
    numeric("c33a-q3", "Find the mass of 0.25 mol of carbon dioxide, CO₂. Use Ar: C = 12, O = 16.", 11, "11 g", "Mr(CO₂) = 44. Mass = 0.25 × 44 = 11 g.", { answerSuffix: "g" }),
    choice("c33a-q4", "How many molecules are in 0.20 mol of a molecular substance?", ["1.204 × 10²²", "1.204 × 10²³", "3.01 × 10²³", "6.02 × 10²³"], 1, "0.20 × 6.02 × 10²³ = 1.204 × 10²³ molecules."),
    numeric("c33a-q5", "What volume does 0.75 mol of gas occupy at room temperature and pressure?", 18, "18 dm³", "At r.t.p., one mole of gas occupies 24 dm³. Therefore 0.75 × 24 = 18 dm³.", { answerSuffix: "dm³" }),
    numeric("c33a-q6", "A solution contains 0.20 mol of solute in 250 cm³. Calculate its concentration in mol/dm³.", 0.8, "0.80 mol/dm³", "250 cm³ = 0.250 dm³. Concentration = 0.20 ÷ 0.250 = 0.80 mol/dm³.", { answerSuffix: "mol/dm³" }),
    numeric("c33a-q7", "How many moles of gas occupy 4.8 dm³ at room temperature and pressure?", 0.2, "0.20 mol", "Amount = 4.8 ÷ 24 = 0.20 mol.", { answerSuffix: "mol" }),
    numeric("c33a-q8", "Calculate the relative formula mass of sulfuric acid, H₂SO₄. Use Ar: H = 1, S = 32, O = 16.", 98, "98", "Mr = (2 × 1) + 32 + (4 × 16) = 98."),
  ],
  "chem-6-2a": [
    choice("c62a-q1", "What is activation energy?", ["The energy released when products form", "The minimum energy colliding particles need to react", "The total kinetic energy of all particles", "The energy stored only in a catalyst"], 1, "Activation energy is the minimum energy that colliding particles must have for a reaction to occur."),
    choice("c62a-q2", "Why does increasing temperature usually increase reaction rate?", ["Particles become larger", "More particles have energy at least equal to the activation energy", "The activation energy always increases", "The concentration automatically doubles"], 1, "At higher temperature particles move faster, collide more often and a greater fraction of collisions exceed the activation energy."),
    choice("c62a-q3", "Why does increasing the concentration of a reactant solution increase reaction rate?", ["There are more particles per unit volume", "Each particle becomes more massive", "The products have less energy", "The activation energy becomes zero"], 0, "More particles per unit volume cause more frequent collisions."),
    choice("c62a-q4", "Why can increasing the pressure of reacting gases increase reaction rate?", ["It spreads the particles farther apart", "It puts more gas particles into each unit volume", "It changes every gas into a liquid", "It prevents particles from colliding"], 1, "Higher pressure brings gas particles closer together, increasing collision frequency."),
    choice("c62a-q5", "Why does powdered calcium carbonate react faster than equal-mass marble chips?", ["The powder has a greater surface area", "The powder has a different formula", "The powder has a higher activation energy", "The powder contains more total particles"], 0, "Powder exposes more surface for collisions while the amount and chemical identity remain the same."),
    choice("c62a-q6", "How does a catalyst increase reaction rate?", ["It raises the temperature permanently", "It provides a pathway with lower activation energy", "It increases the mass of products", "It is used up to provide energy"], 1, "A catalyst provides an alternative reaction pathway with lower activation energy and is unchanged at the end."),
    choice("c62a-q7", "On a graph of product formed against time, what indicates the greatest initial reaction rate?", ["The lowest final value", "The steepest initial gradient", "The longest reaction time", "The flattest initial line"], 1, "Rate is the gradient of the graph, so the steepest initial gradient shows the greatest initial rate."),
    choice("c62a-q8", "A catalyst is added but the starting amounts of reactants stay the same. What happens to the final amount of product in a reaction that goes to completion?", ["It increases", "It decreases", "It stays the same but forms sooner", "No product forms"], 2, "A catalyst changes the rate, not the stoichiometric amount of product made from fixed reactant amounts."),
  ],
  "chem-7-3": [
    choice("c73-q1", "Which method is suitable for preparing pure copper(II) sulfate crystals from dilute sulfuric acid?", ["Titrate with sodium hydroxide", "Add excess copper(II) oxide, filter, then crystallise", "Mix with silver nitrate and filter", "Evaporate the acid to dryness"], 1, "An excess insoluble base uses all the acid; filtration removes excess solid before the solution is crystallised."),
    choice("c73-q2", "Why is titration used to prepare a pure soluble sodium salt from an acid and sodium hydroxide?", ["Both reactants are soluble, so excess cannot be filtered off", "The sodium salt is always insoluble", "Titration makes sodium hydroxide evaporate", "An indicator becomes part of the salt"], 0, "Because acid and alkali are both soluble, titration finds exact neutralising volumes without leaving an excess reactant."),
    choice("c73-q3", "Which method is used to prepare insoluble barium sulfate?", ["Fractional distillation", "Precipitation from two suitable solutions", "Titration followed by evaporation", "Heating barium metal in sulfur"], 1, "Mixing solutions containing Ba²⁺ and SO₄²⁻ forms insoluble barium sulfate as a precipitate."),
    choice("c73-q4", "Which statement about nitrate salts is correct?", ["All nitrates are soluble", "Only sodium nitrates are soluble", "All nitrates are insoluble", "Only metal nitrates are insoluble"], 0, "The general solubility rule is that all nitrate salts are soluble."),
    choice("c73-q5", "Which chloride is insoluble in water?", ["Sodium chloride", "Potassium chloride", "Ammonium chloride", "Silver chloride"], 3, "Most chlorides are soluble, but silver chloride and lead chloride are exceptions."),
    choice("c73-q6", "Which sulfate is insoluble in water?", ["Sodium sulfate", "Potassium sulfate", "Barium sulfate", "Ammonium sulfate"], 2, "Barium sulfate is an exception to the general rule that sulfates are soluble."),
    choice("c73-q7", "What is water of crystallisation?", ["Water used only to wash crystals", "Water molecules chemically present in hydrated crystals", "Steam released by any hot solid", "Water trapped between dry powder grains"], 1, "Water of crystallisation is water chemically combined in the structure of hydrated crystals."),
    choice("c73-q8", "After making a salt solution, which sequence is best for obtaining dry crystals?", ["Evaporate completely to dryness, then add water", "Concentrate to near saturation, cool, filter and dry", "Freeze the solution, then boil it", "Add indicator, filter and burn the residue"], 1, "Concentrating and cooling lets crystals form; they are then filtered and dried without destructive heating to dryness."),
  ],
  "pak-kq3": [
    choice("pkq3-q1", "What was the immediate issue that helped trigger the War of Independence in 1857?", ["The partition of Bengal", "Cartridges believed to be greased with cow and pig fat", "The introduction of separate electorates", "The Simon Commission"], 1, "Many sepoys believed the new cartridges had to be bitten open and were greased with substances offensive to both Hindu and Muslim religious beliefs."),
    choice("pkq3-q2", "How did the Doctrine of Lapse contribute to resentment before the War of Independence?", ["It annexed states when a ruler had no natural male heir recognised by the British", "It forced all farmers to grow indigo", "It ended British trade with princely states", "It gave every ruler full independence"], 0, "The policy allowed the East India Company to annex certain princely states where it did not recognise a natural male heir."),
    choice("pkq3-q3", "Who became the symbolic leader of the uprising at Delhi in 1857?", ["Bahadur Shah Zafar", "Sir Syed Ahmad Khan", "Lord Mountbatten", "Muhammad Ali Jinnah"], 0, "The rebels in Delhi looked to the last Mughal emperor, Bahadur Shah Zafar, as their symbolic leader."),
    choice("pkq3-q4", "Which weakness most directly limited coordination among the forces opposing British rule in 1857–58?", ["They had one strong central command", "They agreed on a detailed plan for the whole subcontinent", "They had divided aims and no effective unified leadership", "They controlled every major port"], 2, "The uprising involved different local leaders and aims, without an effective single command or coordinated strategy."),
    choice("pkq3-q5", "Which factor gave the British an important military and communications advantage during the War?", ["Support from every rebel leader", "Telegraph, transport links and reinforcements", "A complete lack of Indian soldiers", "Control of no major cities"], 1, "Communications, transport, disciplined forces and reinforcements helped the British concentrate resources against separate centres of revolt."),
    choice("pkq3-q6", "What major change followed the Government of India Act of 1858?", ["The East India Company gained more political power", "Rule passed from the East India Company to the British Crown", "The Mughal Empire was restored", "India immediately became independent"], 1, "The Act ended East India Company rule and transferred governing authority to the British Crown."),
    choice("pkq3-q7", "Which was a British policy response after the War of Independence?", ["Restoring Bahadur Shah Zafar as emperor", "Reorganising the army to reduce the risk of another united revolt", "Ending all princely states immediately", "Removing all British troops from India"], 1, "The British reorganised recruitment and the balance of forces so that a similar large, coordinated military uprising would be harder."),
    choice("pkq3-q8", "Why did many Muslims face especially severe short-term consequences after the War?", ["The British often associated them with the former Mughal leadership and rebellion", "They had all remained neutral", "They controlled the British Parliament", "They had already formed the Muslim League"], 0, "British officials often blamed Muslims strongly because of the uprising's association with Delhi and the Mughal emperor, leading to suspicion and reprisals."),
  ],
  "pak-kq4": [
    choice("pkq4-q1", "What was an important purpose of Sir Syed Ahmad Khan's Scientific Society?", ["To translate useful Western works and spread modern knowledge", "To organise an armed uprising", "To replace Urdu with Latin", "To campaign for immediate partition"], 0, "The Scientific Society translated and shared modern educational and scientific material so Muslims could gain useful knowledge."),
    choice("pkq4-q2", "Which institution is most closely associated with the educational work of the Aligarh Movement?", ["Muhammadan Anglo-Oriental College", "Fort William College", "University of Calcutta", "Deoband Seminary"], 0, "The Muhammadan Anglo-Oriental College at Aligarh became the central institution of Sir Syed's modern educational movement."),
    choice("pkq4-q3", "What did Sir Syed's Two-Nation idea emphasise?", ["Muslims and Hindus had identical political interests in every matter", "Muslims and Hindus were distinct communities with different identities and interests", "Only language could define a nation", "British rule should continue forever"], 1, "He argued that Muslims and Hindus were distinct communities whose political and cultural interests could differ."),
    choice("pkq4-q4", "Why was the Hindi–Urdu Controversy important to Sir Syed's political thinking?", ["It convinced him that communal interests and identities could conflict", "It ended the use of every Indian language", "It created the Muslim League in 1867", "It made Persian the national language"], 0, "The dispute over replacing Urdu with Hindi strengthened his concern that majority and Muslim cultural interests might conflict."),
    choice("pkq4-q5", "Why did Sir Syed write about the causes of the 1857 uprising?", ["To explain Indian grievances and reduce British misunderstanding", "To demand another immediate uprising", "To praise the cartridge policy", "To abolish modern education"], 0, "He tried to explain underlying grievances and British mistakes, helping rebuild understanding after the conflict."),
    choice("pkq4-q6", "What was a central aim of the Muhammadan Educational Conference?", ["To promote modern education among Muslims", "To organise the Hijrat Movement", "To negotiate the Cabinet Mission Plan", "To establish direct British rule"], 0, "The Conference encouraged educational progress, cooperation and the spread of schools among Muslims."),
    choice("pkq4-q7", "Why did Sir Syed advise many Muslims to avoid joining the Indian National Congress at that time?", ["He feared majority politics could overlook Muslim interests before Muslims had advanced educationally", "He believed Muslims should never study politics", "Congress supported the Aligarh College too strongly", "The Congress had already created Pakistan"], 0, "He believed Muslims first needed educational progress and safeguards because representative majority politics could weaken their position."),
    choice("pkq4-q8", "Which combination best summarises Sir Syed's strategy for Muslim advancement?", ["Modern education, improved British–Muslim relations and political awareness", "Military revolt, isolation and rejection of science", "Ending Urdu and closing colleges", "Supporting every Congress proposal without question"], 0, "His programme combined modern education, reconciliation after 1857 and a clearer awareness of separate Muslim interests."),
  ],
  "pak-kq7": [
    choice("pkq7-q1", "What was a main aim of the Khilafat Movement after the First World War?", ["To protect the position of the Ottoman Caliph and Islamic holy places", "To support the partition of Bengal in 1905", "To create the Simon Commission", "To abolish the Ottoman Caliphate"], 0, "Supporters wanted the post-war settlement to preserve the Ottoman Caliph's position and control connected with Muslim holy places."),
    choice("pkq7-q2", "Which pair were prominent leaders of the Khilafat Movement in the subcontinent?", ["Muhammad Ali and Shaukat Ali", "Jinnah and Lord Wavell", "Nehru and Lord Curzon", "Ayub Khan and Yahya Khan"], 0, "The Ali brothers, Muhammad Ali and Shaukat Ali, were leading organisers and speakers for the movement."),
    choice("pkq7-q3", "With which wider campaign did the Khilafat leaders cooperate under Gandhi?", ["The Non-Cooperation Movement", "The Swadeshi Movement of 1905 only", "The Civil Disobedience Movement of 1930", "The Quit India Movement of 1942"], 0, "Khilafat leaders and Gandhi cooperated through Non-Cooperation, creating a period of Hindu–Muslim political action together."),
    choice("pkq7-q4", "Where did participants in the Hijrat Movement try to migrate in 1920?", ["Afghanistan", "Turkey", "Egypt", "Britain"], 0, "Some Muslims left British India for Afghanistan, believing they should migrate from territory they regarded as unsafe for Islamic life."),
    choice("pkq7-q5", "Why did the Hijrat Movement bring hardship to many participants?", ["Afghanistan could not accept them and many returned after losing homes or livelihoods", "They were all given government jobs", "The British paid for permanent settlement", "It immediately achieved self-government"], 0, "Afghanistan restricted entry, and many migrants returned having sold property or abandoned livelihoods."),
    choice("pkq7-q6", "Which event led Gandhi to suspend the Non-Cooperation Movement in 1922?", ["The violence at Chauri Chaura", "The Simla Conference", "The Round Table Conferences", "The Lahore Resolution"], 0, "After protesters killed police officers at Chauri Chaura, Gandhi halted Non-Cooperation because it had become violent."),
    choice("pkq7-q7", "What event in Turkey removed the Khilafat Movement's central objective in 1924?", ["Mustafa Kemal's government abolished the Caliphate", "The Ottoman Empire captured India", "Britain restored the Ottoman Sultan's full power", "Turkey joined the Muslim League"], 0, "The Turkish Republic abolished the Caliphate in 1924, removing the institution the movement had tried to protect."),
    choice("pkq7-q8", "Which was an important political impact of the Khilafat Movement despite its failure?", ["It mobilised many Muslims and briefly strengthened Hindu–Muslim cooperation", "It ended all political activity among Muslims", "It achieved Pakistan in 1924", "It permanently united every political organisation"], 0, "The movement widened mass political participation and briefly created cooperation, even though its immediate objective failed."),
  ],
  "pak-kq9": [
    choice("pkq9-q1", "Which 1940 decision called for independent states in the Muslim-majority north-western and eastern zones?", ["The Lahore (Pakistan) Resolution", "The Nehru Report", "The Delhi Proposals", "The Communal Award"], 0, "The Muslim League adopted the Lahore Resolution in March 1940, setting out a demand based on Muslim-majority zones."),
    choice("pkq9-q2", "What did the Cripps Mission of 1942 offer for India after the Second World War?", ["Dominion status with provinces able to opt out of the future union", "Immediate partition under the Radcliffe Award", "A return to East India Company rule", "No constitutional change of any kind"], 0, "Cripps proposed post-war dominion status and allowed provinces not to join the proposed union, but the main parties rejected the plan."),
    choice("pkq9-q3", "What was a central disagreement in the Gandhi–Jinnah talks of 1944?", ["Whether and how the demand for Pakistan would be accepted", "Whether the Mughal Empire should return", "Whether Bengal should be partitioned in 1905", "Whether the Caliphate should be abolished"], 0, "The talks failed because Gandhi and Jinnah could not agree on recognition, timing and the practical basis of Pakistan."),
    choice("pkq9-q4", "Why did the Simla Conference of 1945 fail?", ["There was no agreement over Muslim representation in the proposed Executive Council", "The British refused to attend their own conference", "The Congress accepted every Muslim League demand", "India had already become independent"], 0, "A central dispute was the Muslim League's claim to nominate the Muslim members and disagreement over representation."),
    choice("pkq9-q5", "Why were the 1945–46 elections important to the Muslim League?", ["Success in Muslim seats strengthened its claim to represent Muslim political opinion", "They ended the demand for Pakistan", "They gave the League every non-Muslim seat", "They abolished provincial government"], 0, "The League's strong performance in Muslim constituencies gave it greater authority in negotiations with Britain and Congress."),
    choice("pkq9-q6", "What was a central feature of the Cabinet Mission Plan of 1946?", ["A united Indian union with provinces arranged in groups and a limited centre", "Immediate rule by the Ottoman Caliph", "Permanent cancellation of all provincial governments", "Partition by the Radcliffe boundary before negotiations"], 0, "The plan tried to keep India united through a limited central union and grouped provinces, but agreement over its operation broke down."),
    choice("pkq9-q7", "What did the 3 June Plan of 1947 accept as the route to transfer power?", ["Partition and the creation of two dominions", "A restored Mughal Empire", "Ten more years of war before negotiations", "A single state ruled by the East India Company"], 0, "The plan accepted partition and set the process for creating the dominions of Pakistan and India."),
    choice("pkq9-q8", "What was the task of the Radcliffe Commission in 1947?", ["To draw the new boundaries in Punjab and Bengal", "To write the Lahore Resolution", "To lead the Khilafat delegation", "To run the 1937 elections"], 0, "The boundary commissions chaired by Cyril Radcliffe determined the partition lines in Punjab and Bengal."),
  ],
  "pak-p2-4": [
    choice("pp24-q1", "Which is mainly a rabi crop in Pakistan?", ["Wheat", "Rice", "Cotton", "Millet grown during the monsoon"], 0, "Wheat is a major rabi crop, generally sown in the cooler season and harvested in spring or early summer."),
    choice("pp24-q2", "Which is mainly a kharif crop in Pakistan?", ["Wheat", "Gram", "Rice", "Mustard"], 2, "Rice is a major kharif crop grown during the warm monsoon-season cycle."),
    choice("pp24-q3", "Why is irrigation especially important for farming across much of the Indus Plain?", ["Rainfall is often low or unreliable compared with crop water needs", "Every crop grows only in sea water", "The soil contains no minerals", "Temperatures are always below freezing"], 0, "Canals and tube wells supply water where rainfall is insufficient or unreliable for intensive cultivation."),
    choice("pp24-q4", "How can excessive canal seepage and poor drainage damage farmland?", ["By causing waterlogging and salinity", "By creating volcanic soil", "By removing every river", "By turning all crops into forests"], 0, "A rising water table can waterlog soil; evaporation then leaves salts near the surface and reduces yields."),
    choice("pp24-q5", "How does lining an irrigation canal help conserve water?", ["It reduces seepage into the ground", "It increases evaporation", "It makes the canal longer", "It adds salt to the soil"], 0, "An impermeable lining reduces water loss through the canal bed and sides."),
    choice("pp24-q6", "Which package is most likely to raise crop yield per hectare when managed well?", ["Improved seed, suitable fertiliser, reliable water and pest control", "Less seed and no water", "Removing farm advice and storage", "Growing every crop in unsuitable soil"], 0, "Higher-yielding seed performs best when the farmer can also provide the water, nutrients and protection it requires."),
    choice("pp24-q7", "What distinguishes subsistence farming from commercial farming?", ["Subsistence farming mainly produces for the farmer's household", "Subsistence farming uses only imported labour", "Commercial farming never sells crops", "Commercial farming cannot use machinery"], 0, "Subsistence production is primarily for household needs, while commercial production is mainly for sale."),
    choice("pp24-q8", "What is barani farming?", ["Farming that depends mainly on rainfall", "Farming only inside greenhouses", "Farming irrigated only by sea water", "Farming without any soil"], 0, "Barani or rain-fed farming relies mainly on rainfall rather than a dependable canal irrigation supply."),
  ],
  "isl-p1-2a": [
    choice("ip12a-q1", "Between which years was the Qur'an revealed to the Prophet Muhammad (pbuh)?", ["570–610", "610–632", "622–661", "632–656"], 1, "Revelation began in 610 and continued until the Prophet's death in 632."),
    choice("ip12a-q2", "Where did the Prophet Muhammad (pbuh) receive the first revelation?", ["The Cave of Hira", "The Cave of Thawr", "The mosque at Quba", "The plain of Arafat"], 0, "The first revelation came while the Prophet was worshipping in the Cave of Hira near Makka."),
    choice("ip12a-q3", "Which angel brought Qur'anic revelation to the Prophet Muhammad (pbuh)?", ["Israfil", "Mikail", "Jibril", "Malik"], 2, "Muslims believe Angel Jibril conveyed the revealed words to the Prophet."),
    choice("ip12a-q4", "Which verses are traditionally identified with the first revelation?", ["Sura 1:1–7", "Sura 2:255", "Sura 96:1–5", "Sura 112:1–4"], 2, "The opening verses of Sura al-'Alaq, 96:1–5, begin with the command to read or recite."),
    choice("ip12a-q5", "What does Laylat al-Qadr commemorate in relation to the Qur'an?", ["The beginning of Qur'anic revelation", "The Battle of Badr", "The migration to Abyssinia", "The compilation under Uthman"], 0, "Laylat al-Qadr, the Night of Power, is linked with the beginning of the Qur'an's revelation."),
    choice("ip12a-q6", "What is the usual basis for classifying a revelation as Makkan or Madinan?", ["Whether it came before or after the Hijra", "The length of the sura only", "Whether it was written on parchment", "The present page number in the Qur'an"], 0, "Makkan revelations are those from before the Hijra; Madinan revelations are those from after it, even if the physical location differed."),
    choice("ip12a-q7", "Why was gradual revelation over the Prophet's mission important?", ["It guided developing situations and made teaching and memorisation manageable", "It prevented companions from learning any verses", "It meant revelation could be changed by rulers", "It removed the need to apply teachings"], 0, "Revelation responded to events and questions while allowing teachings to be learned, applied and preserved over time."),
    choice("ip12a-q8", "How was revealed material preserved during the Prophet's lifetime?", ["Only through later printed books", "Through memorisation and writing by appointed scribes", "Only by foreign governments", "It was not preserved until centuries later"], 1, "Companions memorised the revelations, and scribes wrote them on available materials under the Prophet's direction."),
  ],
  "isl-p1-2b": [
    choice("ip12b-q1", "Which event created particular urgency for collecting the Qur'an into one verified collection after the Prophet's death?", ["The deaths of reciters at the Battle of Yamama", "The building of the Ka'ba", "The Treaty of Hudaybiyya", "The migration to Abyssinia"], 0, "The loss of Qur'an reciters at Yamama raised concern that parts held in memory could be lost as more reciters died."),
    choice("ip12b-q2", "Who urged Caliph Abu Bakr to authorise the first official collection of the Qur'an?", ["Umar ibn al-Khattab", "Abu Sufyan", "Mu'awiya", "Khalid ibn al-Walid"], 0, "Umar pressed the need for collection after Yamama, and Abu Bakr eventually accepted the proposal."),
    choice("ip12b-q3", "Who was appointed to lead the collection of the Qur'an under Abu Bakr?", ["Zayd ibn Thabit", "Bilal ibn Rabah", "Abu Talib", "Salman al-Farsi"], 0, "Zayd ibn Thabit, a trusted revelation scribe, was given responsibility for gathering and verifying the text."),
    choice("ip12b-q4", "What kinds of evidence were used in the first official collection?", ["Verified written material together with the testimony and memory of reciters", "Only one person's memory", "Translations made in Europe", "Later historical poems only"], 0, "Zayd gathered written revelations and checked them through those who had learned the Qur'an, using careful verification."),
    choice("ip12b-q5", "After Abu Bakr and then Umar, with whom were the collected sheets kept?", ["Hafsa bint Umar", "A'isha's father", "The governor of Egypt", "The Byzantine emperor"], 0, "The sheets passed from Abu Bakr to Umar and were then kept by Umar's daughter Hafsa."),
    choice("ip12b-q6", "Why did Caliph Uthman order standard copies of the Qur'an to be prepared?", ["Differences in recitation were causing disputes as Islam spread", "The Qur'an had never been memorised", "He wanted to add new chapters", "He wished to replace Arabic with another language"], 0, "Reports of disputes over recitation among Muslims from different regions led Uthman to standardise authorised copies."),
    choice("ip12b-q7", "Who again led the committee that prepared the standard text under Uthman?", ["Zayd ibn Thabit", "Abu Lahab", "Heraclius", "Musaylima"], 0, "Zayd ibn Thabit led a committee of companions in preparing standard copies from the verified sheets."),
    choice("ip12b-q8", "What was the main purpose of sending standard copies to major centres?", ["To preserve a common authoritative text and prevent division", "To prevent Muslims from reading the Qur'an", "To create different Qur'ans for each province", "To replace memorisation with secrecy"], 0, "Authorised copies helped communities use a common consonantal text and protected unity in recitation."),
  ],
  "isl-p1-3c": [
    choice("ip13c-q1", "What does the Hijra of 622 refer to?", ["The Prophet's migration from Makka to Madina", "The first migration to Abyssinia only", "The conquest of Jerusalem", "The farewell pilgrimage"], 0, "The Hijra was the Prophet's migration from Makka to Yathrib, later known as Madina, in 622."),
    choice("ip13c-q2", "Who accompanied the Prophet Muhammad (pbuh) on the main journey of the Hijra?", ["Abu Bakr", "Umar", "Uthman", "Hamza"], 0, "Abu Bakr was the Prophet's close companion during the journey to Madina."),
    choice("ip13c-q3", "In which cave did the Prophet and Abu Bakr shelter during the Hijra?", ["Thawr", "Hira", "Uhud", "Safa"], 0, "They sheltered in the Cave of Thawr south of Makka while the immediate search passed."),
    choice("ip13c-q4", "What important role did Ali perform when the Prophet left Makka?", ["He stayed behind to return property entrusted to the Prophet", "He led the Quraysh search party", "He became emperor of Madina", "He travelled to Rome for help"], 0, "Ali remained temporarily, slept in the Prophet's bed and returned trusts to their owners before joining the Muslims."),
    choice("ip13c-q5", "What was Quba's significance during the Hijra?", ["It was a stopping place near Madina where the Prophet established a mosque", "It was the capital of Byzantium", "It was where the Battle of Badr took place", "It was the destination of the Hijrat Movement of 1920"], 0, "At Quba, near Madina, the Prophet stayed and established a mosque before entering the city."),
    choice("ip13c-q6", "Who were the Muhajirun and the Ansar?", ["The Makkan emigrants and the Madinan helpers", "Two Byzantine armies", "The scribes and tax collectors of Makka", "Two groups opposed to the Prophet in every matter"], 0, "Muhajirun were Muslims who migrated from Makka; Ansar were the Madinan Muslims who welcomed and supported them."),
    choice("ip13c-q7", "Why did the Prophet establish bonds of brotherhood between Muhajirun and Ansar?", ["To integrate the emigrants and build mutual support in the new community", "To separate all Makkan and Madinan Muslims", "To end responsibility for the poor", "To replace worship with trade"], 0, "The bonds strengthened social unity and helped emigrants rebuild their lives through practical and moral support."),
    choice("ip13c-q8", "What was a central purpose of the Constitution of Madina?", ["To set rights, duties and mutual defence arrangements for the city's communities", "To order every resident to leave", "To abolish all agreements between groups", "To restore Quraysh control of Madina"], 0, "The agreement organised relations among groups in Madina, including responsibilities, security and mutual defence."),
  ],
  "isl-p2-2b": [
    choice("ip22b-q1", "In Hadith study, what is the isnad?", ["The chain of people who transmitted the report", "The main text of the report", "A chapter of the Qur'an", "A legal analogy"], 0, "The isnad records the chain of transmitters through whom a Hadith was passed."),
    choice("ip22b-q2", "In Hadith study, what is the matn?", ["The wording or main text of the report", "The chain of transmitters", "The biography of every Caliph", "The place where a manuscript is stored"], 0, "The matn is the reported wording or content whose meaning and consistency are examined."),
    choice("ip22b-q3", "Which personal qualities were important when scholars evaluated a transmitter?", ["Integrity and reliable memory", "Wealth and political office only", "Membership of one city only", "Skill in farming"], 0, "A narrator needed a trustworthy character and dependable accuracy or memory."),
    choice("ip22b-q4", "Why did scholars check whether each narrator could have met the person from whom they reported?", ["To test whether the chain was continuous and possible", "To calculate the narrator's wealth", "To translate the Qur'an", "To choose a new Caliph"], 0, "Dates, places and relationships helped scholars determine whether transmission links could genuinely have occurred."),
    choice("ip22b-q5", "Which feature would create a serious problem when examining a Hadith's matn?", ["Clear contradiction of the Qur'an or firmly established teaching", "Use of a short sentence", "Mention of everyday conduct", "Agreement with known principles"], 0, "Scholars examined content as well as chains; a text that contradicted stronger revelation or established teaching was suspect."),
    choice("ip22b-q6", "Which term is commonly used for a sound Hadith meeting the strongest reliability conditions?", ["Sahih", "Da'if", "Mawdu'", "Mursal"], 0, "Sahih means sound or authentic when the report meets the required conditions of chain and narrator reliability."),
    choice("ip22b-q7", "Which term means that a Hadith is weak?", ["Da'if", "Sahih", "Hasan", "Mutawatir"], 0, "Da'if is used for a report that does not meet the conditions required for a stronger classification."),
    choice("ip22b-q8", "What is jarh wa ta'dil concerned with?", ["Critical evaluation and accreditation of Hadith narrators", "Calculation of zakat rates", "Drawing maps of Madina", "Arranging Qur'anic suras by length"], 0, "Jarh wa ta'dil is the scholarly assessment of narrators, including criticism of weaknesses and recognition of trustworthiness."),
  ],
  "isl-p2-3a": [
    choice("ip23a-q1", "Who became the first Caliph after the death of the Prophet Muhammad (pbuh)?", ["Abu Bakr", "Umar", "Uthman", "Ali"], 0, "Abu Bakr became the first of the four Rightly Guided Caliphs."),
    choice("ip23a-q2", "During which years did Abu Bakr rule as Caliph?", ["610–622", "622–632", "632–634", "634–644"], 2, "Abu Bakr's short caliphate lasted from 632 to 634."),
    choice("ip23a-q3", "At which gathering was Abu Bakr selected as Caliph?", ["Saqifa", "Hudaybiyya", "Arafat", "Khaybar"], 0, "Leading members of the community discussed succession at Saqifa, where allegiance was given to Abu Bakr."),
    choice("ip23a-q4", "What were the Ridda Wars?", ["Campaigns against rebellion, false prophets and rejection of central authority after the Prophet's death", "Wars between Rome and Persia before Islam", "The Makkan boycott of the Prophet's clan", "The Muslim migration to Abyssinia"], 0, "Abu Bakr fought groups that rebelled, followed false prophets or rejected obligations and the authority of Madina."),
    choice("ip23a-q5", "Why did Abu Bakr insist on confronting tribes that refused to pay zakat?", ["He viewed zakat as an essential obligation and refusal as a challenge to the community's unity", "He wanted to end all charity", "He believed zakat applied only to rulers", "He wished to replace zakat with interest"], 0, "He would not separate the obligation of zakat from the faith and authority of the Muslim community."),
    choice("ip23a-q6", "Which false prophet was defeated at the Battle of Yamama?", ["Musaylima", "Abu Jahl", "Heraclius", "Abu Sufyan"], 0, "Musaylima and his forces were defeated at Yamama during the Ridda campaigns."),
    choice("ip23a-q7", "What preservation project did Abu Bakr authorise after heavy losses at Yamama?", ["The first official collection of the Qur'an", "A new translation replacing Arabic", "The removal of all written revelation", "The construction of the Dome of the Rock"], 0, "Concern about the deaths of reciters led Abu Bakr to authorise Zayd ibn Thabit's verified collection."),
    choice("ip23a-q8", "Which early decision showed Abu Bakr's determination to continue the Prophet's policy despite insecurity?", ["Sending Usama ibn Zayd's expedition", "Cancelling every planned expedition", "Moving the capital to Damascus", "Ending contact with neighbouring tribes"], 0, "He sent the expedition led by Usama as the Prophet had ordered, demonstrating continuity and resolve."),
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
