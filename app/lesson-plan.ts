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

const method = "Learn 35 min · make concise notes 15 min · guided examples 15 min · independent practice 15 min · closed-book recall 10 min";

function lesson(topicId: string, title: string, objective: string, keyPoints: string, practice: string, recall: string): StarterLesson {
  return { topicId, title, objective, keyPoints, studyMethod: method, practice, recall };
}

/** The first twelve teaching days reproduce the detailed daily level in the approved master planner. */
export const STARTER_LESSONS: Record<LessonStream, StarterLesson[]> = {
  Mathematics: [
    lesson("math-e1-1", "Integers, prime numbers, factors, LCM and HCF", "Classify integers and use prime factors to calculate LCM and HCF.", "Prime/composite numbers; factor trees; common factors and multiples.", "Complete factor-tree, LCM and HCF questions, including one word problem.", "Without notes, define prime number and find the HCF and LCM of 24 and 36."),
    lesson("math-e1-4", "Fractions, decimals and recurring decimals", "Convert accurately between fractions and decimals and calculate with them.", "Equivalent fractions; four operations; terminating and recurring decimals.", "Complete mixed fraction operations and recurring-decimal conversions.", "Write the procedure for converting a recurring decimal to a fraction."),
    lesson("math-e1-3", "Prime factorisation, square roots and cube roots", "Use prime factors to identify exact square and cube roots.", "Index form; perfect squares/cubes; product of prime factors.", "Solve exact-root and missing-factor questions without a calculator.", "Explain how prime exponents reveal a square or cube."),
    lesson("math-e1-6", "BODMAS and directed-number arithmetic", "Apply operation order correctly with positive and negative numbers.", "Brackets; indices; multiplication/division; addition/subtraction; negative signs.", "Complete a graduated set of BODMAS calculations and correct every sign error.", "State the operation order and solve one expression mentally."),
    lesson("math-e1-8", "Standard form conversions and calculations", "Write ordinary numbers in A × 10ⁿ form and calculate with standard form.", "1 ≤ A < 10; positive/negative powers; calculator entry.", "Convert both ways and complete multiplication/division problems.", "Write 0.000072 and 5 430 000 in standard form."),
    lesson("math-e1-9", "Estimation, significant figures and decimal places", "Round appropriately and use estimates to check reasonableness.", "Place value; significant figures; decimal places; one-significant-figure estimates.", "Round mixed values and estimate multi-step calculations.", "Explain why an estimate is a checking tool, not the exact answer."),
    lesson("math-e1-11", "Ratio, scale and direct proportion", "Simplify ratios and share quantities in a given ratio.", "Common units; ratio totals; scale factor; direct proportion.", "Solve sharing, scale-drawing and recipe questions.", "Give the three steps for sharing an amount in a ratio."),
    lesson("math-e2-8", "Inverse proportion and multi-part sharing", "Recognise and solve inverse-proportion relationships.", "y ∝ 1/x; constant of proportionality; interpreting wording.", "Solve direct-versus-inverse classification and calculation questions.", "State what remains constant in an inverse-proportion model."),
    lesson("math-e1-13", "Percentages: increase, decrease and percentage change", "Calculate a percentage of an amount and percentage change.", "Multiplier method; original/new values; percentage points versus percent.", "Complete discount, profit and population-change questions.", "Write the multipliers for a 12% increase and a 12% decrease."),
    lesson("math-e1-13", "Reverse percentages", "Recover an original value after a percentage change.", "Final multiplier; dividing by the multiplier; common reverse-percentage trap.", "Solve original-price, tax and depreciation questions.", "Explain why subtracting the stated percentage from the final value is wrong."),
    lesson("math-e1-7", "Index laws with positive integer powers", "Apply multiplication, division and power-of-a-power laws.", "Same-base rules; coefficient versus exponent; zero power preview.", "Simplify numeric and algebraic index expressions.", "Write the three core index laws from memory."),
    lesson("math-e2-1", "Algebraic expressions and single brackets", "Collect like terms and expand a single bracket accurately.", "Terms, coefficients, constants; like terms; distributive law.", "Simplify expressions and expand positive/negative brackets.", "Explain why 3x and 3x² are not like terms."),
  ],
  Chemistry: [
    lesson("chem-1-1", "Particle arrangement in solids, liquids and gases", "Use the particle model to explain the three states.", "Arrangement; separation; motion; forces; compressibility.", "Draw and label particle diagrams, then explain two state properties.", "Compare a solid and gas using arrangement, movement and forces."),
    lesson("chem-1-2", "Temperature, pressure, gas volume and diffusion", "Explain diffusion and predict how temperature/pressure affect gases.", "Random motion; concentration gradient; kinetic energy; collision frequency.", "Interpret diffusion experiments and gas-volume changes.", "Explain why diffusion is faster at higher temperature."),
    lesson("chem-2-1", "Elements, compounds and mixtures", "Distinguish substances using particles and properties.", "Chemical bonding versus physical mixing; fixed composition; separation.", "Classify particle diagrams and choose separation methods.", "Define element, compound and mixture without using examples."),
    lesson("chem-2-2", "Atomic structure: protons, neutrons and electrons", "Describe subatomic particles and locate them in an atom.", "Charge; relative mass; nucleus; electron shells; neutrality.", "Complete particle tables and draw electronic structures.", "State the charge, mass and location of each subatomic particle."),
    lesson("chem-2-2", "Proton number, nucleon number and electron structures", "Calculate particle numbers for atoms and ions.", "Atomic number; mass number; ion charge; shell filling for first 20 elements.", "Calculate p/n/e values and map electron arrangements.", "Explain what changes—and what does not—when an ion forms."),
    lesson("chem-2-3", "Isotopes and relative atomic mass", "Identify isotopes and calculate weighted relative atomic mass.", "Same protons; different neutrons; abundance; radioactive versus stable.", "Interpret isotope notation and complete weighted-average calculations.", "Define isotope precisely and explain identical chemical behaviour."),
    lesson("chem-2-4", "Ionic bonding and sodium chloride dot-and-cross diagrams", "Explain electron transfer and ionic attraction.", "Metal/non-metal ions; full outer shell; electrostatic attraction; lattice.", "Draw NaCl/MgO diagrams and link structure to properties.", "Describe ionic bonding without saying atoms share electrons."),
    lesson("chem-2-5", "Covalent bonding in H₂ and Cl₂", "Represent a shared pair of electrons in simple molecules.", "Non-metals; shared pair; outer-shell completion; single bond.", "Draw correct dot-and-cross diagrams and count bonding pairs.", "Define a covalent bond precisely."),
    lesson("chem-2-5", "Covalent bonding in H₂O and CH₄", "Draw multi-bond simple molecular structures.", "Valency; bonding pairs; lone pairs; molecular formula.", "Draw H₂O, NH₃, CH₄ and identify lone pairs.", "Predict the number of bonds formed by H, C, N and O."),
    lesson("chem-2-5", "Carbon dioxide and multiple covalent bonds", "Explain and draw double bonds in CO₂.", "Double shared pairs; carbon valency; complete outer shells.", "Draw O₂, N₂ and CO₂, checking every outer electron.", "Explain why CO₂ needs two double bonds."),
    lesson("chem-2-6", "Diamond and graphite giant covalent structures", "Relate bonding and structure to contrasting properties.", "Number of bonds; layers; delocalised electrons; hardness; conductivity.", "Write comparison answers using structure → bonding → property.", "Give one structural reason for each different property."),
    lesson("chem-2-7", "Metallic bonding", "Explain metallic properties using positive ions and delocalised electrons.", "Giant lattice; mobile electrons; attraction; conductivity; malleability.", "Draw a labelled model and answer property-explanation questions.", "Explain electrical conductivity without saying electrons leave the metal."),
  ],
  Islamiyat: [
    lesson("isl-quran-7", "Surah al-Baqarah 2:21–22: theme and application", "Explain the passage's teaching about God as Creator and Sustainer.", "Worship; creation; provision; gratitude; avoiding partners with God.", "Write a theme paragraph and two developed applications for Muslims.", "State the main theme and two present-day applications without notes."),
    lesson("isl-quran-1", "Surah al-Baqarah 2:255 (Ayat al-Kursi)", "Explain God's sovereignty, knowledge and power.", "Oneness; eternal life; no fatigue; intercession; complete knowledge.", "Write one theme answer and one importance answer using passage evidence.", "Recall four attributes of God presented in the passage."),
    lesson("isl-quran-2", "Surah al-An‘am 6:101–103: theme and application", "Explain divine creation, transcendence and human limits.", "Originator; no offspring; beyond vision; knowledge of all things.", "Develop two teachings and two effects on Muslim belief and conduct.", "Explain why human inability to see God does not limit God."),
    lesson("isl-p1-3a", "The first revelation at Cave Hira", "Narrate the event accurately and explain its significance.", "Retreat; Angel Jibril; command to read; Khadija; Waraqa; prophethood.", "Produce a chronological account plus a significance paragraph.", "Retell the event in six accurate steps."),
    lesson("isl-quran-3", "Surah Fussilat 41:37: signs, worship and application", "Explain why created signs point to the Creator alone.", "Sun/moon as signs; prohibition of worshipping creation; prostration to God.", "Write theme and Muslim-life application paragraphs.", "State the passage's warning and positive command."),
    lesson("isl-p1-3a", "Pre-Islamic Arabia: social, economic and religious setting", "Describe the Jahiliyyah setting that preceded revelation.", "Tribalism; idols; trade; social inequality; selected virtues; need for reform.", "Create a two-column conditions/effects table and answer a causation question.", "Recall three religious and three social features."),
    lesson("isl-quran-4", "Surah al-Shura 42:4–5: divine majesty and mercy", "Explain God's ownership, greatness and angels' role.", "Heavens/earth; transcendence; angels praise and seek forgiveness; mercy.", "Write a focused theme answer supported by passage detail.", "Name three expressions of God's greatness and one of mercy."),
    lesson("isl-p1-2b", "Compilation of the Qur’an under Abu Bakr", "Explain why and how the first collection was made.", "Yamama; loss of reciters; Umar's proposal; Zayd; written/oral verification.", "Write causes, method and importance in separate paragraphs.", "Recall the trigger, proposer, compiler and safeguarding method."),
    lesson("isl-quran-5", "Surah al-Ikhlas 112: Tawhid", "Explain the passage's complete teaching about God's oneness.", "One; eternal refuge; no offspring/parent; incomparable.", "Write theme and importance answers without paraphrasing only.", "Recall the four statements and explain one implication."),
    lesson("isl-quran-6", "Surah al-Fatiha 1: sovereignty, worship and guidance", "Explain the relationship between God and believers.", "Praise; mercy; judgement; worship; dependence; straight path.", "Connect each section to prayer and daily Muslim conduct.", "Give the passage's three requests/commitments from memory."),
    lesson("isl-quran-10", "Surah al-Nas 114: seeking divine protection", "Explain protection from internal and external evil.", "Lord/King/God of humankind; whisperer; hearts; jinn and humans.", "Write a teaching paragraph and practical applications.", "Identify the danger and the three divine titles."),
    lesson("isl-quran-10", "Protection passages: compare al-Nas with al-Falaq", "Compare teachings about reliance on God against evil.", "Visible/hidden harm; envy; darkness; whispering; refuge in God.", "Prepare a comparison grid and one evaluative application paragraph.", "State two similarities and one difference."),
  ],
  "Pakistan History": [
    lesson("pak-kq1", "Shah Waliullah: religious reforms and historical impact", "Explain why Shah Waliullah sought reform and assess his importance.", "Qur’an translation; unity; social/economic ideas; appeal to Ahmad Shah Abdali.", "Build cause-action-impact notes and answer one 7/14-mark question.", "Recall four reforms and rank the most important with a reason."),
    lesson("pak-kq1", "Syed Ahmad Shaheed Barelvi and Islamic revival", "Explain his aims, jihad movement and lasting significance.", "Tariqah-i-Muhammadiya; north-west campaign; Sikh rule; Balakot.", "Create chronology and practise a developed importance answer.", "State aim, two actions, outcome and legacy."),
    lesson("pak-kq1", "Haji Shariatullah and the Faraizi Movement", "Explain the movement's religious and social purposes.", "Faraiz; conditions in Bengal; opposition to exploitation; Dudu Mian.", "Compare his methods and impact with the other reformers.", "Recall three aims and two effects."),
    lesson("pak-kq2", "Internal causes of Mughal decline", "Explain how succession, administration and finance weakened the empire.", "Weak successors; wars; court conflict; revenue; size and communication.", "Write three developed cause paragraphs with links to decline.", "Rank the internal causes and justify the first choice."),
    lesson("pak-kq2", "Nadir Shah and Ahmad Shah Abdali: external attacks", "Explain why invasions accelerated Mughal decline.", "Delhi 1739; wealth loss; prestige; repeated Afghan invasions; instability.", "Complete a consequences table and one causation response.", "Recall dates, actors and three consequences."),
    lesson("pak-kq2", "East India Company: from trade to political power", "Trace how commercial presence became territorial control.", "Trading posts; Mughal permissions; private armies; alliances; weakening authority.", "Build a trade-to-conquest flowchart and explain two turning points.", "State four stages in the Company's expansion."),
    lesson("pak-kq2", "Battle of Plassey 1757: causes and significance", "Explain why the Company won and why the victory mattered.", "Siraj-ud-Daulah; Clive; Mir Jafar; conspiracy; Bengal revenues.", "Write causes and consequences separately; practise a judgement sentence.", "Recall three reasons for victory and two consequences."),
    lesson("pak-kq2", "Battle of Buxar 1764: consequences", "Explain how Buxar consolidated Company authority.", "Combined opposition; Company military strength; Diwani rights; Bengal control.", "Compare Buxar with Plassey using political and financial impact.", "Explain why Buxar may be considered more decisive."),
    lesson("pak-kq2", "Regulating Act 1773", "Explain why Britain began regulating Company government.", "Company corruption/debt; Governor-General; council; Supreme Court; limitations.", "Create problem-provision-effect notes.", "Recall three provisions and one weakness."),
    lesson("pak-kq2", "Pitt’s India Act 1784", "Explain how British government control increased.", "Board of Control; dual control; political oversight; Company trade role.", "Compare the 1773 and 1784 Acts in a table.", "State the key institutional change and its significance."),
    lesson("pak-kq2", "British annexation of Sindh and Punjab", "Explain motives, methods and consequences of annexation.", "Strategic frontier; trade/Indus; Amirs; Sikh wars; Dalhousie.", "Prepare separate Sindh/Punjab cause-and-result summaries.", "Give two motives and one consequence for each region."),
    lesson("pak-kq2", "Doctrine of Lapse and territorial expansion", "Explain the policy and why it caused resentment.", "Dalhousie; adopted heirs; annexed states; Awadh distinction; elite grievances.", "Answer an explanation question using named examples.", "Define the doctrine and name two affected states."),
  ],
  "Pakistan Geography": [
    lesson("pak-p2-1", "Pakistan’s location, coordinates, neighbours and borders", "Locate Pakistan precisely and explain the significance of its position.", "Latitude/longitude; Arabian Sea; India, China, Afghanistan, Iran; provinces.", "Label a blank map and write two location-importance explanations.", "Draw a mental map: neighbours clockwise and major administrative units."),
    lesson("pak-p2-1", "Northern Highlands: relief and sub-regions", "Identify the mountain ranges and explain their physical character.", "Himalaya; Karakoram; Hindu Kush; peaks, valleys, passes and glaciers.", "Annotate a relief map and compare two northern ranges.", "Recall three ranges, two peaks/passes and one glacier."),
    lesson("pak-p2-1", "Western Highlands", "Describe western relief and connect it to human activity.", "Sulaiman, Kirthar, Safed Koh; passes; dry rugged terrain; settlement limits.", "Label ranges/passes and explain two effects of relief.", "Name the major ranges and a key pass."),
    lesson("pak-p2-1", "Balochistan and Potwar Plateaux", "Compare plateau landscapes, drainage and land use.", "Basins; ranges; aridity; Potwar dissected relief; Salt Range relationship.", "Create a comparison table and interpret a relief map.", "State two characteristics and one use/problem for each plateau."),
    lesson("pak-p2-1", "Salt Range and Upper Indus Plain", "Explain relief, drainage and alluvial features.", "Piedmont; doabs; rivers; active/flood plains; bar uplands.", "Draw a labelled cross-section and answer a land-use question.", "Define doab and distinguish active from old flood plain."),
    lesson("pak-p2-1", "Lower Indus Plain, delta and coast", "Describe lower plain and coastal landforms and their significance.", "Flat relief; meanders; delta distributaries; mangroves; mudflats; ports.", "Annotate a delta diagram and explain opportunities/risks.", "Recall four delta/coastal features and two human uses."),
    lesson("pak-p2-1", "Desert regions: Thar, Thal and Cholistan", "Locate and compare Pakistan’s deserts.", "Sand dunes; aridity; seasonal drainage; grazing; irrigation change.", "Label deserts and compare causes, landscape and livelihoods.", "Locate all three and state one characteristic of each."),
    lesson("pak-p2-1", "Pakistan’s four temperature regions", "Explain spatial and seasonal temperature variation.", "Latitude; altitude; continentality; coast; northern/highland, lowland, coastal patterns.", "Interpret climate graphs and explain contrasts.", "Give the main control on temperature in four named regions."),
    lesson("pak-p2-1", "South-west monsoon", "Explain origin, movement and rainfall distribution.", "Seasonal pressure; Arabian Sea/Bay of Bengal branches; relief; variability.", "Draw a monsoon route map and interpret rainfall data.", "Explain why eastern/northern areas generally receive more monsoon rain."),
    lesson("pak-p2-1", "Western depressions and winter rainfall", "Explain their path and importance.", "Mediterranean origin; west-to-east systems; northern/western rain and snow; rabi crops.", "Compare monsoon and western-depression rainfall.", "State origin, season, affected areas and two benefits."),
    lesson("pak-p2-2", "River floods: causes, impacts and management", "Explain physical/human flood causes and evaluate responses.", "Monsoon; snowmelt; silt; floodplain occupation; embankments; warnings.", "Use a cause-impact-response grid and answer an evaluation question.", "Recall three causes, three impacts and two management methods."),
    lesson("pak-p2-2", "Drought: triggers, regional impacts and responses", "Explain why drought occurs and how vulnerability can be reduced.", "Rainfall failure; high evaporation; groundwater; agriculture; migration; storage/conservation.", "Compare drought impacts across users and assess two responses.", "State two physical causes, two human pressures and two solutions."),
  ],
};

export function topicLesson(topic: Topic, session: number, sessions: number): GuidedLesson {
  const phase = sessions === 1 ? "Learn and apply" : session === 1 ? "Foundations and key knowledge" : session === sessions ? "Exam application and correction" : "Develop the next syllabus skill";
  return {
    title: `${topic.title}: ${phase}`,
    objective: session === 1 ? `Understand the essential knowledge and vocabulary for ${topic.title}.` : session === sessions ? `Apply ${topic.title} independently in Cambridge-style questions and correct mistakes.` : `Develop the next assessable part of ${topic.title} and connect it to prior learning.`,
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
