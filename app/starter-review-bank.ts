import type { DailyQuiz, PrivateQuestion } from "./daily-quiz-bank";

type Stream = DailyQuiz["stream"];

function choice(
  id: string,
  prompt: string,
  answer: "a" | "b" | "c" | "d",
  explanation: string,
  options: [string, string, string, string],
  estimatedMinutes = 3,
  sourceReference = "Original retention question aligned to the current Cambridge syllabus",
): PrivateQuestion {
  const index = answer.charCodeAt(0) - 97;
  return {
    id, prompt, type: "choice", answer, correctAnswer: options[index], explanation,
    options: options.map((label, optionIndex) => ({ id: String.fromCharCode(97 + optionIndex), label })),
    estimatedMinutes, sourceReference,
  };
}

function numeric(
  id: string,
  prompt: string,
  answer: string,
  explanation: string,
  estimatedMinutes = 3,
  tolerance = 0,
  sourceReference = "Original retention question aligned to the current Cambridge syllabus",
): PrivateQuestion {
  return {
    id, prompt, type: "numeric", answer, correctAnswer: answer, explanation,
    placeholder: "Enter a number", estimatedMinutes, tolerance, sourceReference,
  };
}

function quiz(id: string, stream: Stream, topicId: string, lessonTitle: string, questions: PrivateQuestion[]): DailyQuiz {
  return { taskId: `starter-reviewed:${id}`, stream, topicId, lessonTitle, questions };
}

const chemPast = "Adapted from Cambridge IGCSE Chemistry 0620/21/M/J/24 with its matching mark scheme";
const mathSpecimen = "Adapted from Cambridge IGCSE Mathematics 0580 specimen material for examination from 2025";

export const STARTER_REVIEW_QUIZZES: DailyQuiz[] = [
  quiz("math-bounds", "Mathematics", "math-e1-10", "Upper and lower bounds", [
    numeric("srb01", "A length is 8.4 cm correct to the nearest 0.1 cm. What is its lower bound?", "8.35", "Half of 0.1 is 0.05, so subtract 0.05.", 3),
    numeric("srb02", "A mass is 320 g correct to the nearest 10 g. What is its upper bound?", "325", "Half of 10 is 5, so the upper boundary is 325 g.", 3),
    choice("srb03", "Which interval represents x = 12 correct to the nearest whole number?", "c", "The lower boundary is included and the upper boundary is excluded.", ["11 < x < 13", "11.5 < x < 12.5", "11.5 ≤ x < 12.5", "11 ≤ x ≤ 13"], 3),
    numeric("srb04", "A rectangle has length 12.0 cm to the nearest 0.1 cm and width 5 cm to the nearest cm. Find the maximum possible area.", "66.275", "Use both upper bounds: 12.05 × 5.5 = 66.275.", 5, 0.001, mathSpecimen),
  ]),
  quiz("math-indices", "Mathematics", "math-e1-7", "Laws of indices", [
    choice("sri01", "Simplify a³ × a⁵.", "b", "Add powers when multiplying the same base.", ["a¹⁵", "a⁸", "2a⁸", "a²"], 2),
    choice("sri02", "Simplify x⁷ ÷ x³.", "d", "Subtract powers when dividing the same non-zero base.", ["x²¹", "x¹⁰", "4x", "x⁴"], 2),
    choice("sri03", "Simplify (m⁴)³.", "a", "Multiply the powers: 4 × 3 = 12.", ["m¹²", "m⁷", "3m⁴", "m⁶⁴"], 2),
    choice("sri04", "Which value equals 2⁻³?", "c", "A negative power means take the reciprocal: 2⁻³ = 1/2³.", ["−8", "−1/8", "1/8", "8"], 3),
  ]),
  quiz("math-expand", "Mathematics", "math-e2-2", "Expanding brackets", [
    choice("sre01", "Expand (x + 3)(x − 5).", "b", "Multiply every term, then collect: x² − 5x + 3x − 15.", ["x² − 8x − 15", "x² − 2x − 15", "x² + 2x − 15", "x² − 2x + 15"], 3),
    choice("sre02", "Expand (2x − 1)(x + 4).", "d", "2x² + 8x − x − 4 = 2x² + 7x − 4.", ["2x² + 8x − 4", "2x² − 7x − 4", "2x² + 3x + 4", "2x² + 7x − 4"], 3),
    numeric("sre03", "Find the coefficient of x in (x + 2)(x + 7).", "9", "The middle terms are 7x and 2x, giving 9x.", 3),
    choice("sre04", "What is the most reliable way to avoid sign errors when expanding?", "a", "Writing all products before collecting terms exposes every sign.", ["Write every product before collecting like terms", "Cancel terms across addition", "Ignore negative signs until the end", "Square only the first term"], 2),
  ]),
  quiz("math-fractions", "Mathematics", "math-e2-3", "Algebraic fractions", [
    choice("srf01", "Simplify (x² − 9)/(x − 3), where x ≠ 3.", "c", "Factor the numerator to (x − 3)(x + 3), then cancel the common factor.", ["x − 3", "x² + 3", "x + 3", "1"], 3),
    choice("srf02", "Which restriction is required for 5/(x − 4)?", "b", "The denominator cannot equal zero.", ["x ≠ 0", "x ≠ 4", "x > 4", "x < 4"], 2),
    choice("srf03", "Simplify 1/x + 1/y.", "d", "Use the common denominator xy.", ["2/(x + y)", "1/(x + y)", "(xy + 1)/xy", "(x + y)/xy"], 3),
    numeric("srf04", "Solve 3/x = 6.", "0.5", "Multiply by x and divide by 6: x = 3/6 = 0.5.", 3),
  ]),
  quiz("math-inequalities", "Mathematics", "math-e2-6", "Linear inequalities", [
    choice("srn01", "Solve −2x > 6.", "a", "Dividing by a negative reverses the inequality sign.", ["x < −3", "x > −3", "x < 3", "x > 3"], 3),
    choice("srn02", "Solve 3 ≤ x + 2 < 7.", "c", "Subtract 2 from all three parts.", ["3 ≤ x < 7", "1 < x ≤ 5", "1 ≤ x < 5", "5 ≤ x < 9"], 3),
    choice("srn03", "How is x ≤ 4 shown at 4 on a number line?", "d", "The endpoint is included, so use a filled circle.", ["Open circle, arrow right", "Open circle, arrow left", "Filled circle, arrow right", "Filled circle, arrow left"], 2),
    choice("srn04", "Which operation always requires reversing an inequality sign?", "b", "Multiplying or dividing both sides by a negative reverses order.", ["Adding a positive number", "Dividing by a negative number", "Subtracting the same number", "Multiplying by a positive number"], 2),
  ]),
  quiz("chem-isotopes", "Chemistry", "chem-2-3", "Isotopes", [
    choice("src01", "Which statement defines isotopes?", "b", "Isotopes are atoms of the same element with the same proton number but different neutron numbers.", ["Different protons and same neutrons", "Same protons and different neutrons", "Same mass and different electrons", "Different protons and different electrons"], 2),
    numeric("src02", "An atom has nucleon number 37 and proton number 17. How many neutrons does it contain?", "20", "Neutrons = nucleon number − proton number.", 2),
    numeric("src03", "An element is 75% mass 35 and 25% mass 37. Calculate its relative atomic mass.", "35.5", "Weighted mean = (75×35 + 25×37)/100.", 4, 0.01),
    choice("src04", "Why do isotopes of an element have the same chemical properties?", "d", "Chemical behaviour depends mainly on electron arrangement, which is the same.", ["They have the same number of neutrons", "They have identical masses", "Their nuclei are identical", "They have the same electron arrangement"], 3, chemPast),
  ]),
  quiz("chem-ionic", "Chemistry", "chem-2-4", "Ionic bonding", [
    choice("sric01", "Which ion forms when a magnesium atom loses two electrons?", "a", "Losing two electrons gives a 2+ charge.", ["Mg²⁺", "Mg²⁻", "Mg⁺", "Mg⁻"], 2),
    choice("sric02", "What is an ionic bond?", "c", "It is electrostatic attraction between oppositely charged ions.", ["A shared pair of electrons", "Attraction between nuclei", "Electrostatic attraction between opposite ions", "A force between neutral molecules"], 2),
    choice("sric03", "Why does solid sodium chloride not conduct electricity?", "b", "Its ions are fixed in the lattice and cannot carry charge through the solid.", ["It has no charged particles", "Its ions cannot move", "Its electrons are shared", "It melts below room temperature"], 3),
    choice("sric04", "Which description matches an ionic lattice?", "d", "An ionic lattice contains alternating positive and negative ions in a repeating structure.", ["Separate neutral molecules", "Positive ions only", "Atoms joined by shared pairs only", "Alternating positive and negative ions"], 3, chemPast),
  ]),
  quiz("chem-covalent-1", "Chemistry", "chem-2-5", "Covalent bonding — Part 1", [
    choice("srcc11", "What is a covalent bond?", "a", "A covalent bond is a shared pair of electrons.", ["A shared pair of electrons", "Transfer of a proton", "Attraction between ions", "A sea of delocalised ions"], 2),
    numeric("srcc12", "How many shared electron pairs are present in one H₂ molecule?", "1", "Each hydrogen contributes one electron to one shared pair.", 2),
    choice("srcc13", "Why does chlorine form Cl₂?", "c", "Each chlorine shares one electron so both obtain full outer shells.", ["Each chlorine loses seven electrons", "A chloride ion attracts a chlorine atom", "Each chlorine shares one electron", "The nuclei share protons"], 3),
    choice("srcc14", "How many electrons are shared in the single covalent bond in HCl?", "b", "One shared pair contains two electrons.", ["1", "2", "7", "8"], 2, chemPast),
  ]),
  quiz("chem-covalent-2", "Chemistry", "chem-2-5", "Covalent bonding — Part 2", [
    numeric("srcc21", "How many covalent bonds are present in methane, CH₄?", "4", "Carbon shares one pair with each of four hydrogen atoms.", 2),
    numeric("srcc22", "How many lone pairs are on the nitrogen atom in ammonia, NH₃?", "1", "Nitrogen has five outer electrons: three bonding pairs and one lone pair.", 3),
    numeric("srcc23", "How many lone pairs are on the oxygen atom in water, H₂O?", "2", "Oxygen forms two bonds and retains two lone pairs.", 3),
    choice("srcc24", "Which molecule contains four shared pairs around its central atom?", "d", "Methane has four C–H bonds around carbon.", ["H₂", "HCl", "H₂O", "CH₄"], 2, chemPast),
  ]),
  quiz("isl-themes-1", "Islamiyat", "isl-quran-1", "Major themes: Passages 1–5", [
    choice("sriq11", "What should a strong passage-theme answer do first?", "b", "It should identify the central teaching about God and the required human response.", ["Retell unrelated history", "Identify the central teaching and response", "List only Arabic vocabulary", "Discuss another passage"], 3),
    choice("sriq12", "Which statement best expresses divine sovereignty?", "d", "God alone creates, sustains and has final authority.", ["Humans control destiny independently", "Natural forces deserve worship", "Authority belongs equally to all created beings", "God alone creates, sustains and rules"], 2),
    choice("sriq13", "Which application follows from belief in God as Creator?", "a", "Gratitude and responsible care for creation follow from recognising God as Creator.", ["Gratitude and responsible care", "Worship of created objects", "Ignoring moral accountability", "Depending only on wealth"], 3),
    choice("sriq14", "Why should passage details be used in an answer?", "c", "Relevant details prove and explain the stated theme.", ["To increase length only", "To avoid explaining importance", "To support the identified theme", "To replace the theme"], 2),
  ]),
  quiz("isl-first-revelation", "Islamiyat", "isl-p1-3a", "History of the Qur'an: first revelation", [
    choice("srif01", "Where did the first revelation occur?", "c", "The first revelation occurred in Cave Hira.", ["Cave Thawr", "Madina", "Cave Hira", "Jerusalem"], 2),
    choice("srif02", "Who brought the first revelation?", "a", "Angel Jibril brought God's revelation.", ["Jibril", "Waraqa", "Abu Bakr", "Umar"], 2),
    choice("srif03", "Who first comforted and supported the Prophet after the event?", "d", "Khadija reassured him and sought Waraqa's advice.", ["Abu Talib", "Ali", "Zayd", "Khadija"], 2),
    choice("srif04", "Why is the first revelation historically significant?", "b", "It began Muhammad's prophethood and the Qur'anic revelation.", ["It completed the Qur'an", "It began prophethood and revelation", "It occurred after the Hijra", "It established the caliphate"], 3),
  ]),
  quiz("isl-abu-bakr", "Islamiyat", "isl-p1-2b", "Compilation under Abu Bakr", [
    choice("sria01", "Which event created urgency for the first collection of the Qur'an?", "b", "Many reciters were killed at Yamama.", ["The conquest of Makka", "Deaths of reciters at Yamama", "The Treaty of Hudaybiyyah", "The migration to Abyssinia"], 2),
    choice("sria02", "Who urged Abu Bakr to commission the collection?", "c", "Umar recognised the preservation risk and proposed collection.", ["Uthman", "Ali", "Umar", "Mu'awiya"], 2),
    choice("sria03", "Who led the collection work?", "a", "Zayd ibn Thabit was a trusted scribe of revelation.", ["Zayd ibn Thabit", "Bilal", "Khalid ibn Walid", "Abu Sufyan"], 2),
    choice("sria04", "Which method best protected accuracy?", "d", "Written records were checked against reliable memorised testimony.", ["Using memory without checking", "Accepting every private copy", "Rewriting from translation", "Checking written and memorised evidence"], 3),
  ]),
  quiz("pak-reforms", "Pakistan History", "pak-kq1", "Shah Waliullah's reforms", [
    choice("srph01", "Why did Shah Waliullah translate the Qur'an into Persian?", "a", "Persian was widely understood by educated Muslims who could not understand Arabic.", ["To make its teaching more accessible", "To replace Arabic permanently", "To satisfy the East India Company", "To create a new religion"], 3),
    choice("srph02", "Which political action is associated with Shah Waliullah?", "c", "He encouraged Ahmad Shah Abdali to intervene against the Marathas.", ["He founded the Muslim League", "He led the Faraizi Movement", "He appealed to Ahmad Shah Abdali", "He signed the Lucknow Pact"], 3),
    choice("srph03", "What was a central aim of his religious reform?", "b", "He sought Muslim unity and a return to Qur'an and Sunna.", ["Promote regional division", "Restore unity and authentic teaching", "End religious education", "Support Maratha rule"], 2),
    choice("srph04", "Which judgement best explains his lasting importance?", "d", "His teaching inspired later revival movements as well as addressing immediate decline.", ["Only his military career mattered", "His work ended all British influence", "He created Pakistan directly", "His ideas influenced later reformers"], 3),
  ]),
  quiz("pak-revival", "Pakistan History", "pak-kq1", "Syed Ahmad Barelvi and Haji Shariatullah", [
    choice("srpr01", "Where did Syed Ahmad Barelvi's movement make its main armed base?", "c", "It moved to the north-west frontier region.", ["Bengal delta", "Sindh coast", "North-west frontier", "Balochistan plateau"], 3),
    choice("srpr02", "At which battle was Syed Ahmad Barelvi killed?", "a", "He was killed at Balakot in 1831.", ["Balakot", "Plassey", "Buxar", "Panipat"], 2),
    choice("srpr03", "What did the term Faraizi emphasise?", "d", "It stressed performing the obligatory duties of Islam.", ["British education", "Armed expansion only", "Persian literature", "Obligatory religious duties"], 2),
    choice("srpr04", "What did both movements share?", "b", "Both aimed to revive Muslim practice and resist conditions they considered oppressive.", ["Support for Sikh rule", "Religious revival and reform", "Formation of Congress", "Rejection of Islamic teaching"], 3),
  ]),
  quiz("geo-location", "Pakistan Geography", "pak-p2-1", "Location and borders", [
    choice("srpg01", "Which sea lies to the south of Pakistan?", "d", "Pakistan's southern coastline borders the Arabian Sea.", ["Red Sea", "Caspian Sea", "Bay of Bengal", "Arabian Sea"], 2),
    choice("srpg02", "Which country does not share a land border with Pakistan?", "c", "Nepal does not share a border with Pakistan.", ["China", "Iran", "Nepal", "Afghanistan"], 2),
    choice("srpg03", "Why is Pakistan's location strategically important?", "a", "It links South Asia with Central and West Asia and has Arabian Sea access.", ["It links regions and provides sea access", "It has no neighbouring states", "It is entirely landlocked", "It lies outside major trade routes"], 3),
    choice("srpg04", "Which border is in Pakistan's north-east?", "b", "China lies beyond the northern mountain frontier.", ["Iran", "China", "Arabian Sea", "Oman"], 2),
  ]),
  quiz("geo-northern", "Pakistan Geography", "pak-p2-1", "Northern Highlands", [
    choice("srpn01", "Which mountain range contains K2?", "b", "K2 is in the Karakoram Range.", ["Himalaya", "Karakoram", "Sulaiman", "Kirthar"], 2),
    choice("srpn02", "Which range lies mainly in the north-west near Afghanistan?", "c", "The Hindu Kush extends through the north-west.", ["Salt Range", "Kirthar", "Hindu Kush", "Safed Koh only"], 2),
    choice("srpn03", "Why is road construction difficult in the Northern Highlands?", "d", "Steep slopes, unstable rock, snow and deep valleys raise cost and risk.", ["Dense urban settlement", "Flat relief", "Permanent drought only", "Steep relief and severe weather"], 3),
    choice("srpn04", "Which activity benefits directly from glaciers and snowfields?", "a", "Meltwater feeds rivers used for irrigation and hydroelectric power.", ["River supply and hydropower", "Marine fishing", "Mangrove forestry", "Desert grazing"], 3),
  ]),
  quiz("geo-western", "Pakistan Geography", "pak-p2-1", "Western Highlands", [
    choice("srpw01", "Which range extends through western Pakistan near the Indus plain?", "c", "The Sulaiman Range forms an important western highland belt.", ["Karakoram", "Himalaya", "Sulaiman", "Salt Range"], 2),
    choice("srpw02", "Why are many Western Highland settlements small and scattered?", "a", "Water is limited and relief restricts farming and transport.", ["Water scarcity and difficult relief", "Excessive rainfall", "Dense forests everywhere", "Large navigable rivers"], 3),
    choice("srpw03", "What is the main importance of mountain passes?", "d", "Passes provide routes through otherwise difficult relief.", ["They create deltas", "They increase monsoon rainfall", "They supply sea ports", "They provide transport routes"], 2),
    choice("srpw04", "Which climate is typical of much of the Western Highlands?", "b", "Much of the region is dry with large temperature ranges.", ["Equatorial wet", "Arid or semi-arid", "Polar maritime", "Tropical rainforest"], 2),
  ]),
  quiz("geo-plateaux", "Pakistan Geography", "pak-p2-1", "Potwar and Balochistan Plateaux", [
    choice("srpp01", "Which feature is strongly associated with the Potwar Plateau?", "b", "The Salt Range and dissected relief border the Potwar area.", ["Mangrove swamps", "Salt Range and ravines", "Active delta distributaries", "Permanent snowfields"], 2),
    choice("srpp02", "Why is crop farming limited across much of the Balochistan Plateau?", "d", "Low and unreliable rainfall restricts water for crops.", ["Deep fertile delta soils", "Too many navigable rivers", "Permanent flooding", "Low and unreliable rainfall"], 3),
    choice("srpp03", "Which economic activity is important in parts of Balochistan because of geology?", "a", "Mineral extraction is important where deposits can be accessed.", ["Mineral extraction", "Rice cultivation everywhere", "Marine shipbuilding inland", "Rubber plantations"], 2),
    choice("srpp04", "What is one similarity between the two plateau regions?", "c", "Both include uneven relief and face water constraints, although their scale differs.", ["Both are coastal deltas", "Both receive year-round heavy rain", "Both have uneven relief and water constraints", "Both are permanently snow-covered"], 3),
  ]),
];
