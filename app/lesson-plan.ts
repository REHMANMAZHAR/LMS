import type { Topic } from "./data";

export type LessonStream = "Mathematics" | "Chemistry" | "Islamiyat" | "Pakistan History" | "Pakistan Geography";

export type GuidedLesson = {
  title: string;
  objective: string;
  keyPoints: string;
  studyMethod: string;
  practice: string;
  recall: string;
};

type StarterLesson = GuidedLesson & { topicId: string };

const method = "Learn 60 min · concise notes 25 min · guided work 30 min · independent exam practice 45 min · closed-book recall and correction 20 min";

function lesson(topicId: string, title: string, objective: string, keyPoints: string, practice: string, recall: string): StarterLesson {
  return { topicId, title, objective, keyPoints, studyMethod: method, practice, recall };
}

/** The first twelve teaching days reproduce the detailed daily level in the approved master planner. */
export const STARTER_LESSONS: Record<LessonStream, StarterLesson[]> = {
  Mathematics: [
    lesson("math-e2-5", "Simultaneous linear equations", "Learn elimination and substitution and form equations from written problems.", "Elimination; substitution; checking both unknowns; visible method marks.", "Solve a graded textbook set completely by hand.", "Reproduce both methods and check one solution."),
    lesson("math-e1-10", "Upper and lower bounds", "Calculate accuracy limits for values rounded to specified units or decimal places.", "Half-unit intervals; lower and upper limits; extreme values.", "Complete bounds calculations and state intervals correctly.", "Write the bounds of three rounded measurements."),
    lesson("math-e1-7", "Laws of indices", "Apply multiplication, division, power, zero and negative-index laws.", "Same-base rules; power of a power; zero and negative exponents.", "Complete algebraic index questions without skipping steps.", "Write every index law from memory."),
    lesson("math-e2-2", "Expanding brackets", "Expand double and triple brackets with several variables accurately.", "Distributive law; signs; collecting like terms; identities.", "Complete double- and triple-bracket problems and correct every sign error.", "Expand one double bracket without notes."),
    lesson("math-e2-3", "Algebraic fractions", "Simplify, combine and solve equations containing algebraic fractions.", "Factor first; common denominators; restrictions; equations.", "Complete guided examples followed by independent exam questions.", "Explain why cancellation is only valid between factors."),
    lesson("math-e2-6", "Linear inequalities", "Solve inequalities and represent strict and inclusive ranges on number lines.", "Reversing the sign; open/closed circles; compound ranges.", "Solve and graph a mixed inequality set.", "State when the inequality sign reverses."),
  ],
  Chemistry: [
    lesson("chem-2-3", "Isotopes", "Define isotopes and calculate relative atomic mass from abundance data.", "Same proton number; different neutrons; weighted mean.", "Practise isotope notation and relative atomic mass calculations.", "Define isotope precisely and complete one weighted mean."),
    lesson("chem-2-4", "Ionic bonding", "Explain electron transfer and draw dot-and-cross diagrams for NaCl and MgO.", "Ion formation; full shells; electrostatic attraction; lattice.", "Draw and check NaCl and MgO, then answer structure-property questions.", "Describe ionic bonding in exact chemical language."),
    lesson("chem-2-5", "Covalent bonding — Part 1", "Draw shared-pair single bonds in H₂, Cl₂ and HCl.", "Shared electron pairs; outer shells; single covalent bonds.", "Draw accurate dot-and-cross diagrams with original electrons distinguished.", "Define a covalent bond and draw HCl."),
    lesson("chem-2-5", "Covalent bonding — Part 2", "Draw H₂O, CH₄ and NH₃ including bonding and lone pairs.", "Valency; bonding pairs; lone pairs; molecular formulae.", "Draw all three molecules and explain their shared pairs.", "Predict bonds made by H, C, N and O."),
  ],
  Islamiyat: [
    lesson("isl-quran-1", "Major themes: Passages 1–5", "Retrieve the core themes of God as Creator, Lord and sovereign.", "Theme; supporting passage detail; importance for Muslim belief and conduct.", "Read, close the book, write themes from memory, then check against marking guidance.", "Recall each passage's central theme and two applications."),
    lesson("isl-p1-3a", "History of the Qur'an: first revelation", "Write an accurate chronological account of the first revelation and its significance.", "Cave Hira; Jibril; command to read; Khadija; Waraqa.", "Write a timed 10-mark timeline and check names, order and significance.", "Retell the event in six accurate steps."),
    lesson("isl-quran-6", "Major themes: Passages 6–10", "Retrieve themes of sovereignty, Tawhid, guidance and protection.", "Precise themes; passage support; present-day application.", "Create a passage-by-passage theme grid and verify keywords.", "Recall one key teaching and application per passage."),
    lesson("isl-p1-2b", "Compilation under Abu Bakr", "Explain why and how the first collection of the Qur'an was made.", "Yamama; Umar's proposal; Zayd; written and memorised verification.", "Write a timed 10-mark account organised as cause, method and importance.", "Recall trigger, proposer, compiler and safeguards."),
  ],
  "Pakistan History": [
    lesson("pak-kq1", "Shah Waliullah's reforms", "Explain his religious, social and political reforms and assess their importance.", "Qur'an translation; Muslim unity; social reform; Ahmad Shah Abdali.", "Build a 14-mark essay skeleton and verify it with examiner guidance.", "Recall four reforms and rank their importance."),
    lesson("pak-kq1", "Syed Ahmad Barelvi and Haji Shariatullah", "Compare the aims, methods, outcomes and importance of both revival movements.", "Tariqah-i-Muhammadiya; Balakot; Faraizi duties; Bengal; Dudu Mian.", "Make a comparison grid and practise one developed judgement answer.", "State why each movement struggled and what it achieved."),
  ],
  "Pakistan Geography": [
    lesson("pak-p2-1", "Location and borders", "Locate Pakistan accurately and explain the significance of its position.", "Coordinates; neighbours; Arabian Sea; provinces and borders.", "Label a blank outline map and write two developed location explanations.", "List neighbours clockwise and recall coordinates."),
    lesson("pak-p2-1", "Northern Highlands", "Identify northern ranges, sub-regions, peaks, passes and glaciers.", "Himalaya; Karakoram; Hindu Kush; relief and accessibility.", "Label a blank map and compare two sub-regions.", "Recall three ranges and their distinguishing features."),
    lesson("pak-p2-1", "Western Highlands", "Describe Safed Koh, Sulaiman and Kirthar relief and its effects.", "Ranges; passes; aridity; settlement and transport constraints.", "Sketch and label the relief, then answer an effects question.", "Name the ranges, a pass and two human impacts."),
    lesson("pak-p2-1", "Potwar and Balochistan Plateaux", "Compare relief, drainage, resources and land-use constraints.", "Potwar; Salt Range; basins; dry plateaux; mineral and farming patterns.", "Produce a comparative balance sheet and interpret a relief map.", "State two contrasts and one similarity."),
  ],
};

/** Exact teachable focuses for the larger post-starter syllabus areas. */
const TOPIC_FOCUSES: Record<string, string[]> = {
  "pak-kq3": ["long-term causes of the 1857 War", "immediate causes and outbreak", "main events and regional leadership", "reasons for failure", "political, social and military consequences"],
  "pak-kq4": ["Sir Syed's response after 1857", "educational work and the Aligarh Movement", "political ideas and relations with the British", "Hindi-Urdu controversy and Two-Nation thinking", "overall importance and limitations"],
  "pak-kq5": ["importance and development of Urdu", "Bengali and Punjabi", "Sindhi and Pashto", "Balochi and regional-language promotion", "comparison of government support and cultural importance"],
  "pak-kq6": ["Partition of Bengal 1905", "Simla Deputation 1906", "foundation and early aims of the Muslim League", "Morley-Minto reforms 1909", "Lucknow Pact 1916 and Hindu-Muslim cooperation"],
  "pak-kq7": ["causes and aims of the Khilafat Movement", "leadership, methods and mass support", "Hijrat and non-cooperation", "reasons for failure", "importance for later Muslim politics"],
  "pak-kq8": ["Delhi Proposals and Nehru Report", "Jinnah's Fourteen Points", "Round Table Conferences", "Government of India Act 1935", "1937 elections and Congress rule", "Day of Deliverance and lessons for the League"],
  "pak-kq9": ["Lahore Resolution 1940", "Second World War and Cripps Mission", "Gandhi-Jinnah talks and Simla Conference", "1945-46 elections", "Cabinet Mission and Direct Action", "3 June Plan, Radcliffe Award and independence"],
  "pak-kq10": ["Allama Iqbal's political vision", "Chaudhry Rahmat Ali and the Pakistan name", "Jinnah's return and rebuilding of the Muslim League", "comparison of each leader's contribution"],
  "pak-kq11": ["refugees and administrative division", "division of financial and military assets", "princely states and Kashmir", "canal-water and boundary disputes", "Jinnah's leadership and early state-building"],
  "pak-kq12": ["Khawaja Nazimuddin and constitutional instability", "Ghulam Muhammad and dismissal of governments", "Bogra Formula and One Unit", "1956 Constitution and Iskander Mirza", "Ayub Khan's takeover and Basic Democracies", "Ayub's reforms, opposition and fall"],
  "pak-kq13": ["geographical and political separation", "language issue and economic inequality", "Six Points and 1970 election", "military action and civil war", "India's intervention and creation of Bangladesh", "relative importance of the causes"],
  "pak-kq14": ["Bhutto's domestic and constitutional reforms", "Bhutto's economic and foreign policy", "opposition and removal of Bhutto", "Zia's Islamisation and political control", "Afghan war, foreign relations and Zia's legacy"],
  "pak-kq15": ["Benazir Bhutto's first government", "Nawaz Sharif's first government", "Benazir's second government", "Nawaz's second government and 1999 coup", "reasons elected governments were repeatedly dismissed"],
  "pak-kq16": ["relations with India and the Kashmir issue", "relations with Afghanistan and Iran", "relations with China", "relations with the USA and USSR/Russia", "Commonwealth, United Nations and OIC", "evaluation of Pakistan's changing foreign-policy priorities"],
  "pak-p2-2": ["Indus river system and water supply", "dams, barrages and irrigation network", "waterlogging, salinity and water-management problems", "forests: types, distribution and uses", "deforestation and sustainable forestry", "minerals: distribution, extraction and constraints", "fishing resources and sustainability"],
  "pak-p2-3": ["thermal power and fossil-fuel supply", "hydroelectric power and dam locations", "nuclear power", "solar, wind and other renewable potential", "national grid, shortages and energy conservation"],
  "pak-p2-4": ["farming systems and landholdings", "wheat and food crops", "cotton, rice and sugar-cane cash crops", "livestock and pastoral farming", "irrigation methods and inputs", "agricultural problems and sustainable improvement"],
  "pak-p2-5": ["primary, secondary and tertiary industry", "factors affecting industrial location", "textiles and major manufacturing industries", "small-scale and cottage industries", "industrial estates, EPZs and government policy", "industrial problems and environmental impacts"],
  "pak-p2-6": ["major imports and exports", "trading partners and trade routes", "balance of trade and balance of payments", "ways to increase export value and reduce dependence"],
  "pak-p2-7": ["road network and motorway development", "rail transport", "ports, shipping and air transport", "pipelines and freight choices", "telecommunications and digital connectivity", "evaluation of transport-development priorities"],
  "pak-p2-8": ["population distribution and density", "population growth and age structure", "birth rates, death rates and dependency", "rural-urban migration and urbanisation", "employment sectors, underemployment and informal work", "education, health and population policy"],
  "isl-p1-2a": ["first revelation and early recording", "Makkan and Madinan revelation", "scribes, memorisation and arrangement", "completion of revelation and its significance"],
  "isl-p1-2b": ["collection under Abu Bakr", "standardisation under Uthman", "methods used to ensure accuracy", "importance of preserving one authoritative text"],
  "isl-p1-2c": ["Qur'an as primary source of law", "relationship with Sunna, consensus and analogy", "Qur'anic moral and spiritual guidance", "application to changing circumstances"],
  "isl-p1-3a": ["pre-Islamic Arabia", "Prophet's birth, childhood and youth", "marriage to Khadija and reputation", "first revelation and earliest believers"],
  "isl-p1-3b": ["private and public preaching", "Makkan opposition and persecution", "migration to Abyssinia", "boycott, Year of Sorrow and Ta'if", "pledges of Aqaba and preparations for Hijra"],
  "isl-p1-3c": ["Hijra journey", "building the Madinan community", "brotherhood of Emigrants and Helpers", "relations and agreements in Madina"],
  "isl-p1-3d": ["Battle of Badr", "Battle of Uhud", "Battle of the Trench", "Treaty of Hudaybiyyah", "conquest of Makka", "Hunayn, Ta'if and Tabuk"],
  "isl-p1-3e": ["Prophet's mercy and patience", "leadership and consultation", "Farewell Pilgrimage and sermon", "final illness, death and lasting example"],
  "isl-p1-4a": ["Khadija and Sawda", "Aisha and Hafsa", "other Mothers of the Believers", "Fatima, Ali, Hasan and Husayn", "importance of the Prophet's household"],
  "isl-p1-4b": ["first converts and close Companions", "Scribes of revelation", "Emigrants and Helpers", "selected Companions' service and sacrifice"],
  "isl-p2-2a": ["need for collecting Hadith", "early oral and written transmission", "major compilers and collections", "classification into sound, good and weak reports"],
  "isl-p2-2b": ["structure and purpose of isnad", "analysis of matn", "continuity and character of narrators", "tests for authenticity and fabrication"],
  "isl-p2-2c": ["Hadith as explanation of Qur'an", "Hadith in law and worship", "relationship with consensus and analogy", "importance in Muslim daily life"],
  "isl-p2-3a": ["election and leadership of Abu Bakr", "Ridda wars and false prophets", "collection of the Qur'an", "character, achievements and significance"],
  "isl-p2-3b": ["appointment and leadership of Umar", "territorial expansion", "administration, justice and welfare", "martyrdom, achievements and significance"],
  "isl-p2-3c": ["selection and leadership of Uthman", "standard Qur'an copies", "expansion and administration", "opposition, martyrdom and assessment"],
  "isl-p2-3d": ["accession and early challenges of Ali", "Battle of the Camel", "Siffin and arbitration", "Kharijites, martyrdom and leadership assessment"],
  "isl-p2-4a": ["belief in God and angels", "revealed books and prophets", "resurrection and judgement", "divine decree and human responsibility"],
  "isl-p2-4b": ["meaning and implications of Shahada", "preparation and conditions for Salat", "daily prayers and congregational worship", "individual and community significance"],
  "isl-p2-4c": ["rules, recipients and purposes of Zakat", "rules and experience of Ramadan fasting", "spiritual and social significance of both pillars"],
  "isl-p2-4d": ["rites and stages of Hajj", "meaning and unity expressed by Hajj", "greater and lesser jihad", "conditions, conduct and misconceptions about jihad"],
  "chem-3-3a": ["mole as amount of substance", "Avogadro constant and particle calculations", "moles, mass and relative formula mass"],
  "chem-3-3b": ["mole ratios from equations", "reacting-mass calculations", "limiting reactants and excess"],
  "chem-3-3c": ["solution concentration", "molar gas volume", "empirical and molecular formulae", "multi-step stoichiometry"],
  "chem-12-1": ["planning variables and fair tests", "apparatus, measurements and safety", "tables, graphs and data processing", "errors, limitations and realistic improvements"],
  "chem-12-5": ["cation tests", "anion tests", "gas tests", "flame tests and complete identification schemes"],
  "math-e2-2": ["expanding and collecting terms", "factorising common factors and quadratics", "algebraic identities and completing the square"],
  "math-e2-5": ["linear equations and equations with fractions", "simultaneous linear equations", "quadratic equations by factorisation/formula", "forming equations from problems"],
  "math-e2-10": ["linear and quadratic function graphs", "cubic and reciprocal graphs", "solving equations and intersections graphically", "transformations of graphs"],
  "math-e6-5": ["sine rule", "cosine rule", "area using ½ab sin C", "ambiguous case and mixed non-right-triangle problems"],
  "math-e7-1": ["reflection and rotation", "translation", "enlargement including negative/fractional scale factors", "combined transformations and descriptions"],
  "math-e7-4": ["vectors on lines and shapes", "position vectors and ratios", "proof of parallelism and collinearity", "geometric vector proofs"],
  "math-e8-3": ["sample spaces and mutually exclusive events", "tree diagrams with replacement", "tree diagrams without replacement", "combined-event problem solving"],
  "math-e9-4": ["bar charts, pie charts and frequency diagrams", "stem-and-leaf and box plots", "frequency polygons and time-series graphs", "choosing and criticising statistical displays"],
};

export function topicLessonCount(topic: Topic, minutesPerSession: number) {
  return Math.max(1, Math.ceil(topic.minutes / minutesPerSession), TOPIC_FOCUSES[topic.id]?.length ?? 0);
}

export function topicLesson(topic: Topic, session: number, sessions: number): GuidedLesson {
  const exactFocus = TOPIC_FOCUSES[topic.id]?.[(session - 1) % TOPIC_FOCUSES[topic.id].length];
  const phase = exactFocus ?? (sessions === 1 ? "Learn and apply" : session === 1 ? "Foundations and key knowledge" : session === sessions ? "Exam application and correction" : "Develop the next syllabus skill");
  return {
    title: `${topic.title}: ${phase}`,
    objective: exactFocus ? `Learn and apply the assessable syllabus focus: ${exactFocus}.` : session === 1 ? `Understand the essential knowledge and vocabulary for ${topic.title}.` : session === sessions ? `Apply ${topic.title} independently in Cambridge-style questions and correct mistakes.` : `Develop the next assessable part of ${topic.title} and connect it to prior learning.`,
    keyPoints: topic.tip,
    studyMethod: method,
    practice: session === sessions ? "Complete a timed Cambridge-style question set, mark it strictly and rewrite every weak answer." : "Complete guided examples first, then a short independent question set without looking at notes.",
    recall: `Close the book and explain the lesson in five points; record anything you cannot retrieve for tomorrow's recall.`,
  };
}

export function sundayLesson(stream: LessonStream, previousTitle: string): GuidedLesson {
  return {
    title: `${stream} weekly consolidation and mixed testing`,
    objective: "Repair weak learning from the week and prove that the important knowledge can be recalled without notes.",
    keyPoints: `Revisit the hardest lesson from this week, beginning with: ${previousTitle}.`,
    studyMethod: "Recall 20 min · repair weak concepts 30 min · mixed/timed questions 45 min · mark and correct 20 min · update error log 5 min",
    practice: "Re-solve incorrect questions before attempting a fresh mixed set under timed conditions.",
    recall: "Write what improved, what remains difficult and the exact lesson that must return next week.",
  };
}
