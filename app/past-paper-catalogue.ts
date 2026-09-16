// Question references only: Cambridge paper text is never republished here.
// Sources and question/mark-scheme pairings checked 2026-09-16.
export type PaperReference = {
  id: string;
  topicId: string;
  label: string;
  reference: string;
  marks: number;
  minutes: number;
  paperUrl: string;
  schemeUrl: string;
  kind: "Past paper" | "Specimen";
  host: string;
};

export type PaperSet = {
  id: string;
  subject: "Mathematics" | "Chemistry" | "Pakistan Studies" | "Islamiyat";
  syllabusCode: "0580" | "0620" | "0448" | "0493";
  session: string;
  component: string;
  durationMinutes: number;
  maxMarks: number;
  paperUrl: string;
  schemeUrl: string;
  source: "Cambridge International" | "Verified archive copy";
  use: "Current-format timed practice" | "Topical practice only";
  note: string;
};

const official = "https://www.cambridgeinternational.org/Images/";
const archive = "https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";

export const OFFICIAL_PAPER_SETS: readonly PaperSet[] = [
  {
    id: "0580-specimen-2025-02", subject: "Mathematics", syllabusCode: "0580",
    session: "For examination from 2025 · specimen", component: "Paper 2 · Extended non-calculator",
    durationMinutes: 120, maxMarks: 100,
    paperUrl: official + "663664-2025-specimen-paper-2.pdf",
    schemeUrl: official + "663672-2025-specimen-paper-2-mark-scheme.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Matches Talha’s 2027 non-calculator assessment structure.",
  },
  {
    id: "0580-specimen-2025-04", subject: "Mathematics", syllabusCode: "0580",
    session: "For examination from 2025 · specimen", component: "Paper 4 · Extended calculator",
    durationMinutes: 120, maxMarks: 100,
    paperUrl: official + "663668-2025-specimen-paper-4.pdf",
    schemeUrl: official + "663676-2025-specimen-paper-4-mark-scheme.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Matches Talha’s 2027 calculator assessment structure.",
  },
  ...([
    ["m24-22", "February/March 2024", "Paper 22", 90, 70, "0580_m24_qp_22.pdf", "0580_m24_ms_22.pdf"],
    ["s24-22", "May/June 2024", "Paper 22", 90, 70, "0580_s24_qp_22.pdf", "0580_s24_ms_22.pdf"],
    ["w24-22", "October/November 2024", "Paper 22", 90, 70, "0580_w24_qp_22.pdf", "0580_w24_ms_22.pdf"],
    ["m24-42", "February/March 2024", "Paper 42", 150, 130, "0580_m24_qp_42.pdf", "0580_m24_ms_42.pdf"],
    ["s24-42", "May/June 2024", "Paper 42", 150, 130, "0580_s24_qp_42.pdf", "0580_s24_ms_42.pdf"],
    ["w24-42", "October/November 2024", "Paper 42", 150, 130, "0580_w24_qp_42.pdf", "0580_w24_ms_42.pdf"],
  ] as const).map(([id, session, component, durationMinutes, maxMarks, paper, scheme]) => ({
    id: `0580-${id}`, subject: "Mathematics" as const, syllabusCode: "0580" as const,
    session, component, durationMinutes, maxMarks,
    paperUrl: archive + paper, schemeUrl: archive + scheme,
    source: "Verified archive copy" as const, use: "Topical practice only" as const,
    note: "Exact 0580 pair supplied and verified, but the pre-2025 format differs from Talha’s 2027 papers.",
  })),
  {
    id: "0620-s24-21", subject: "Chemistry", syllabusCode: "0620", session: "May/June 2024",
    component: "Paper 21 · Extended multiple choice", durationMinutes: 45, maxMarks: 40,
    paperUrl: official + "520512-june-2024-question-paper-21.pdf",
    schemeUrl: official + "520494-june-2024-mark-scheme-paper-21.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Use for a short timed diagnostic or selected Daily Check questions.",
  },
  {
    id: "0620-s24-41", subject: "Chemistry", syllabusCode: "0620", session: "May/June 2024",
    component: "Paper 41 · Extended theory", durationMinutes: 75, maxMarks: 80,
    paperUrl: official + "671419-june-2024-question-paper-41.pdf",
    schemeUrl: official + "671413-june-2024-mark-scheme-paper-41.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Use a parent-selected 60-minute section for Sunday, then finish the remaining section separately.",
  },
  {
    id: "0620-s24-61", subject: "Chemistry", syllabusCode: "0620", session: "May/June 2024",
    component: "Paper 61 · Alternative to Practical", durationMinutes: 60, maxMarks: 40,
    paperUrl: official + "671421-june-2024-question-paper-61.pdf",
    schemeUrl: official + "671415-june-2024-mark-scheme-paper-61.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "A complete one-hour Sunday assessment when practical skills have been covered.",
  },
  {
    id: "0493-s24-11", subject: "Islamiyat", syllabusCode: "0493", session: "May/June 2024",
    component: "Paper 11", durationMinutes: 90, maxMarks: 50,
    paperUrl: official + "569775-june-2024-question-paper-11.pdf",
    schemeUrl: official + "569773-june-2024-mark-scheme-paper-11.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Choose questions totalling about 60 minutes for the weekly assessment.",
  },
  {
    id: "0493-s24-21", subject: "Islamiyat", syllabusCode: "0493", session: "May/June 2024",
    component: "Paper 21", durationMinutes: 90, maxMarks: 50,
    paperUrl: official + "569776-june-2024-question-paper-21.pdf",
    schemeUrl: official + "569774-june-2024-mark-scheme-paper-21.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Choose questions totalling about 60 minutes for the weekly assessment.",
  },
  {
    id: "0448-s24-01", subject: "Pakistan Studies", syllabusCode: "0448", session: "May/June 2024",
    component: "Paper 01 · History and Culture", durationMinutes: 90, maxMarks: 75,
    paperUrl: official + "646312-june-2024-question-paper-01.pdf",
    schemeUrl: official + "646314-june-2024-paper-01-mark-scheme.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Choose the week’s covered questions for a one-hour Sunday assessment.",
  },
  {
    id: "0448-s24-02", subject: "Pakistan Studies", syllabusCode: "0448", session: "May/June 2024",
    component: "Paper 02 · Environment of Pakistan", durationMinutes: 90, maxMarks: 75,
    paperUrl: official + "646322-june-2024-question-paper-02.pdf",
    schemeUrl: official + "646320-june-2024-paper-02-mark-scheme.pdf",
    source: "Cambridge International", use: "Current-format timed practice",
    note: "Choose the week’s covered questions for a one-hour Sunday assessment.",
  },
];

const entries: PaperReference[] = [];

function add(
  subject: string,
  paper: string,
  scheme: string,
  rows: Array<[string, string, string, number, number]>,
  kind: PaperReference["kind"] = "Past paper",
  host = "Cambridge International",
) {
  for (const [topicId, reference, label, marks, minutes] of rows) {
    entries.push({
      id: `${subject}:${reference}`, topicId, label,
      reference: `${subject} · ${reference}`, marks, minutes,
      paperUrl: paper, schemeUrl: scheme, kind, host,
    });
  }
}

add(
  "0580/02 specimen from 2025",
  official + "663664-2025-specimen-paper-2.pdf",
  official + "663672-2025-specimen-paper-2-mark-scheme.pdf",
  [
    ["math-e1-9", "Q2", "Significant figures", 1, 2],
    ["math-e1-8", "Q12(a–b)", "Standard form", 4, 5],
    ["math-e2-7", "Q9(a–b)", "Sequences", 3, 4],
    ["math-e2-13", "Q18(a–d)", "Functions", 9, 11],
    ["math-e1-18", "Q19(a–b)", "Surds", 4, 5],
    ["math-e2-3", "Q23", "Algebraic fractions", 3, 4],
  ],
  "Specimen",
);

add(
  "0620/21 May/June 2024",
  official + "520512-june-2024-question-paper-21.pdf",
  official + "520494-june-2024-mark-scheme-paper-21.pdf",
  [
    ["chem-1-1", "Q1–2", "Particle model and changes of state", 2, 4],
    ["chem-1-2", "Q3", "Diffusion", 1, 2],
    ["chem-2-2", "Q4–5", "Atomic structure and electron arrangement", 2, 4],
    ["chem-2-3", "Q6", "Isotopes", 1, 2],
    ["chem-2-4", "Q7", "Ionic structure", 1, 2],
    ["chem-2-5", "Q8–9", "Covalent bonding", 2, 4],
  ],
);

add(
  "0448/01 May/June 2024",
  official + "646312-june-2024-question-paper-01.pdf",
  official + "646314-june-2024-paper-01-mark-scheme.pdf",
  [
    ["pak-kq2", "Q2(c)", "Mughal decline", 14, 17],
    ["pak-kq3", "Q1(d)", "Causes of the 1857 uprising", 10, 12],
    ["pak-kq4", "Q2(a)", "Sir Syed’s publication", 4, 5],
    ["pak-kq6", "Q3(b)", "Simla Deputation", 7, 9],
    ["pak-kq8", "Q3(c)", "Congress Rule", 14, 17],
    ["pak-kq13", "Q4(b)", "East Pakistan", 7, 9],
  ],
);

add(
  "0448/02 May/June 2024",
  official + "646322-june-2024-question-paper-02.pdf",
  official + "646320-june-2024-paper-02-mark-scheme.pdf",
  [
    ["pak-p2-2", "Q1(b)(ii)", "Environmental impacts of extraction", 3, 4],
    ["pak-p2-8", "Q4(c)(i–ii)", "Migration", 5, 6],
  ],
);

add(
  "0493/11 May/June 2024",
  official + "569775-june-2024-question-paper-11.pdf",
  official + "569773-june-2024-mark-scheme-paper-11.pdf",
  [
    ["isl-quran-8", "Q1(a–b)", "Sura 96:1–5", 8, 12],
    ["isl-quran-13", "Q1(a–b)", "Sura 5:110", 8, 12],
    ["isl-quran-14", "Q1(a–b)", "Sura 93", 8, 12],
    ["isl-p1-3b", "Q3–4", "Makkan period and Night Journey", 20, 30],
    ["isl-p1-4b", "Q5", "Conversions of leading Companions", 10, 15],
  ],
);

add(
  "0493/21 May/June 2024",
  official + "569776-june-2024-question-paper-21.pdf",
  official + "569774-june-2024-mark-scheme-paper-21.pdf",
  [
    ["isl-p2-2b", "Q2", "Isnad, matn and reliability", 10, 15],
    ["isl-p2-3b", "Q3", "Umar’s administration", 10, 15],
    ["isl-p2-3d", "Q4", "Ali and the Battle of the Camel", 10, 15],
    ["isl-p2-4a", "Q5", "Prophets and revealed books", 10, 15],
  ],
);

export const PAST_PAPER_REFERENCES: readonly PaperReference[] = entries;
