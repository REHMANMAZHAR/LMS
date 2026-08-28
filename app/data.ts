export type SubjectName =
  | "Chemistry"
  | "Mathematics"
  | "Pakistan Studies"
  | "Islamiyat";

export type Topic = {
  id: string;
  subject: SubjectName;
  code: string;
  unit: string;
  title: string;
  minutes: number;
  importance: 1 | 2 | 3;
  paper: string;
  tip: string;
  resourceQuery: string;
};

export const SUBJECTS: SubjectName[] = [
  "Chemistry",
  "Mathematics",
  "Pakistan Studies",
  "Islamiyat",
];

export const SUBJECT_META: Record<
  SubjectName,
  { code: string; short: string; color: string; papers: string }
> = {
  Chemistry: {
    code: "0620",
    short: "CHEM",
    color: "#377e72",
    papers: "Extended Papers 2, 4 and 6",
  },
  Mathematics: {
    code: "0580",
    short: "MATH",
    color: "#4d63a8",
    papers: "Extended Papers 2 and 4",
  },
  "Pakistan Studies": {
    code: "0448",
    short: "PAK",
    color: "#a1653c",
    papers: "Papers 1 and 2",
  },
  Islamiyat: {
    code: "0493",
    short: "ISL",
    color: "#7d588d",
    papers: "Papers 1 and 2",
  },
};

const chemistryUnits: Record<string, string> = {
  "1": "States of matter",
  "2": "Atoms, elements and compounds",
  "3": "Stoichiometry",
  "4": "Electrochemistry",
  "5": "Chemical energetics",
  "6": "Chemical reactions",
  "7": "Acids, bases and salts",
  "8": "The Periodic Table",
  "9": "Metals",
  "10": "Chemistry of the environment",
  "11": "Organic chemistry",
  "12": "Experimental techniques and chemical analysis",
};

const chemistryRaw: Array<[string, string, number]> = [
  ["1.1", "Solids, liquids and gases", 75],
  ["1.2", "Diffusion", 55],
  ["2.1", "Elements, compounds and mixtures", 50],
  ["2.2", "Atomic structure and the Periodic Table", 85],
  ["2.3", "Isotopes and relative atomic mass", 80],
  ["2.4", "Ions and ionic bonds", 95],
  ["2.5", "Simple molecules and covalent bonds", 95],
  ["2.6", "Giant covalent structures", 75],
  ["2.7", "Metallic bonding", 60],
  ["3.1", "Formulae and balanced equations", 100],
  ["3.2", "Relative masses of atoms and molecules", 70],
  ["3.3a", "The mole and Avogadro constant", 110],
  ["3.3b", "Reacting masses and limiting reactants", 120],
  ["3.3c", "Concentration, gas volumes and empirical formulae", 130],
  ["4.1a", "Electrolysis: principles and products", 105],
  ["4.1b", "Electrolysis: half-equations and electroplating", 100],
  ["4.2", "Hydrogen-oxygen fuel cells", 60],
  ["5.1a", "Exothermic and endothermic reactions", 75],
  ["5.1b", "Energy level diagrams and bond energies", 90],
  ["6.1", "Physical and chemical changes", 45],
  ["6.2a", "Rate of reaction and collision theory", 90],
  ["6.2b", "Rate experiments, graphs and catalysts", 105],
  ["6.3", "Reversible reactions and equilibrium", 100],
  ["6.4", "Redox and oxidation numbers", 90],
  ["7.1", "Characteristic properties of acids and bases", 90],
  ["7.2", "Oxides and acid-base character", 60],
  ["7.3", "Preparation of salts", 105],
  ["8.1", "Arrangement of elements and periodic trends", 75],
  ["8.2", "Group I properties", 55],
  ["8.3", "Group VII properties", 70],
  ["8.4", "Transition elements", 55],
  ["8.5", "Noble gases", 35],
  ["9.1", "Properties of metals", 55],
  ["9.2", "Uses of metals", 45],
  ["9.3", "Alloys and their properties", 55],
  ["9.4", "Reactivity series and reactions of metals", 100],
  ["9.5", "Corrosion and rust prevention", 65],
  ["9.6", "Extraction of metals", 100],
  ["10.1", "Water treatment and tests for water", 70],
  ["10.2", "Fertilisers and the Haber process", 75],
  ["10.3a", "Composition of air and atmospheric pollutants", 80],
  ["10.3b", "Greenhouse gases and climate", 75],
  ["11.1", "Organic formulae, functional groups and homologous series", 95],
  ["11.2", "Naming organic compounds", 70],
  ["11.3", "Fuels and petroleum fractions", 65],
  ["11.4", "Alkanes", 65],
  ["11.5", "Alkenes", 85],
  ["11.6", "Alcohols", 85],
  ["11.7", "Carboxylic acids and esters", 90],
  ["11.8", "Addition and condensation polymers", 100],
  ["12.1", "Experimental design and evaluation", 115],
  ["12.2", "Acid-base titrations", 90],
  ["12.3", "Chromatography and Rf values", 75],
  ["12.4", "Separation and purification", 95],
  ["12.5", "Identification of ions and gases", 130],
];

const chemistryHigh = new Set([
  "2.4",
  "2.5",
  "3.1",
  "3.3a",
  "3.3b",
  "3.3c",
  "4.1a",
  "4.1b",
  "6.2a",
  "6.2b",
  "6.3",
  "7.1",
  "7.3",
  "9.4",
  "9.6",
  "11.1",
  "11.5",
  "11.6",
  "11.7",
  "11.8",
  "12.1",
  "12.5",
]);

function chemistryTip(code: string, title: string) {
  if (code.startsWith("3.")) return "Write the balanced equation and mole ratio before substituting numbers; keep units visible.";
  if (code.startsWith("12.")) return "Give the apparatus or reagent, the observable result, and the conclusion separately.";
  if (title.includes("bond") || title.includes("structure")) return "Answer in the order: structure, bonding or forces, then the resulting property.";
  if (title.includes("Rate")) return "Link every factor to collision frequency and the number of successful collisions.";
  if (title.includes("equilibrium")) return "State the change, the direction of shift, and why the new position opposes that change.";
  if (code.startsWith("11.")) return "Build a reaction map showing functional group, reagent, conditions and product.";
  return "Use precise chemical terms and practise one explanation plus one exam-style question.";
}

const chemistry: Topic[] = chemistryRaw.map(([code, title, minutes]) => {
  const major = code.match(/^\d+/)?.[0] ?? "1";
  return {
    id: `chem-${code.replace(".", "-")}`,
    subject: "Chemistry",
    code,
    unit: chemistryUnits[major],
    title,
    minutes,
    importance: chemistryHigh.has(code) ? 3 : 2,
    paper: code.startsWith("12.") ? "P4/P6" : "P2/P4/P6",
    tip: chemistryTip(code, title),
    resourceQuery: `Cambridge IGCSE Chemistry 0620 ${title}`,
  };
});

const mathUnits: Record<string, string> = {
  "1": "Number",
  "2": "Algebra and graphs",
  "3": "Coordinate geometry",
  "4": "Geometry",
  "5": "Mensuration",
  "6": "Trigonometry",
  "7": "Transformations and vectors",
  "8": "Probability",
  "9": "Statistics",
};

const mathRaw: Array<[string, string, number]> = [
  ["E1.1", "Types of number", 65], ["E1.2", "Sets and Venn diagrams", 70],
  ["E1.3", "Powers and roots", 55], ["E1.4", "Fractions, decimals and percentages", 75],
  ["E1.5", "Ordering", 40], ["E1.6", "Four operations and order of operations", 65],
  ["E1.7", "Indices I", 70], ["E1.8", "Standard form", 65],
  ["E1.9", "Estimation and rounding", 65], ["E1.10", "Limits of accuracy and bounds", 90],
  ["E1.11", "Ratio and proportion", 85], ["E1.12", "Rates", 80],
  ["E1.13", "Percentages", 95], ["E1.14", "Using a calculator", 45],
  ["E1.15", "Time", 55], ["E1.16", "Money", 60],
  ["E1.17", "Exponential growth and decay", 85], ["E1.18", "Surds", 90],
  ["E2.1", "Introduction to algebra", 65], ["E2.2", "Algebraic manipulation", 105],
  ["E2.3", "Algebraic fractions", 95], ["E2.4", "Indices II", 75],
  ["E2.5", "Equations", 110], ["E2.6", "Inequalities", 80],
  ["E2.7", "Sequences", 95], ["E2.8", "Direct and inverse proportion", 90],
  ["E2.9", "Graphs in practical situations", 90], ["E2.10", "Graphs of functions", 115],
  ["E2.11", "Sketching curves", 85], ["E2.12", "Differentiation", 105],
  ["E2.13", "Functions", 100],
  ["E3.1", "Coordinates", 45], ["E3.2", "Drawing linear graphs", 70],
  ["E3.3", "Gradient of linear graphs", 65], ["E3.4", "Length and midpoint", 65],
  ["E3.5", "Equations of linear graphs", 90], ["E3.6", "Parallel lines", 45],
  ["E3.7", "Perpendicular lines", 60],
  ["E4.1", "Geometrical terms", 55], ["E4.2", "Geometrical constructions", 75],
  ["E4.3", "Scale drawings", 65], ["E4.4", "Similarity and congruence", 105],
  ["E4.5", "Symmetry", 55], ["E4.6", "Angles and polygons", 90],
  ["E4.7", "Circle theorems I", 100], ["E4.8", "Circle theorems II", 100],
  ["E5.1", "Units of measure", 45], ["E5.2", "Area and perimeter", 75],
  ["E5.3", "Circles, arcs and sectors", 95], ["E5.4", "Surface area and volume", 105],
  ["E5.5", "Compound shapes and parts of shapes", 90],
  ["E6.1", "Pythagoras' theorem", 70], ["E6.2", "Right-angled triangles", 95],
  ["E6.3", "Exact trigonometric values", 55], ["E6.4", "Trigonometric functions and graphs", 95],
  ["E6.5", "Non-right-angled triangles", 115], ["E6.6", "3D Pythagoras and trigonometry", 95],
  ["E7.1", "Transformations", 105], ["E7.2", "Vectors in two dimensions", 85],
  ["E7.3", "Magnitude of a vector", 55], ["E7.4", "Vector geometry", 110],
  ["E8.1", "Introduction to probability", 65], ["E8.2", "Relative and expected frequencies", 70],
  ["E8.3", "Probability of combined events", 105], ["E8.4", "Conditional probability", 95],
  ["E9.1", "Classifying statistical data", 50], ["E9.2", "Interpreting statistical data", 70],
  ["E9.3", "Averages and measures of spread", 90], ["E9.4", "Statistical charts and diagrams", 100],
  ["E9.5", "Scatter diagrams", 65], ["E9.6", "Cumulative frequency diagrams", 100],
  ["E9.7", "Histograms", 105],
];

const mathHigh = new Set([
  "E1.10", "E1.11", "E1.13", "E1.18", "E2.2", "E2.3", "E2.5", "E2.7",
  "E2.10", "E2.12", "E2.13", "E4.4", "E4.6", "E4.7", "E4.8", "E5.3",
  "E5.4", "E6.2", "E6.5", "E7.1", "E7.4", "E8.3", "E8.4", "E9.6", "E9.7",
]);

function mathTip(code: string, title: string) {
  if (title.includes("graph") || title.includes("Graph")) return "Label axes and scale first; show coordinates and keep the line or curve precise.";
  if (title.includes("Circle theorem")) return "Write the theorem or geometric reason beside every angle step.";
  if (code.startsWith("E6")) return "Sketch and label the triangle, choose the rule, substitute, then round only at the end.";
  if (code.startsWith("E8")) return "Write the sample space; multiply along branches and add mutually exclusive outcomes.";
  if (title.includes("bounds")) return "Write the lower and upper interval before calculating the required extreme.";
  if (code.startsWith("E2")) return "Keep each algebraic step visible; factor before cancelling and check restrictions.";
  return "Show enough working for method marks and keep exact values until the final answer.";
}

const mathematics: Topic[] = mathRaw.map(([code, title, minutes]) => {
  const major = code.match(/^E(\d)/)?.[1] ?? "1";
  return {
    id: `math-${code.toLowerCase().replace(".", "-")}`,
    subject: "Mathematics",
    code,
    unit: mathUnits[major],
    title,
    minutes,
    importance: mathHigh.has(code) ? 3 : 2,
    paper: "P2/P4",
    tip: mathTip(code, title),
    resourceQuery: `Cambridge IGCSE Mathematics 0580 Extended ${title}`,
  };
});

const pakistanRaw: Array<[string, string, string, number]> = [
  ["KQ1", "Cultural and historical background", "Religious thinkers and Islamic revival", 150],
  ["KQ2", "Cultural and historical background", "Decline of the Mughal Empire", 170],
  ["KQ3", "Cultural and historical background", "War of Independence 1857-58", 180],
  ["KQ4", "Cultural and historical background", "Sir Syed Ahmad Khan and the Aligarh Movement", 175],
  ["KQ5", "Cultural and historical background", "Urdu and regional languages since 1947", 140],
  ["KQ6", "The emergence of Pakistan 1906-47", "Early development of the Pakistan Movement", 185],
  ["KQ7", "The emergence of Pakistan 1906-47", "Khilafat Movement", 160],
  ["KQ8", "The emergence of Pakistan 1906-47", "Pakistan Movement, 1927-39", 190],
  ["KQ9", "The emergence of Pakistan 1906-47", "Attempts to solve subcontinent problems, 1940-47", 195],
  ["KQ10", "The emergence of Pakistan 1906-47", "Jinnah, Iqbal and Rahmat Ali", 155],
  ["KQ11", "Nationhood 1947-99", "Establishing Pakistan, 1947-48", 175],
  ["KQ12", "Nationhood 1947-99", "Political stability after Jinnah", 195],
  ["KQ13", "Nationhood 1947-99", "East Pakistan and Bangladesh", 190],
  ["KQ14", "Nationhood 1947-99", "Bhutto, Zia and Pakistan after the Decade of Progress", 220],
  ["KQ15", "Nationhood 1947-99", "Governments in the 1990s", 190],
  ["KQ16", "Nationhood 1947-99", "Pakistan in world affairs since 1947", 250],
  ["P2.1", "The Environment of Pakistan", "The land of Pakistan", 185],
  ["P2.2", "The Environment of Pakistan", "Natural resources and sustainability", 210],
  ["P2.3", "The Environment of Pakistan", "Power and energy", 170],
  ["P2.4", "The Environment of Pakistan", "Agricultural development", 210],
  ["P2.5", "The Environment of Pakistan", "Industrial development", 190],
  ["P2.6", "The Environment of Pakistan", "Trade", 140],
  ["P2.7", "The Environment of Pakistan", "Transport and telecommunications", 150],
  ["P2.8", "The Environment of Pakistan", "Population and employment", 175],
];

const pakistan: Topic[] = pakistanRaw.map(([code, unit, title, minutes]) => ({
  id: `pak-${code.toLowerCase().replace(".", "-")}`,
  subject: "Pakistan Studies",
  code,
  unit,
  title,
  minutes,
  importance: 3,
  paper: code.startsWith("P2") ? "P2" : "P1",
  tip: code.startsWith("P2")
    ? "Use named locations or evidence from the source, then explain the effect on people, development and sustainability."
    : "For judgement questions, explain both sides with accurate evidence and finish with a supported comparison.",
  resourceQuery: `Cambridge IGCSE Pakistan Studies 0448 ${title}`,
}));

const quranPassages = [
  "Sura 2:255", "Sura 6:101-103", "Sura 41:37", "Sura 42:4-5", "Sura 112",
  "Sura 1", "Sura 2:21-22", "Sura 96:1-5", "Sura 99", "Sura 114",
  "Sura 2:30-37", "Sura 6:75-79", "Sura 5:110", "Sura 93", "Sura 108",
];

const islamiyatCore: Array<[string, string, string, number, string]> = [
  ["P1.2a", "Paper 1", "Revelation of the Qur'an, 610-632", 150, "P1"],
  ["P1.2b", "Paper 1", "Compilation of the Qur'an", 145, "P1"],
  ["P1.2c", "Paper 1", "Qur'an as a source of law and guidance", 120, "P1"],
  ["P1.3a", "Paper 1", "Prophet's early life and first revelation", 155, "P1"],
  ["P1.3b", "Paper 1", "Prophet's Makkan ministry and opposition", 210, "P1"],
  ["P1.3c", "Paper 1", "Hijra and the Madinan community", 170, "P1"],
  ["P1.3d", "Paper 1", "Battles, treaties and conquest of Makka", 240, "P1"],
  ["P1.3e", "Paper 1", "Prophet's character, leadership and final years", 190, "P1"],
  ["P1.4a", "Paper 1", "Prophet's wives and descendants", 160, "P1"],
  ["P1.4b", "Paper 1", "Companions, Scribes, Emigrants and Helpers", 185, "P1"],
  ["P2.2a", "Paper 2", "Compilation and classification of Hadith", 170, "P2"],
  ["P2.2b", "Paper 2", "Isnad, matn and testing reliability", 135, "P2"],
  ["P2.2c", "Paper 2", "Hadith collections and use in Islamic law", 150, "P2"],
  ["P2.3a", "Paper 2", "Caliph Abu Bakr: rule and challenges", 150, "P2"],
  ["P2.3b", "Paper 2", "Caliph Umar: administration and expansion", 170, "P2"],
  ["P2.3c", "Paper 2", "Caliph Uthman: achievements and opposition", 160, "P2"],
  ["P2.3d", "Paper 2", "Caliph Ali: civil conflict and leadership", 170, "P2"],
  ["P2.4a", "Paper 2", "Six Articles of Faith", 210, "P2"],
  ["P2.4b", "Paper 2", "Shahada and Salat", 160, "P2"],
  ["P2.4c", "Paper 2", "Zakat and Sawm", 150, "P2"],
  ["P2.4d", "Paper 2", "Hajj and Jihad", 180, "P2"],
];

const islamiyatQuran: Topic[] = quranPassages.map((title, index) => ({
  id: `isl-quran-${index + 1}`,
  subject: "Islamiyat",
  code: `Q${index + 1}`,
  unit: "Qur'an passages for special study",
  title,
  minutes: 75,
  importance: 3,
  paper: "P1 Q1",
  tip: "Identify the passage's main theme, support it from the text, then explain two concrete applications for Muslims today.",
  resourceQuery: `Cambridge IGCSE Islamiyat 0493 ${title} themes importance`,
}));

const islamiyatHadith: Topic[] = Array.from({ length: 20 }, (_, index) => ({
  id: `isl-hadith-${index + 1}`,
  subject: "Islamiyat" as const,
  code: `H${index + 1}`,
  unit: "Hadith passages for special study",
  title: `Hadith ${index + 1}: teaching and application`,
  minutes: 55,
  importance: 3 as const,
  paper: "P2 Q1",
  tip: "State the teaching precisely, then give specific individual and community actions instead of repeating the wording.",
  resourceQuery: `Cambridge IGCSE Islamiyat 0493 Hadith ${index + 1}`,
}));

const islamiyatTopics: Topic[] = islamiyatCore.map(([code, unit, title, minutes, paper]) => ({
  id: `isl-${code.toLowerCase().replace(".", "-")}`,
  subject: "Islamiyat",
  code,
  unit,
  title,
  minutes,
  importance: 3,
  paper,
  tip: title.includes("Caliph")
    ? "Organise the answer as challenges, actions, achievements and lasting leadership significance."
    : "Use accurate events or teachings, then explain their significance for Muslim belief and practice.",
  resourceQuery: `Cambridge IGCSE Islamiyat 0493 ${title}`,
}));

export const TOPICS: Topic[] = [
  ...chemistry,
  ...mathematics,
  ...pakistan,
  ...islamiyatQuran,
  ...islamiyatHadith,
  ...islamiyatTopics,
];

/**
 * Verified prerequisite relationships used by the topic chooser.
 * These are direct foundations, not hard locks: Talha may still open any topic.
 */
export const TOPIC_PREREQUISITES: Record<string, string[]> = {
  // Chemistry
  "chem-2-2": ["chem-2-1"],
  "chem-2-3": ["chem-2-2"],
  "chem-2-4": ["chem-2-2"],
  "chem-2-5": ["chem-2-2"],
  "chem-2-6": ["chem-2-5"],
  "chem-2-7": ["chem-2-2"],
  "chem-3-1": ["chem-2-1", "chem-2-2"],
  "chem-3-2": ["chem-2-3"],
  "chem-3-3a": ["chem-3-1", "chem-3-2"],
  "chem-3-3b": ["chem-3-3a"],
  "chem-3-3c": ["chem-3-3a"],
  "chem-4-1a": ["chem-2-4"],
  "chem-4-1b": ["chem-4-1a"],
  "chem-5-1b": ["chem-5-1a", "chem-2-5"],
  "chem-6-2a": ["chem-1-2", "chem-6-1"],
  "chem-6-2b": ["chem-6-2a"],
  "chem-6-3": ["chem-6-1"],
  "chem-6-4": ["chem-2-4"],
  "chem-7-2": ["chem-7-1"],
  "chem-7-3": ["chem-7-1", "chem-3-1"],
  "chem-8-1": ["chem-2-2"],
  "chem-8-2": ["chem-8-1"],
  "chem-8-3": ["chem-8-1"],
  "chem-8-4": ["chem-8-1"],
  "chem-9-4": ["chem-8-1", "chem-7-1"],
  "chem-9-5": ["chem-9-4"],
  "chem-9-6": ["chem-9-4", "chem-4-1a"],
  "chem-10-2": ["chem-6-3", "chem-3-1"],
  "chem-10-3b": ["chem-10-3a"],
  "chem-11-2": ["chem-11-1"],
  "chem-11-3": ["chem-11-1"],
  "chem-11-4": ["chem-11-1"],
  "chem-11-5": ["chem-11-1", "chem-11-4"],
  "chem-11-6": ["chem-11-1"],
  "chem-11-7": ["chem-11-1", "chem-11-6"],
  "chem-11-8": ["chem-11-1", "chem-11-5", "chem-11-7"],
  "chem-12-2": ["chem-7-1", "chem-3-3c"],
  "chem-12-3": ["chem-1-2"],
  "chem-12-4": ["chem-1-1", "chem-2-1"],
  "chem-12-5": ["chem-7-1"],

  // Mathematics
  "math-e1-4": ["math-e1-1"],
  "math-e1-7": ["math-e1-3", "math-e1-6"],
  "math-e1-8": ["math-e1-7"],
  "math-e1-10": ["math-e1-9"],
  "math-e1-11": ["math-e1-4"],
  "math-e1-12": ["math-e1-11"],
  "math-e1-13": ["math-e1-4", "math-e1-11"],
  "math-e1-17": ["math-e1-13", "math-e1-7"],
  "math-e1-18": ["math-e1-3"],
  "math-e2-2": ["math-e2-1", "math-e1-7"],
  "math-e2-3": ["math-e2-2", "math-e1-4"],
  "math-e2-4": ["math-e1-7", "math-e2-2"],
  "math-e2-5": ["math-e2-2"],
  "math-e2-6": ["math-e2-5"],
  "math-e2-7": ["math-e2-2"],
  "math-e2-8": ["math-e1-11", "math-e2-5"],
  "math-e2-9": ["math-e3-2"],
  "math-e2-10": ["math-e2-2", "math-e3-2"],
  "math-e2-11": ["math-e2-10"],
  "math-e2-12": ["math-e2-10", "math-e2-4"],
  "math-e2-13": ["math-e2-2", "math-e2-5"],
  "math-e3-2": ["math-e3-1", "math-e2-5"],
  "math-e3-3": ["math-e3-2"],
  "math-e3-4": ["math-e3-1", "math-e6-1"],
  "math-e3-5": ["math-e3-2", "math-e3-3"],
  "math-e3-6": ["math-e3-3", "math-e3-5"],
  "math-e3-7": ["math-e3-3", "math-e3-5"],
  "math-e4-4": ["math-e4-1", "math-e1-11"],
  "math-e4-6": ["math-e4-1"],
  "math-e4-7": ["math-e4-6"],
  "math-e4-8": ["math-e4-7"],
  "math-e5-2": ["math-e4-1"],
  "math-e5-3": ["math-e5-2", "math-e4-6"],
  "math-e5-4": ["math-e5-2"],
  "math-e5-5": ["math-e5-2", "math-e5-3"],
  "math-e6-2": ["math-e6-1", "math-e1-11"],
  "math-e6-3": ["math-e6-2"],
  "math-e6-4": ["math-e2-10", "math-e6-2"],
  "math-e6-5": ["math-e6-2", "math-e4-6"],
  "math-e6-6": ["math-e6-1", "math-e6-2", "math-e5-4"],
  "math-e7-2": ["math-e3-1"],
  "math-e7-3": ["math-e7-2", "math-e6-1"],
  "math-e7-4": ["math-e7-2", "math-e4-4"],
  "math-e8-2": ["math-e8-1"],
  "math-e8-3": ["math-e8-1", "math-e1-4"],
  "math-e8-4": ["math-e8-3"],
  "math-e9-2": ["math-e9-1"],
  "math-e9-3": ["math-e9-1"],
  "math-e9-4": ["math-e9-2", "math-e9-3"],
  "math-e9-5": ["math-e9-4"],
  "math-e9-6": ["math-e9-3", "math-e9-4"],
  "math-e9-7": ["math-e9-4", "math-e1-4"],

  // Pakistan Studies: chronological and geographic foundations
  "pak-kq2": ["pak-kq1"],
  "pak-kq3": ["pak-kq2"],
  "pak-kq4": ["pak-kq3"],
  "pak-kq6": ["pak-kq4"],
  "pak-kq7": ["pak-kq6"],
  "pak-kq8": ["pak-kq7"],
  "pak-kq9": ["pak-kq8"],
  "pak-kq10": ["pak-kq6"],
  "pak-kq11": ["pak-kq9", "pak-kq10"],
  "pak-kq12": ["pak-kq11"],
  "pak-kq13": ["pak-kq11", "pak-kq12"],
  "pak-kq14": ["pak-kq13"],
  "pak-kq15": ["pak-kq14"],
  "pak-kq16": ["pak-kq11"],
  "pak-p2-2": ["pak-p2-1"],
  "pak-p2-3": ["pak-p2-2"],
  "pak-p2-4": ["pak-p2-1", "pak-p2-2"],
  "pak-p2-5": ["pak-p2-2", "pak-p2-3"],
  "pak-p2-6": ["pak-p2-5"],
  "pak-p2-7": ["pak-p2-5", "pak-p2-6"],
  "pak-p2-8": ["pak-p2-4", "pak-p2-5"],

  // Islamiyat: revelation, biography, Hadith and Caliphate sequences
  "isl-p1-2b": ["isl-p1-2a"],
  "isl-p1-2c": ["isl-p1-2a", "isl-p1-2b"],
  "isl-p1-3b": ["isl-p1-3a"],
  "isl-p1-3c": ["isl-p1-3b"],
  "isl-p1-3d": ["isl-p1-3c"],
  "isl-p1-3e": ["isl-p1-3d"],
  "isl-p1-4a": ["isl-p1-3e"],
  "isl-p1-4b": ["isl-p1-3c"],
  "isl-p2-2b": ["isl-p2-2a"],
  "isl-p2-2c": ["isl-p2-2a", "isl-p2-2b"],
  "isl-p2-3b": ["isl-p2-3a"],
  "isl-p2-3c": ["isl-p2-3b"],
  "isl-p2-3d": ["isl-p2-3c"],
  "isl-p2-4b": ["isl-p2-4a"],
  "isl-p2-4c": ["isl-p2-4a"],
  "isl-p2-4d": ["isl-p2-4a"],
};

export function prerequisiteTopics(topicId: string) {
  return (TOPIC_PREREQUISITES[topicId] ?? [])
    .map((id) => TOPICS.find((topic) => topic.id === id))
    .filter((topic): topic is Topic => Boolean(topic));
}

export function linkedNextTopics(topicId: string) {
  return TOPICS.filter((topic) => (TOPIC_PREREQUISITES[topic.id] ?? []).includes(topicId));
}

export const STAGES = ["Not started", "Learning", "Practising", "Secure"] as const;

export function youtubeSearchUrl(topic: Topic) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(topic.resourceQuery)}`;
}
