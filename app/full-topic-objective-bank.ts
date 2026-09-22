import type { DailyQuizQuestion } from "./daily-quiz-model";
import { TOPICS, type Topic } from "./data";
import type { PrivateQuestion } from "./daily-quiz-bank";
import { SUBSTANTIVE_TOPIC_FACTS } from "./substantive-topic-facts";

type SubjectStream = "Mathematics" | "Chemistry" | "Islamiyat" | "Pakistan History" | "Pakistan Geography";

export type TopicObjectiveBank = {
  topicId: string;
  stream: SubjectStream;
  lessonTitle: string;
  syllabusCode: string;
  sourceType: "original-syllabus-aligned";
  questions: PrivateQuestion[];
};

const optionIds = ["a", "b", "c", "d"];

function choice(id: string, prompt: string, correctIndex: number | string, labels: string[], explanation: string): PrivateQuestion {
  const index = typeof correctIndex === "string" ? Number(correctIndex) : correctIndex;
  if (!Number.isInteger(index) || index < 0 || index >= labels.length) {
    throw new Error(`Invalid choice index for ${id}`);
  }
  return {
    id,
    prompt,
    type: "choice",
    answer: optionIds[index],
    correctAnswer: labels[index],
    explanation,
    options: labels.map((label, index) => ({ id: optionIds[index], label })),
    estimatedMinutes: 2,
  };
}

function streamFor(topic: Topic): SubjectStream {
  if (topic.subject === "Pakistan Studies") return topic.paper === "P2" ? "Pakistan Geography" : "Pakistan History";
  return topic.subject as SubjectStream;
}

function commonQuestions(topic: Topic): PrivateQuestion[] {
  const key = topic.id.replace(/[^a-z0-9]/gi, "");
  const q: PrivateQuestion[] = [];

  q.push(choice(
    `${key}-obj-focus`,
    `Which statement best identifies the syllabus focus of "${topic.title}"?`,
    0,
    [
      `Understanding and applying the key ideas in ${topic.title}`,
      "Memorising unrelated facts from another unit",
      "Ignoring definitions, evidence and working",
      "Learning only the title without using the concept",
    ],
    `This item checks that the learner can identify the scope of syllabus topic ${topic.code}: ${topic.title}.`,
  ));

  q.push(choice(
    `${key}-obj-method`,
    `Which study approach is most useful when answering an exam question on "${topic.title}"?`,
    0,
    [
      topic.tip,
      "Give an unsupported answer and omit relevant working or evidence.",
      "Replace subject terminology with unrelated general statements.",
      "Skip the question whenever more than one step is required.",
    ],
    `The LMS exam tip for ${topic.code} is designed around the skill Cambridge expects for this topic.`,
  ));

  q.push(choice(
    `${key}-obj-paper`,
    `Where is "${topic.title}" assessed in Talha's current syllabus map?`,
    0,
    [
      topic.paper,
      topic.paper === "P1" ? "P2 only" : "An unrelated paper only",
      "It is not part of the examination syllabus",
      "Coursework only",
    ],
    `The LMS maps ${topic.code} to ${topic.paper}.`,
  ));

  return q;
}

const SPECIFIC: Record<string, PrivateQuestion[]> = {
  "chem-2-5": [
    choice("chem25-1","What forms a covalent bond?",0,["A shared pair of electrons","Transfer of protons","Attraction between metal ions only","Loss of neutrons"],"A covalent bond is a shared pair of electrons."),
    choice("chem25-2","Why do simple molecular substances usually have low melting points?",1,["Their covalent bonds are weak","Only weak intermolecular forces need to be overcome","They contain free ions","Their atoms have no electrons"],"Melting simple molecular substances overcomes intermolecular forces, not the covalent bonds within molecules."),
    choice("chem25-3","Which substance is a simple molecular substance?",2,["Diamond","Graphite","Methane","Sodium chloride"],"Methane consists of small covalent molecules."),
  ],
  "chem-2-6": [
    choice("chem26-1","Why does diamond have a high melting point?",0,["Many strong covalent bonds extend throughout the structure","It contains mobile ions","It has weak intermolecular forces","Its atoms are unbonded"],"Diamond is a giant covalent lattice with many strong bonds."),
    choice("chem26-2","Why can graphite conduct electricity?",2,["Carbon ions move","All electrons are fixed","It has delocalised electrons that can move","It is an ionic solid"],"Each carbon in graphite contributes an electron that is delocalised."),
    choice("chem26-3","Which giant covalent structure is very hard and does not conduct electricity?",1,["Graphite","Diamond","Sodium chloride","Copper"],"Diamond is hard because of its 3D covalent network and has no mobile charged particles."),
  ],
  "chem-2-7": [
    choice("chem27-1","Metallic bonding is the attraction between…",3,["molecules and neutrons","negative ions only","shared pairs in molecules","positive metal ions and delocalised electrons"],"Metallic bonding is electrostatic attraction between positive ions and delocalised electrons."),
    choice("chem27-2","Why are metals good electrical conductors?",0,["Delocalised electrons can move through the structure","Metal atoms become gases","All metal ions move through the solid","They contain water"],"Mobile delocalised electrons carry charge."),
    choice("chem27-3","Why are many metals malleable?",1,["Their ions evaporate easily","Layers can slide while metallic attraction is maintained","Their covalent molecules rotate","They have no bonding"],"Non-directional metallic bonding remains as layers slide."),
  ],
  "chem-3-1": [
    choice("chem31-1","Which equation is balanced for formation of water?",1,["H2 + O2 → H2O","2H2 + O2 → 2H2O","H2 + 2O2 → H2O","2H + O → H2O"],"A balanced equation has equal numbers of each atom on both sides."),
    choice("chem31-2","What must be conserved when balancing a chemical equation?",0,["Number of atoms of each element","Number of compounds","Physical state only","Coefficient 1 for every substance"],"Atoms are rearranged, not created or destroyed."),
    choice("chem31-3","What is the formula of magnesium chloride?",2,["MgCl","Mg2Cl","MgCl2","Mg2Cl2"],"Mg2+ requires two Cl− ions for electrical neutrality."),
  ],
  "chem-3-2": [
    choice("chem32-1","Relative molecular mass is found by…",0,["adding the relative atomic masses in the formula","multiplying every atomic number","counting neutrons only","measuring volume"],"Mr is the sum of relative atomic masses for all atoms shown in the formula."),
    choice("chem32-2","What is Mr of CO2 if Ar(C)=12 and Ar(O)=16?",2,["28","32","44","60"],"12 + 2×16 = 44."),
    choice("chem32-3","What is the relative formula mass of NaCl if Ar(Na)=23 and Ar(Cl)=35.5?",1,["35.5","58.5","46","81.5"],"23 + 35.5 = 58.5."),
  ],
  "chem-3-3a": [
    choice("chem33a-1","One mole contains approximately…",3,["6.02×10^3 particles","6.02×10^12 particles","6.02×10^20 particles","6.02×10^23 particles"],"The Avogadro constant is approximately 6.02×10^23 mol−1."),
    choice("chem33a-2","How many moles are in 18 g of water, Mr=18?",0,["1","18","0.18","324"],"moles = mass/Mr = 18/18 = 1."),
    choice("chem33a-3","Which equation gives amount in moles from mass?",1,["mass × Mr","mass ÷ Mr","Mr ÷ mass","mass + Mr"],"n = m/Mr."),
  ],
  "chem-4-1a": [
    choice("chem41a-1","During electrolysis, positive ions move to the…",1,["anode","cathode","electrolyte surface","power supply only"],"Cations are attracted to the negative cathode."),
    choice("chem41a-2","Oxidation occurs at the…",0,["anode","cathode","salt bridge only","negative ion"],"Oxidation is loss of electrons and occurs at the anode."),
    choice("chem41a-3","Why must an electrolyte contain mobile ions?",2,["To make atoms larger","To create neutrons","To carry electric charge","To stop all reactions"],"Mobile ions transport charge through the electrolyte."),
  ],
  "chem-5-1a": [
    choice("chem51a-1","An exothermic reaction…",0,["transfers energy to the surroundings","always cools the surroundings","has no energy change","absorbs energy overall"],"Exothermic reactions release energy to the surroundings."),
    choice("chem51a-2","Which process is usually endothermic?",2,["Combustion","Neutralisation","Thermal decomposition","Freezing water"],"Thermal decomposition requires energy input."),
    choice("chem51a-3","In an exothermic reaction, the temperature of the surroundings usually…",1,["falls","rises","becomes zero","cannot change"],"Released energy commonly raises the surroundings' temperature."),
  ],
  "chem-6-2a": [
    choice("chem62a-1","Increasing temperature speeds a reaction mainly because…",2,["particles become larger","activation energy becomes zero","more particles have enough energy for successful collisions","concentration always doubles"],"Higher temperature increases collision frequency and the fraction exceeding activation energy."),
    choice("chem62a-2","Increasing concentration usually increases rate because…",0,["collisions occur more frequently","particles lose energy","surface area falls","the reaction becomes reversible"],"More particles per unit volume gives more frequent collisions."),
    choice("chem62a-3","A catalyst increases reaction rate by…",3,["raising product energy","being permanently consumed","increasing reactant mass","providing a pathway with lower activation energy"],"A catalyst offers an alternative lower-activation-energy route."),
  ],
  "chem-7-1": [
    choice("chem71-1","Which ion is responsible for acidity in aqueous acids?",0,["H+","OH−","Na+","Cl− only"],"Acids produce hydrogen ions in aqueous solution."),
    choice("chem71-2","A solution of pH 12 is…",2,["strongly acidic","neutral","alkaline","always a salt"],"pH above 7 indicates alkalinity."),
    choice("chem71-3","Acid + base normally produces…",1,["metal + hydrogen","salt + water","acid + oxygen","base + carbon dioxide"],"Neutralisation forms a salt and water."),
  ],
  "chem-7-3": [
    choice("chem73-1","Which method is suitable for preparing a soluble salt from an acid and an insoluble base?",0,["Add excess base, filter, then crystallise","Use chromatography only","Add indicator until dark","Heat to dryness immediately"],"Excess insoluble base ensures acid is used up; filtration removes excess solid and crystallisation recovers salt."),
    choice("chem73-2","Why is titration useful when both reactants are soluble?",2,["A precipitate always forms","It measures gas volume","It finds the exact neutralising volumes","It separates by particle size"],"Titration identifies the exact volumes needed without leaving an excess soluble reactant."),
    choice("chem73-3","An insoluble salt is commonly prepared by…",1,["distillation","precipitation","fractional crystallisation only","electrolysis only"],"Mixing suitable soluble salts can form an insoluble precipitate."),
  ],
  "chem-9-4": [
    choice("chem94-1","Which metal is more reactive than copper?",0,["Magnesium","Silver","Gold","Platinum"],"Magnesium is much higher than copper in the reactivity series."),
    choice("chem94-2","A more reactive metal can…",3,["be displaced by every less reactive metal","never react with acids","only form covalent compounds","displace a less reactive metal from its compound"],"Displacement follows relative reactivity."),
    choice("chem94-3","Which gas is commonly produced when a reactive metal reacts with dilute acid?",1,["Oxygen","Hydrogen","Nitrogen","Chlorine"],"Metal + acid typically gives salt + hydrogen."),
  ],
  "chem-11-5": [
    choice("chem115-1","Which functional group identifies an alkene?",0,["C=C","−OH","−COOH","C−C only"],"Alkenes contain a carbon-carbon double bond."),
    choice("chem115-2","What happens when bromine water is added to an alkene?",2,["It turns blue","A white precipitate always forms","It is decolourised","It becomes alkaline"],"Alkenes decolourise bromine water by addition across C=C."),
    choice("chem115-3","Ethene can form poly(ethene) by…",1,["condensation with water","addition polymerisation","neutralisation","electrolysis"],"The C=C opens and monomers join in addition polymerisation."),
  ],
  "chem-12-3": [
    choice("chem123-1","Rf is calculated as…",0,["distance moved by substance ÷ distance moved by solvent front","solvent distance ÷ substance distance","mass ÷ volume","time ÷ distance"],"Rf compares the distance travelled by a component with the solvent front."),
    choice("chem123-2","Why should the starting line in paper chromatography be drawn in pencil?",1,["Pencil reacts strongly","Graphite does not dissolve and run with the solvent","Ink is always colourless","Pencil increases Rf"],"Pencil marks remain in place and do not interfere with the chromatogram."),
    choice("chem123-3","A pure substance usually gives how many spots in one suitable chromatogram?",2,["Zero","Two","One","At least four"],"A pure substance produces a single spot under suitable conditions."),
  ],
  "math-e1-10": [
    choice("mathe110-1","A length is 8.4 cm correct to the nearest 0.1 cm. What is its lower bound?",0,["8.35","8.39","8.40","8.45"],"Nearest 0.1 gives half-unit 0.05, so the lower bound is 8.35."),
    choice("mathe110-2","For the same measurement, what is its upper bound?",3,["8.40","8.41","8.44","8.45"],"The upper endpoint is 8.45 and is not included."),
    choice("mathe110-3","To find the greatest possible value of a/b for positive measured quantities, use…",1,["lower a and upper b","upper a and lower b","lower a and lower b","upper a and upper b"],"A quotient is maximised by maximising the numerator and minimising the denominator."),
  ],
  "math-e1-13": [
    choice("mathe113-1","Increase 200 by 15%.",2,["215","225","230","300"],"15% of 200 is 30, giving 230."),
    choice("mathe113-2","A price falls from 80 to 68. What is the percentage decrease?",1,["12%","15%","17.6%","20%"],"Decrease is 12; 12/80×100=15%."),
    choice("mathe113-3","Which multiplier represents a 7% increase?",0,["1.07","0.93","1.7","0.07"],"100%+7%=107%=1.07."),
  ],
  "math-e1-18": [
    choice("mathe118-1","Simplify √50.",1,["25√2","5√2","10√5","2√25"],"√50=√(25×2)=5√2."),
    choice("mathe118-2","Rationalise 3/√3.",0,["√3","3√3","1/√3","9"],"Multiply numerator and denominator by √3 to get √3."),
    choice("mathe118-3","Simplify √8 + √18.",2,["√26","10√2","5√2","6√2"],"√8=2√2 and √18=3√2, total 5√2."),
  ],
  "math-e2-2": [
    choice("mathe22-1","Expand 3(x−4).",0,["3x−12","3x−4","x−12","12x"],"Multiply both terms by 3."),
    choice("mathe22-2","Factorise x²−9.",3,["(x−9)(x+1)","x(x−9)","(x−3)²","(x−3)(x+3)"],"This is a difference of two squares."),
    choice("mathe22-3","Simplify 4a+3b−a+2b.",1,["3a+b","3a+5b","5a+5b","4a+5b"],"Collect like terms: 3a+5b."),
  ],
  "math-e2-5": [
    choice("mathe25-1","Solve 3x+5=20.",2,["3","4","5","25/3"],"3x=15, so x=5."),
    choice("mathe25-2","Solve x²−9=0.",0,["x=±3","x=9 only","x=3 only","x=±9"],"x²=9 gives both square roots ±3."),
    choice("mathe25-3","Which operation preserves equality?",1,["Add a value to one side only","Multiply both sides by the same non-zero value","Square one side only","Remove unlike terms"],"Applying the same valid operation to both sides preserves equality."),
  ],
  "math-e2-7": [
    choice("mathe27-1","What is the next term of 3,7,11,15,…?",0,["19","18","20","22"],"The common difference is 4."),
    choice("mathe27-2","What is the nth term of 5,8,11,14,…?",2,["3n+5","5n−2","3n+2","n+4"],"3n+2 gives 5 at n=1 and common difference 3."),
    choice("mathe27-3","For a quadratic sequence, which differences are constant?",3,["First differences","Third terms","Ratios always","Second differences"],"Quadratic sequences have constant second differences."),
  ],
  "math-e3-3": [
    choice("mathe33-1","Gradient between (1,2) and (5,10) is…",1,["1/2","2","4","8"],"(10−2)/(5−1)=8/4=2."),
    choice("mathe33-2","A horizontal line has gradient…",0,["0","1","undefined","−1"],"There is no vertical change."),
    choice("mathe33-3","Which expression gives gradient?",2,["change in x/change in y","x+y","change in y/change in x","xy"],"Gradient is vertical change divided by horizontal change."),
  ],
  "math-e4-6": [
    choice("mathe46-1","The interior angles of a triangle sum to…",0,["180°","360°","90°","270°"],"Triangle interior angles total 180°."),
    choice("mathe46-2","The exterior angles of any polygon, one at each vertex, sum to…",2,["180°","540°","360°","720°"],"A full turn is 360°."),
    choice("mathe46-3","Each interior angle of a regular hexagon is…",1,["60°","120°","135°","150°"],"Interior sum is 720°, divided by 6 gives 120°."),
  ],
  "math-e6-1": [
    choice("mathe61-1","In a right triangle with legs 6 and 8, the hypotenuse is…",2,["12","14","10","7"],"√(6²+8²)=√100=10."),
    choice("mathe61-2","Pythagoras' theorem applies directly to…",0,["right-angled triangles","all quadrilaterals","all triangles without condition","circles only"],"a²+b²=c² is for right-angled triangles."),
    choice("mathe61-3","If hypotenuse is 13 and one leg is 5, the other leg is…",3,["18","12.5","10","12"],"√(13²−5²)=√144=12."),
  ],
  "math-e8-3": [
    choice("mathe83-1","For independent events A and B, P(A and B) is…",0,["P(A)×P(B)","P(A)+P(B) always","P(A)−P(B)","1−P(A)"],"Probabilities multiply along independent branches."),
    choice("mathe83-2","A fair coin is tossed twice. P(two heads)=…",1,["1/2","1/4","3/4","1"],"1/2×1/2=1/4."),
    choice("mathe83-3","For mutually exclusive A and B, P(A or B)=…",2,["P(A)P(B)","1 always","P(A)+P(B)","P(A)−P(B)"],"Mutually exclusive outcomes cannot overlap, so their probabilities add."),
  ],
  "math-e9-3": [
    choice("mathe93-1","The median of 2,4,7,9,12 is…",2,["4","6","7","9"],"The middle ordered value is 7."),
    choice("mathe93-2","Range is calculated by…",0,["maximum−minimum","sum/count","middle value","Q1+Q3"],"Range measures total spread from smallest to largest."),
    choice("mathe93-3","Which average is most affected by an extreme outlier?",1,["Mode","Mean","Median","None"],"The mean uses every value and is pulled by extremes."),
  ],
  "pak-kq3": [
    choice("pakkq3-1","Which event immediately preceded the widespread uprising of 1857?",0,["Discontent among sepoys over new rifle cartridges","Formation of the Muslim League","Partition of Bengal","Lahore Resolution"],"The cartridge controversy intensified existing military, political, economic and religious grievances."),
    choice("pakkq3-2","Who was declared a symbolic leader of the uprising in Delhi?",2,["Sir Syed Ahmad Khan","Nana Sahib","Bahadur Shah Zafar","Lord Curzon"],"Rebels in Delhi rallied around the last Mughal emperor."),
    choice("pakkq3-3","One reason the uprising failed was…",1,["complete unity among rebels","lack of unified leadership and coordination","British lack of reinforcements","support from every princely state"],"The rebels lacked a unified command and common strategy."),
  ],
  "pak-kq4": [
    choice("pakkq4-1","What was a major aim of the Aligarh Movement?",0,["Promote modern education among Muslims","End all English education","Restore Mughal rule by force","Oppose scientific learning"],"Sir Syed saw modern education as essential for Muslim social and political recovery."),
    choice("pakkq4-2","Which institution became Muhammadan Anglo-Oriental College?",2,["Sindh Madrasa","Islamia College Peshawar","The school at Aligarh","Fort William College"],"The Aligarh institution developed into MAO College and later Aligarh Muslim University."),
    choice("pakkq4-3","Why did Sir Syed initially advise Muslims to avoid Congress politics?",1,["He opposed education","He feared Muslim interests could be overwhelmed by majority politics","He wanted British withdrawal immediately","He supported no political thought"],"He believed representative politics could disadvantage the Muslim minority at that stage."),
  ],
  "pak-kq7": [
    choice("pakkq7-1","The Khilafat Movement sought to protect the position of the…",0,["Ottoman Caliph","British monarch","Mughal emperor","Viceroy"],"Indian Muslims campaigned over the future of the Ottoman Caliphate after World War I."),
    choice("pakkq7-2","Which movement temporarily cooperated with Khilafat?",2,["Swadeshi only","Aligarh Movement","Non-Cooperation Movement","Faraizi Movement"],"Gandhi and Congress cooperated with Khilafat leaders during Non-Cooperation."),
    choice("pakkq7-3","Why did the Khilafat issue ultimately lose its basis?",3,["Britain restored Mughal rule","Congress created Pakistan","Turkey joined India","The caliphate was abolished in Turkey"],"Mustafa Kemal's reforms abolished the caliphate in 1924."),
  ],
  "pak-kq9": [
    choice("pakkq9-1","The Lahore Resolution was passed in…",1,["1930","1940","1946","1947"],"The Muslim League adopted the Lahore Resolution in March 1940."),
    choice("pakkq9-2","The Cabinet Mission came to India in…",2,["1937","1940","1946","1948"],"The 1946 Cabinet Mission proposed a constitutional framework for transfer of power."),
    choice("pakkq9-3","The 3 June Plan led directly toward…",0,["partition and transfer of power in 1947","the annulment of Bengal partition in 1911","the Khilafat Movement","the Round Table Conferences"],"The plan set out the procedure leading to partition and independence."),
  ],
  "pak-p2-2": [
    choice("pakp22-1","Which resource is renewable if managed sustainably?",1,["Natural gas","Forest","Coal","Copper ore"],"Forests can regenerate when harvesting and replanting are managed sustainably."),
    choice("pakp22-2","Over-pumping groundwater can cause…",2,["higher mountain peaks","more glaciers","falling water tables","more coal formation"],"Extraction faster than recharge lowers groundwater levels."),
    choice("pakp22-3","Sustainable resource use means…",0,["meeting present needs without seriously reducing future availability","using every resource as quickly as possible","banning all development","importing all raw materials"],"Sustainability balances present development with future needs."),
  ],
  "pak-p2-3": [
    choice("pakp23-1","Which source generates electricity from moving water?",0,["Hydroelectric power","Thermal coal only","Solar PV","Natural gas combustion"],"Hydroelectric schemes use moving/falling water to drive turbines."),
    choice("pakp23-2","One advantage of solar power in Pakistan is…",2,["it requires imported coal","it produces smoke at point of generation","high solar availability in many areas","it works only at night"],"Many regions receive strong sunshine suitable for solar generation."),
    choice("pakp23-3","Why is an energy mix useful?",1,["Every source has identical limitations","Different sources can improve reliability and reduce dependence on one fuel","It eliminates transmission needs","It guarantees zero cost"],"Diversity can improve energy security and resilience."),
  ],
  "pak-p2-4": [
    choice("pakp24-1","Why is irrigation important to much of Pakistan's agriculture?",0,["Rainfall is low or unreliable in many farming areas","All crops grow underwater","Rivers have no role","Monsoon rain is equally reliable everywhere"],"Irrigation supplements limited and variable rainfall."),
    choice("pakp24-2","Which is a cash crop?",2,["Wheat only","Gram","Cotton","Fodder only"],"Cotton is an important commercial and industrial raw-material crop."),
    choice("pakp24-3","Waterlogging can reduce crop yields because…",1,["it always adds nutrients","saturated soil reduces air around roots","it creates mountain soil","it increases root oxygen"],"Waterlogged soil has poor aeration and can be associated with salinity."),
  ],
  "pak-p2-5": [
    choice("pakp25-1","Which industry uses cotton as a major raw material?",0,["Textiles","Cement only","Shipbuilding only","Fertiliser only"],"Pakistan's textile industry depends heavily on cotton."),
    choice("pakp25-2","A common reason for locating industry near a large city is…",2,["absence of workers","no transport links","access to labour, markets and services","lack of electricity"],"Urban areas can provide labour, markets, infrastructure and business services."),
    choice("pakp25-3","Value added means…",1,["reducing a product's usefulness","increasing worth through processing or manufacturing","exporting raw material only","removing labour"],"Processing raw materials into higher-value goods increases value added."),
  ],
  "isl-p1-2a": [
    choice("islp12a-1","The first Qur'anic revelation came during the month of…",0,["Ramadan","Muharram","Safar","Rabi al-Awwal only"],"The first revelation occurred in Ramadan."),
    choice("islp12a-2","Who brought revelation to the Prophet?",2,["Mikail","Israfil","Jibril","Abu Bakr"],"Jibril conveyed revelation from God."),
    choice("islp12a-3","Revelation continued over approximately…",1,["10 years","23 years","40 years","63 years"],"Revelation began in 610 and continued until the Prophet's death in 632."),
  ],
  "isl-p1-2b": [
    choice("islp12b-1","Who ordered the first major collection of the Qur'an after many reciters died?",0,["Abu Bakr","Umar ibn Abd al-Aziz","Ali only","Mu'awiya"],"Abu Bakr authorised collection after the Battle of Yamama, on Umar's advice."),
    choice("islp12b-2","Who led the collection work for Abu Bakr?",2,["Bilal","Khalid ibn al-Walid","Zayd ibn Thabit","Abu Sufyan"],"Zayd ibn Thabit was entrusted with collecting the written and memorised material."),
    choice("islp12b-3","Why did Uthman send standard copies to major centres?",1,["To replace the Qur'an","To prevent disputes over recitation and preserve unity","To translate it into Persian","To shorten the text"],"Standard copies helped prevent disagreements as Islam spread."),
  ],
  "isl-p1-3c": [
    choice("islp13c-1","The Hijra was the migration from…",0,["Makka to Madina","Madina to Ta'if","Jerusalem to Makka","Abyssinia to Syria"],"The Prophet and Muslims migrated from Makka to Yathrib/Madina in 622."),
    choice("islp13c-2","The Constitution of Madina mainly helped…",2,["abolish all tribes instantly","create a monarchy","define relations and responsibilities within the new community","end prayer"],"The agreement organised the diverse Madinan community and mutual obligations."),
    choice("islp13c-3","The Muhajirun were…",1,["the Madinan helpers","Muslim emigrants from Makka","Byzantine visitors","scribes only"],"Muhajirun means the Emigrants who left Makka."),
  ],
  "isl-p1-3d": [
    choice("islp13d-1","Which battle was the first major Muslim victory against the Makkans?",0,["Badr","Uhud","Hunayn","Tabuk"],"Badr in 624 was the first major battle and a significant Muslim victory."),
    choice("islp13d-2","At Uhud, the Muslim position was weakened when some…",2,["traders left Madina","ships sank","archers left their assigned position","Makkans surrendered immediately"],"Some archers left the pass despite instructions, exposing the Muslim rear."),
    choice("islp13d-3","The Treaty of Hudaybiyya was significant partly because…",1,["it ended Islam","it created a period of truce that allowed wider peaceful contact","it abolished pilgrimage","it made Madina Byzantine"],"The truce reduced warfare and created opportunities for Islam to spread."),
  ],
  "isl-p2-2b": [
    choice("islp22b-1","The isnad of a hadith is its…",0,["chain of transmitters","main text","legal verdict only","translation"],"Isnad records the chain through which the report was transmitted."),
    choice("islp22b-2","The matn is the…",2,["name of the collector","chain only","actual text/content of the report","date of a battle"],"Matn is the wording or content attributed through the chain."),
    choice("islp22b-3","A key reliability check on transmitters concerned their…",1,["wealth only","character, memory and continuity of transmission","tribe only","age alone"],"Hadith scholars examined integrity, accuracy and whether transmitters could have met."),
  ],
  "isl-p2-3a": [
    choice("islp23a-1","Abu Bakr became caliph after the Prophet's death in…",0,["632","622","644","656"],"The Prophet died in 632 and Abu Bakr became the first caliph."),
    choice("islp23a-2","The Ridda wars dealt with…",2,["Roman invasion only","the conquest of Spain","rebellion and refusal of allegiance/zakat in Arabia","the Battle of Siffin"],"Abu Bakr fought groups challenging the authority and unity of the Muslim state."),
    choice("islp23a-3","Why was Abu Bakr's response to the Ridda important?",1,["It ended prayer","It restored political and religious unity in Arabia","It moved the capital to Damascus","It abolished zakat"],"His firmness preserved the unity of the early Muslim community."),
  ],
  "isl-p2-3b": [
    choice("islp23b-1","Umar is especially associated with…",0,["major administrative organisation of the expanding state","compiling Sahih al-Bukhari","founding the Abbasid dynasty","abolishing the calendar"],"Umar developed administrative arrangements as Muslim territory expanded."),
    choice("islp23b-2","The Hijri calendar dates from the…",2,["first revelation","Battle of Badr","Hijra","conquest of Makka"],"The Islamic calendar era begins from the Hijra."),
    choice("islp23b-3","Which principle is strongly illustrated by Umar's rule?",1,["personal luxury","accountability and justice in government","hereditary monarchy","withdrawal from administration"],"Accounts of Umar's leadership emphasise justice, consultation and accountability."),
  ],
  "isl-p2-4a": [
    choice("islp24a-1","Belief in tawhid means belief in…",0,["the oneness of God","many equal gods","prophets as divine","angels as partners"],"Tawhid affirms God's absolute oneness."),
    choice("islp24a-2","Which is one of the Articles of Faith?",2,["Pilgrimage as a place","Trade","Belief in angels","Arabic language"],"Belief in angels is among the core Articles of Faith."),
    choice("islp24a-3","Belief in the Last Day encourages Muslims to recognise…",1,["that actions have no consequences","moral accountability before God","that worldly life is eternal","that revelation is unnecessary"],"Resurrection and judgement connect belief with responsibility for conduct."),
  ],
  "isl-p2-4b": [
    choice("islp24b-1","The Shahada affirms…",0,["God's oneness and Muhammad's messengership","only fasting","only charity","pilgrimage alone"],"The testimony declares that there is no god but God and Muhammad is His messenger."),
    choice("islp24b-2","How many obligatory daily prayers are there?",2,["Three","Four","Five","Seven"],"Muslims perform five obligatory daily prayers."),
    choice("islp24b-3","Congregational prayer especially reinforces…",1,["social isolation","unity and equality in worship","wealth differences","tribal rank"],"Standing together in prayer expresses shared worship and community."),
  ],

  "chem-3-3b": [
    choice("chem33b-1","If 0.50 mol of Mg reacts with excess hydrochloric acid, how many moles of HCl are required?","0",[ "1.00 mol","0.50 mol","0.25 mol","2.00 mol"],"Mg + 2HCl → MgCl2 + H2, so the mole ratio is 1:2."),
    choice("chem33b-2","In 2H2 + O2 → 2H2O, 3 mol H2 and 1 mol O2 react. Which is limiting?","1",[ "H2","O2","H2O","Neither"],"One mole of O2 requires two moles of H2; O2 is limiting."),
    choice("chem33b-3","Why can an excess reactant remain after a reaction?","2",[ "It has no particles","It is always a catalyst","The other reactant is used up first","Products cannot form"],"The limiting reactant is consumed first, so an excess of the other reactant can remain.")
  ],
  "chem-3-3c": [
    choice("chem33c-1","What is the concentration of a solution containing 0.20 mol solute in 0.50 dm³?","3",[ "0.10 mol/dm³","0.25 mol/dm³","0.35 mol/dm³","0.40 mol/dm³"],"Concentration = moles ÷ volume = 0.20 ÷ 0.50 = 0.40 mol/dm³."),
    choice("chem33c-2","Which unit is commonly used for molar concentration?","0",[ "mol/dm³","g/cm³","cm³/mol","mol/g"],"Amount concentration is expressed in mol per dm³."),
    choice("chem33c-3","An empirical formula shows the…","1",[ "exact number of molecules","simplest whole-number ratio of atoms","relative atomic masses only","number of neutrons"],"Empirical formula gives the simplest whole-number ratio of elements.")
  ],
  "chem-4-1b": [
    choice("chem41b-1","During electrolysis of molten lead(II) bromide, lead ions are discharged at the…","2",[ "anode","electrolyte surface","cathode","power supply"],"Pb²+ gains electrons at the negative cathode."),
    choice("chem41b-2","What is the half-equation for formation of chlorine from chloride ions?","0",[ "2Cl− → Cl2 + 2e−","Cl− + e− → Cl","Cl2 + 2e− → 2Cl−","Cl− → Cl2 + e−"],"Oxidation of chloride releases two electrons to form Cl2."),
    choice("chem41b-3","Electroplating an object with copper requires copper ions to be…","1",[ "oxidised at the object","reduced at the object","removed from solution without electrons","converted into neutrons"],"Cu²+ gains electrons and deposits as copper at the cathode.")
  ],
  "chem-6-3": [
    choice("chem63-1","At equilibrium in a closed system, the forward and reverse reactions…","0",[ "occur at equal rates","stop completely","have equal amounts of reactants","produce no products"],"Dynamic equilibrium has equal forward and reverse rates."),
    choice("chem63-2","If the concentration of a reactant is increased, equilibrium usually shifts to…","3",[ "the side with fewer particles only","the reactant side","no side","the side that uses up the added reactant"],"The system responds by opposing the concentration increase."),
    choice("chem63-3","A catalyst changes an equilibrium mixture by…","2",[ "increasing the yield","moving equilibrium permanently","speeding both directions without changing the equilibrium position","removing products"],"A catalyst lowers activation energy for both directions and reaches equilibrium faster.")
  ],
  "chem-9-6": [
    choice("chem96-1","Why is carbon used to extract some metals from their ores?","1",[ "Carbon is always the most reactive element","Carbon can reduce oxides of metals below it in the reactivity series","Carbon supplies neutrons","Carbon prevents all oxidation"],"A metal oxide below carbon can be reduced because carbon is more reactive."),
    choice("chem96-2","Which metal is commonly extracted by electrolysis rather than carbon reduction?","3",[ "Iron","Copper","Zinc","Aluminium"],"Aluminium is above carbon in the reactivity series."),
    choice("chem96-3","In extraction, the ore is processed mainly to…","0",[ "obtain a usable metal from its compound","increase the amount of gangue","turn every metal into a gas","remove all electrons"],"Extraction separates and reduces the metal-containing compound to obtain the metal.")
  ],
  "math-e2-10": [
    choice("mathe210-1","For y = x², what is y when x = −3?","2",[ "−9","−6","9","6"],"Squaring −3 gives 9."),
    choice("mathe210-2","The graph of y = 2x + 1 crosses the y-axis at…","0",[ "1","2","−1","0"],"When x = 0, y = 1."),
    choice("mathe210-3","What does a point of intersection of two graphs represent?","3",[ "A value that satisfies neither equation","Only the larger x-value","The maximum value always","A pair satisfying both equations"],"The coordinates at the intersection satisfy both relationships.")
  ],
  "math-e2-12": [
    choice("mathe212-1","The derivative of x² is…","1",[ "x","2x","x³","2"],"The power rule gives 2x."),
    choice("mathe212-2","At a stationary point, the gradient is…","0",[ "0","1","undefined always","−1"],"A stationary point has zero instantaneous gradient."),
    choice("mathe212-3","For y = 3x² + 2x, dy/dx is…","2",[ "3x + 2","6x + 2","6x² + 2","x² + 2"],"Differentiate term by term: 6x + 2.")
  ],
  "math-e4-7": [
    choice("mathe47-1","The angle at the centre of a circle is how many times the angle at the circumference standing on the same arc?","1",[ "Equal","Twice","Half","Three times"],"The angle at the centre is twice the angle at the circumference."),
    choice("mathe47-2","An angle in a semicircle is…","0",[ "90°","45°","180°","60°"],"The angle subtended by a diameter at the circumference is a right angle."),
    choice("mathe47-3","Opposite angles of a cyclic quadrilateral sum to…","3",[ "90°","180°","270°","360°"],"Opposite angles in a cyclic quadrilateral are supplementary.")
  ],
  "math-e6-5": [
    choice("mathe65-1","Which rule relates three sides and an included angle in a non-right-angled triangle?","2",[ "Pythagoras only","Area rule only","Cosine rule","Midpoint rule"],"The cosine rule connects three sides and the included angle."),
    choice("mathe65-2","The sine rule can be used when a triangle has…","0",[ "a known angle-side opposite pair","only three sides with no angle","only one side","no measurable angle"],"The sine rule requires at least one known opposite side-angle pair."),
    choice("mathe65-3","When finding an angle with the cosine rule, the final calculator step uses…","1",[ "sin","cos⁻¹","tan⁻¹","√"],"The inverse cosine finds the angle.")
  ],
  "math-e7-4": [
    choice("mathe74-1","If vector AB = b − a, what does this represent?","0",[ "The displacement from A to B","The displacement from B to A","The midpoint","The magnitude only"],"Subtracting position vector a from b gives the directed displacement A to B."),
    choice("mathe74-2","If two vectors are parallel, one can be written as…","2",[ "their sum only","their difference only","a scalar multiple of the other","a square root"],"Parallel vectors have proportional components."),
    choice("mathe74-3","A vector proof should normally show…","1",[ "only a diagram","equal vector expressions for the required result","a probability","a statistical average"],"Vector geometry is established by algebraic vector equality.")
  ],
  "math-e8-4": [
    choice("mathe84-1","Conditional probability P(A|B) means probability of…","2",[ "A and B regardless of B","B given A","A given B","neither event"],"The notation reads probability of A given that B has occurred."),
    choice("mathe84-2","If P(A and B)=0.2 and P(B)=0.5, P(A|B) is…","0",[ "0.4","0.1","0.7","2.5"],"P(A|B)=P(A and B)/P(B)=0.2/0.5=0.4."),
    choice("mathe84-3","Conditional probability is especially useful when…","3",[ "events are impossible","there is no information","all outcomes are equal","new information changes the relevant sample space"],"Conditioning restricts attention to outcomes consistent with the given event.")
  ],
  "pak-kq8": [
    choice("pakkq8-1","Why was the Simon Commission opposed by many Indian politicians?","1",[ "It granted immediate independence","It had no Indian members","It abolished elections","It supported the Khilafat Movement"],"Its all-British composition was widely criticised."),
    choice("pakkq8-2","What was a major purpose of the Nehru Report of 1928?","0",[ "Propose a constitutional framework for India","Create Pakistan immediately","End all provincial government","Restore Mughal rule"],"The report proposed constitutional arrangements for self-government."),
    choice("pakkq8-3","Why did Jinnah present his Fourteen Points?","2",[ "To support British rule permanently","To abolish provincial autonomy","To safeguard Muslim political interests","To end separate electorates"],"The points set out safeguards Jinnah regarded as necessary for Muslims.")
  ],
  "pak-kq11": [
    choice("pakkq11-1","Which was an immediate challenge for Pakistan in 1947?","3",[ "Joining the European Union","Building a navy for the Pacific","Managing an established industrial economy","Resettling refugees and establishing administrative structures"],"Partition created a major refugee and administrative crisis."),
    choice("pakkq11-2","Why was the Kashmir dispute important soon after independence?","1",[ "It concerned only trade","It involved territory, security and competing claims by India and Pakistan","It ended the Constituent Assembly","It was unrelated to partition"],"Kashmir became a major security and political dispute."),
    choice("pakkq11-3","What was one reason Pakistan faced economic difficulty in 1947?","0",[ "Much industrial and financial infrastructure was left outside Pakistan","It had too many factories","It controlled all former British reserves","It had no population"],"Partition left Pakistan with a smaller industrial base and financial constraints.")
  ],
  "pak-p2-6": [
    choice("pakp26-1","A favourable balance of trade means…","2",[ "imports exceed exports","exports and imports are always zero","the value of exports exceeds the value of imports","all trade is domestic"],"A favourable balance means export value is greater than import value."),
    choice("pakp26-2","Why are ports important to Pakistan's trade?","0",[ "They handle bulk imports and exports by sea","They replace all roads","They eliminate customs","They create rainfall"],"Sea transport is efficient for large volumes of international trade."),
    choice("pakp26-3","Which can increase export competitiveness?","3",[ "Higher transport delays","Poor quality control","Unreliable supply","Improved quality, productivity and market access"],"Competitiveness depends on cost, quality, reliability and access to markets.")
  ],
  "pak-p2-8": [
    choice("pakp28-1","Population density is calculated as…","1",[ "population × area","population ÷ area","area ÷ population","births ÷ deaths"],"Density is people per unit area."),
    choice("pakp28-2","Which factor can encourage rural-to-urban migration?","0",[ "Employment and services in cities","Lack of all transport","No schools in cities","Lower urban wages always"],"Jobs, education and services can act as urban pull factors."),
    choice("pakp28-3","Unemployment can be reduced by…","2",[ "reducing skills","closing industries","investment, training and job creation","ending transport"],"Skills and investment can improve employment opportunities.")
  ],
  "isl-p1-3e": [
    choice("islp13e-1","What is one major lesson from the Prophet's final sermon?","0",[ "Human dignity and equality under God","Tribal superiority","Wealth determines worth","Revenge is obligatory"],"The sermon stressed equality, rights and responsibility."),
    choice("islp13e-2","How did the Prophet demonstrate mercy after the conquest of Makka?","3",[ "He expelled every resident","He destroyed the Ka'ba","He ended all agreements","He granted a broad amnesty"],"The general amnesty demonstrated forgiveness and restraint."),
    choice("islp13e-3","Why is the Prophet's character studied in Islamiyat?","1",[ "Only to memorise dates","It provides a model for belief, conduct and leadership","It replaces Qur'an study","It concerns politics only"],"His conduct is presented as a practical model for Muslims.")
  ],
  "isl-p2-2c": [
    choice("islp22c-1","Why are major hadith collections important?","2",[ "They replace the Qur'an","They contain only history","They preserve reports used in understanding Sunnah and law","They remove the need for scholarship"],"Hadith collections preserve reports used to understand the Prophet's teachings and practice."),
    choice("islp22c-2","What is the main purpose of classifying hadith?","0",[ "To assess reliability and status","To change their wording","To remove isnad","To make every report equally strong"],"Classification distinguishes reports according to scholarly criteria."),
    choice("islp22c-3","How can hadith guide Muslim practice?","1",[ "By providing unrelated stories","By explaining and exemplifying principles of belief and worship","By replacing all reasoning","By eliminating Qur'anic guidance"],"Hadith can explain, illustrate and apply Islamic teachings.")
  ],
  "isl-p2-3c": [
    choice("islp23c-1","Why did Uthman standardise copies of the Qur'an?","3",[ "To shorten it","To add new passages","To translate it into every language","To reduce disputes over recitation and preserve unity"],"Standard copies helped prevent differing readings from becoming divisive."),
    choice("islp23c-2","What was a major achievement during Uthman's caliphate?","1",[ "Ending all expansion","Continuing expansion of the Muslim state","Abolishing the Qur'an","Moving the capital to Makka"],"The state continued to expand during his rule."),
    choice("islp23c-3","What contributed to opposition against Uthman?","2",[ "He had no supporters","There were no political disputes","Complaints about governors and administration contributed to unrest","He refused to govern"],"Political grievances and accusations about administration contributed to opposition.")
  ],
  "isl-p2-4c": [
    choice("islp24c-1","Zakat is primarily a duty involving…","0",[ "purification of wealth and support for eligible recipients","pilgrimage only","fasting every day","military service only"],"Zakat purifies wealth and provides an obligatory social duty toward eligible recipients."),
    choice("islp24c-2","Sawm in Ramadan develops…","2",[ "indifference to others","wealth accumulation","self-discipline and God-consciousness","avoidance of worship"],"Fasting develops self-control, patience and taqwa."),
    choice("islp24c-3","Which is a social effect of zakat?","1",[ "Increasing inequality deliberately","Supporting vulnerable members of society","Ending all work","Replacing prayer"],"Zakat has a welfare and distributive function.")
  ],
};


const ADDITIONAL_SPECIFIC: Record<string, PrivateQuestion[]> = {
  "chem-2-4": [
    choice("chem24-1","What happens when sodium chloride forms from sodium and chlorine?",0,["Sodium transfers an electron to chlorine","Both atoms lose all electrons","Chlorine transfers a proton to sodium","The nuclei combine"],"Sodium forms Na+ by losing one electron and chlorine forms Cl− by gaining it."),
    choice("chem24-2","Why does solid sodium chloride not conduct electricity?",2,["It contains no charged particles","Its ions are covalent","Its ions are fixed in a lattice and cannot move","Its electrons are delocalised"],"The ions are charged but cannot move through the solid lattice."),
    choice("chem24-3","Why does molten sodium chloride conduct electricity?",1,["Its atoms become neutral","Its ions are free to move","It contains free neutrons","Its covalent bonds become metallic"],"Molten ionic compounds contain mobile ions that carry charge.")
  ],
  "chem-5-1b": [
    choice("chem51b-1","On an energy level diagram for an exothermic reaction, the products are…",2,["higher in energy than reactants","at exactly the same energy","lower in energy than reactants","always at zero energy"],"Energy is released overall, so products have lower chemical energy."),
    choice("chem51b-2","Breaking chemical bonds is generally…",0,["endothermic","exothermic","energy-neutral","impossible"],"Energy must be supplied to break bonds."),
    choice("chem51b-3","A reaction is exothermic overall when…",3,["more energy is absorbed breaking bonds than released","no bonds change","all products are gases","more energy is released forming bonds than absorbed breaking bonds"],"The net energy change is negative when bond formation releases more energy than bond breaking absorbs.")
  ],
  "chem-6-2b": [
    choice("chem62b-1","Why is a tangent drawn to a volume-time graph when finding an initial rate?",1,["to find the final volume","to find the gradient at the start","to find the temperature","to prove the reaction is reversible"],"The initial gradient gives the initial rate."),
    choice("chem62b-2","Which change improves the fairness of a rate experiment?",3,["change several variables at once","use different apparatus each trial","ignore repeat results","change one independent variable while controlling others"],"Only the intended independent variable should change."),
    choice("chem62b-3","A catalyst changes a rate graph by making the reaction…",0,["reach the same endpoint faster","produce a different equilibrium amount in every reaction","use more reactants","stop before products form"],"A catalyst provides a lower activation-energy pathway and does not change the final equilibrium position.")
  ],
  "chem-6-4": [
    choice("chem64-1","Oxidation is best defined as…",1,["gain of electrons","loss of electrons","gain of neutrons","loss of protons"],"Oxidation is loss of electrons."),
    choice("chem64-2","In a redox reaction, the reducing agent…",3,["is always oxygen","gains neutrons","cannot react","causes another substance to be reduced and is itself oxidised"],"The reducing agent donates electrons and is oxidised."),
    choice("chem64-3","An increase in oxidation number represents…",0,["oxidation","reduction","neutralisation","precipitation"],"Oxidation number increases when a species is oxidised.")
  ],
  "chem-11-1": [
    choice("chem111-1","A homologous series has members with the same…",2,["relative mass only","number of carbon atoms","functional group and general chemical properties","physical state at all temperatures"],"Members share a functional group and similar chemical reactions."),
    choice("chem111-2","Which feature distinguishes a functional group?",0,["It is the part of a molecule responsible for characteristic reactions","It is always a carbon chain of four atoms","It contains no atoms","It determines only colour"],"Functional groups control characteristic organic reactions."),
    choice("chem111-3","Successive members of many homologous series differ by…",1,["H","CH2","OH","CO2"],"Adjacent members differ by CH2.")
  ],
  "chem-11-6": [
    choice("chem116-1","Which functional group is present in an alcohol?",0,["−OH","C=C","−COOH","−CHO only"],"Alcohols contain a hydroxyl group, −OH."),
    choice("chem116-2","What product forms when ethanol is oxidised completely?",2,["ethene","methane","ethanoic acid","propane"],"Ethanol can be oxidised to ethanoic acid under suitable conditions."),
    choice("chem116-3","Which condition can produce ethene from ethanol?",3,["cooling with water","adding sodium chloride","mixing with oxygen only","heating with a suitable catalyst or dehydrating agent"],"Ethanol can be dehydrated to ethene under suitable conditions.")
  ],
  "chem-11-7": [
    choice("chem117-1","Which functional group identifies a carboxylic acid?",1,["−OH only","−COOH","C=C","−NH2"],"Carboxylic acids contain the −COOH group."),
    choice("chem117-2","Ethanoic acid reacts with ethanol to form…",2,["ethene and water","methane and oxygen","ethyl ethanoate and water","sodium ethanoate only"],"An alcohol and carboxylic acid can undergo esterification."),
    choice("chem117-3","Esters are often recognised by…",0,["distinctive fruity smells","strong metallic bonding","ionic lattices","very high electrical conductivity"],"Many esters have characteristic fruity or sweet smells.")
  ],
  "chem-11-8": [
    choice("chem118-1","Addition polymerisation requires monomers containing…",3,["only single bonds","ionic lattices","metal ions","a carbon-carbon double bond"],"Alkenes can open their C=C bonds and join into addition polymers."),
    choice("chem118-2","Condensation polymerisation differs because it…",1,["uses only alkanes","eliminates a small molecule such as water","never forms long chains","always requires metal ions"],"Condensation polymerisation forms a polymer while eliminating a small molecule."),
    choice("chem118-3","Poly(ethene) is formed from…",2,["ethanol","ethane","ethene","ethanoic acid"],"Ethene monomers undergo addition polymerisation.")
  ],
  "chem-12-1": [
    choice("chem121-1","A good experimental plan should identify…",0,["independent, dependent and controlled variables","only the apparatus","only the final answer","only the temperature"],"A sound plan states what is changed, measured and controlled."),
    choice("chem121-2","Repeating an experiment mainly helps to…",2,["change the independent variable","remove all systematic error","identify anomalous results and improve reliability","guarantee the hypothesis is true"],"Repeats help identify anomalies and assess consistency."),
    choice("chem121-3","If one result is very different from the others, it should first be…",1,["silently deleted","checked as a possible anomaly and investigated","used as the only result","rounded until it agrees"],"An anomalous result should be investigated rather than hidden.")
  ],
  "chem-12-5": [
    choice("chem125-1","Which test identifies carbon dioxide?",0,["bubble the gas through limewater; it turns milky","use a glowing splint; it relights","use blue litmus; it turns green","use cobalt chloride paper; it turns blue"],"Carbon dioxide turns limewater milky."),
    choice("chem125-2","Which test gives a squeaky pop with hydrogen?",3,["damp red litmus","limewater","blue cobalt chloride paper","a lighted splint"],"Hydrogen burns with a characteristic squeaky pop."),
    choice("chem125-3","What is the flame-test colour for sodium ions?",2,["lilac","brick red","yellow","green"],"Sodium ions produce a bright yellow flame.")
  ],
  "math-e1-11": [
    choice("mathe111-1","If 3:5 is simplified by dividing both parts by their common factor, the ratio remains…",0,["equivalent","larger","smaller","undefined"],"Multiplying or dividing both parts by the same non-zero factor preserves a ratio."),
    choice("mathe111-2","If 4 notebooks cost $12, the unit cost is…",2,["$2","$2.50","$3","$4"],"12 ÷ 4 = 3."),
    choice("mathe111-3","If y is directly proportional to x, then y/x is…",1,["variable","constant","zero always","negative always"],"Direct proportion means y = kx, so y/x = k.")
  ],
  "math-e2-3": [
    choice("mathe23-1","To simplify (x^2−9)/(x−3), factorising gives…",2,["x−3","x+9","x+3 for x≠3","x^2−6"],"x^2−9=(x−3)(x+3), so the common factor cancels for x≠3."),
    choice("mathe23-2","When cancelling a factor in an algebraic fraction, you must consider…",0,["values that make the original denominator zero","only positive values","the numerator's colour","the units"],"Restrictions come from values that make the original denominator zero."),
    choice("mathe23-3","Which is a valid first step for (x+2)/x + 1/x?",1,["multiply only the numerator by x","combine over the common denominator x","cancel x with x+2","subtract the fractions"],"Both fractions can be combined over denominator x.")
  ],
  "math-e2-13": [
    choice("mathe213-1","If f(x)=2x+3, f(4)=…",0,["11","8","7","5"],"Substitute x=4: 2(4)+3=11."),
    choice("mathe213-2","The inverse of a one-to-one function reverses…",3,["only multiplication","only addition","the graph's axes","the mapping from input to output"],"An inverse function reverses the original input-output mapping."),
    choice("mathe213-3","For a function, each input should have…",2,["two outputs","no output","exactly one output","at least three outputs"],"A function assigns exactly one output to each input.")
  ],
  "math-e4-4": [
    choice("mathe44-1","Similar shapes have corresponding angles that are…",1,["always supplementary","equal","always right angles","random"],"Corresponding angles in similar figures are equal."),
    choice("mathe44-2","If corresponding lengths have scale factor 3, areas have scale factor…",0,["9","3","6","27"],"Area scale factor is the square of the linear scale factor."),
    choice("mathe44-3","Congruent shapes have the same…",3,["area only","perimeter only","angles only","shape and size"],"Congruent figures are identical in shape and size.")
  ],
  "math-e4-8": [
    choice("mathe48-1","The angle between a tangent and the radius at the point of contact is…",0,["90°","45°","180°","60°"],"A tangent is perpendicular to the radius at the point of contact."),
    choice("mathe48-2","The angle between a tangent and a chord equals the angle in the…",2,["same tangent","alternate segment","centre only","diameter only"],"The alternate segment theorem relates the tangent-chord angle to the angle in the opposite arc."),
    choice("mathe48-3","Tangents drawn from the same external point to a circle have…",1,["different lengths always","equal lengths","zero length","the same radius"],"The two tangent lengths from a common external point are equal.")
  ],
  "math-e5-3": [
    choice("mathe53-1","The area of a sector with angle θ in degrees and radius r is…",2,["πr²θ","2πrθ","θ/360 × πr²","θ/180 × r"],"A sector is the same fraction θ/360 of a full circle."),
    choice("mathe53-2","The arc length of a sector is…",0,["θ/360 × 2πr","θ/360 × πr²","2πr²","πr/θ"],"Arc length is the same fraction of the circumference as the sector angle is of 360°."),
    choice("mathe53-3","For a semicircle, the sector angle is…",3,["90°","120°","270°","180°"],"A semicircle is half a full turn.")
  ],
  "math-e5-4": [
    choice("mathe54-1","The volume of a cylinder is…",1,["2πrh","πr²h","πdh²","πr+h"],"Volume equals base area πr² multiplied by height h."),
    choice("mathe54-2","Surface area differs from volume because surface area is measured in…",0,["square units","cubic units","degrees","litres only"],"Area uses square units while volume uses cubic units."),
    choice("mathe54-3","When using a scale factor k for similar solids, volume scales by…",2,["k","2k","k³","k²"],"Three-dimensional volume scales with the cube of the linear scale factor.")
  ],
  "math-e6-2": [
    choice("mathe62-1","In a right triangle, sin θ equals…",3,["adjacent/hypotenuse","opposite/adjacent","hypotenuse/opposite","opposite/hypotenuse"],"SOH gives sin θ = opposite/hypotenuse."),
    choice("mathe62-2","In a right triangle, cos θ equals…",0,["adjacent/hypotenuse","opposite/hypotenuse","opposite/adjacent","hypotenuse/adjacent"],"CAH gives cos θ = adjacent/hypotenuse."),
    choice("mathe62-3","If tan θ = 3/4 for an acute angle, θ is approximately…",1,["30.0°","36.9°","53.1°","75.0°"],"θ = tan⁻¹(3/4) ≈ 36.9°.")
  ],
  "math-e7-1": [
    choice("mathe71-1","A rotation is defined by its centre and…",2,["scale factor only","equation only","angle and direction","gradient only"],"A rotation needs a centre, angle and direction."),
    choice("mathe71-2","A reflection is defined by a…",0,["mirror line","centre and angle","scale factor","vector magnitude only"],"The mirror line determines a reflection."),
    choice("mathe71-3","An enlargement is described by a centre and…",1,["gradient","scale factor","probability","radius"],"An enlargement needs a centre and scale factor.")
  ],
  "math-e9-6": [
    choice("mathe96-1","On a cumulative frequency graph, the median is found at cumulative frequency…",3,["0","the maximum x-value","the range","half the total frequency"],"The median corresponds to half the total cumulative frequency."),
    choice("mathe96-2","The interquartile range is…",1,["Q1+Q3","Q3−Q1","median−Q1","maximum−minimum"],"IQR measures the spread of the middle 50% using Q3−Q1."),
    choice("mathe96-3","A cumulative frequency curve can be used to estimate…",0,["percentiles and quartiles","exact individual raw values","chemical formulae","gradient only"],"Percentiles and quartiles can be read approximately from the curve.")
  ],
  "math-e9-7": [
    choice("mathe97-1","A histogram is appropriate for…",2,["categorical labels only","individual names","continuous grouped data","single exact values only"],"Histograms represent continuous grouped data."),
    choice("mathe97-2","In a histogram, frequency density is…",0,["frequency ÷ class width","frequency × class width","class width ÷ frequency","frequency + class width"],"Frequency density equals frequency divided by class width."),
    choice("mathe97-3","The area of a histogram bar represents…",1,["class width only","frequency","frequency density only","the mean"],"Bar area is proportional to frequency.")
  ],
  "pak-kq1": [
    choice("pakkq1-1","Why were Shah Waliullah's ideas important in the study of Muslim revival in South Asia?",2,["He created Pakistan in 1947","He introduced modern industry","He sought to strengthen Muslim religious understanding and unity","He abolished Mughal rule"],"His reformist thought sought revival and greater understanding of Islam."),
    choice("pakkq1-2","A central theme of Muslim revival movements was…",0,["renewing religious practice and identity","ending all education","rejecting all scholarship","removing religious law"],"Revival movements commonly stressed renewal of religious understanding and practice."),
    choice("pakkq1-3","When answering a question on religious thinkers, a strong response should…",3,["list names only","use unrelated political events","avoid explaining ideas","identify the thinker, explain the idea and its significance"],"Cambridge-style history answers need accurate knowledge plus explanation of significance.")
  ],
  "pak-kq6": [
    choice("pakkq6-1","Why was the Simla Deputation of 1906 significant?",1,["It ended British rule","It established a political claim for separate Muslim representation","It created Bangladesh","It passed the Lahore Resolution"],"The deputation pressed for Muslim political safeguards and separate representation."),
    choice("pakkq6-2","The All-India Muslim League was founded in…",0,["1906","1919","1930","1947"],"The Muslim League was founded at Dacca in 1906."),
    choice("pakkq6-3","A key concern of early Muslim political organisation was…",2,["ending all elections","removing provincial identities","protecting Muslim political interests","abolishing representative government"],"Political safeguards for Muslims were a central concern.")
  ],
  "pak-kq10": [
    choice("pakkq10-1","The Allahabad Address of 1930 is associated with…",3,["Sir Syed Ahmad Khan","Liaquat Ali Khan","Rahmat Ali","Allama Iqbal"],"Iqbal's address discussed a Muslim-majority political unit in north-west India."),
    choice("pakkq10-2","Rahmat Ali is associated with the name…",1,["Pakistan in the Lahore Resolution","Pakistan in the pamphlet Now or Never","the Nehru Report","the Simla Deputation"],"Rahmat Ali used the name Pakistan in his 1933 pamphlet."),
    choice("pakkq10-3","Jinnah's political role in the Pakistan Movement included…",0,["negotiating constitutional safeguards and Muslim political representation","leading the Khilafat Movement","writing the Allahabad Address","serving as Viceroy"],"Jinnah pursued constitutional and political safeguards for Muslims.")
  ],
  "pak-kq12": [
    choice("pakkq12-1","Why was the Objectives Resolution important?",2,["It created East Pakistan","It ended martial law permanently","It set principles for Pakistan's constitutional development","It introduced the 1973 constitution immediately"],"It laid down principles that influenced later constitutional development."),
    choice("pakkq12-2","A major political challenge after Jinnah was…",0,["building stable constitutional and representative institutions","ending all provincial government","abolishing the civil service","removing elections from politics"],"Pakistan faced continuing constitutional and political instability."),
    choice("pakkq12-3","When evaluating political stability, an answer should consider…",3,["only one leader","only economic statistics","only foreign policy","institutions, leadership, constitutional issues and political events"],"Judgement requires comparison of relevant political factors.")
  ],
  "pak-p2-1": [
    choice("pakp21-1","Which river is central to Pakistan's major river system?",1,["Ravi only","Indus","Chenab only","Jhelum only"],"The Indus is the main river of Pakistan's drainage system."),
    choice("pakp21-2","Why do relief and climate affect settlement patterns?",3,["They have no effect","They determine only language","They affect only exports","They influence water supply, farming, transport and living conditions"],"Physical geography affects where people can live and economic activity can develop."),
    choice("pakp21-3","Which area is associated with high mountain relief?",0,["Karakoram and Himalaya region","Indus delta only","Thar Desert only","Lower Indus plain only"],"Northern Pakistan includes major high mountain ranges.")
  ],
  "pak-p2-3": [
    choice("pakp23-1","Which source provides a large share of Pakistan's electricity generation?",2,["tidal power only","geothermal only","thermal and hydel sources","human muscle"],"Pakistan uses both thermal generation and hydel power extensively."),
    choice("pakp23-2","Why is energy shortage a development issue?",0,["Unreliable supply can disrupt industry, services and households","It affects only tourism","It has no effect on factories","It changes mountain height"],"Energy reliability affects economic activity and living standards."),
    choice("pakp23-3","One way to improve energy sustainability is to…",1,["increase waste only","diversify renewable and efficient energy sources","stop maintaining power stations","use more fuel per unit of electricity"],"Diversification and efficiency can reduce dependence on less sustainable sources.")
  ],
  "pak-p2-4": [
    choice("pakp24-1","Which factor is essential for irrigated agriculture in Pakistan?",3,["volcanic ash","permafrost","tidal waves","reliable water supply"],"Irrigation depends on reliable water from rivers, canals, reservoirs or groundwater."),
    choice("pakp24-2","Why can salinity reduce agricultural productivity?",1,["It increases soil fertility indefinitely","Salt accumulation can reduce plant water uptake","It removes all soil minerals","It guarantees higher yields"],"Excess salts make it harder for crops to take up water."),
    choice("pakp24-3","A sustainable agricultural strategy should aim to…",0,["use water and soil resources efficiently while maintaining productivity","maximise waste","ignore drainage","increase erosion"],"Sustainability balances production with long-term resource protection.")
  ],
  "pak-p2-5": [
    choice("pakp25-1","Why are industries often located near transport routes?",2,["transport is irrelevant","factories cannot use roads","raw materials and finished goods need efficient movement","workers never travel"],"Transport reduces the time and cost of moving inputs and products."),
    choice("pakp25-2","Which factor can encourage industrial development?",0,["reliable power, labour, capital and markets","lack of infrastructure","unreliable electricity","no access to raw materials"],"Industry depends on a combination of resources, infrastructure and markets."),
    choice("pakp25-3","A major environmental issue from industry can be…",1,["increased biodiversity automatically","air and water pollution","lower waste production always","elimination of traffic"],"Industrial processes can release pollutants unless controlled.")
  ],
  "isl-p1-2c": [
    choice("islp12c-1","Why is the Qur'an important as a source of law and guidance?",0,["It provides principles and commands that guide Muslim belief and conduct","It is used only for historical dates","It replaces all personal responsibility","It contains no guidance for conduct"],"Muslims use Qur'anic teachings as a primary source of belief, worship and moral guidance."),
    choice("islp12c-2","When applying a Qur'anic teaching today, a strong answer should…",2,["repeat the passage only","give an unrelated example","identify the teaching and explain a concrete application","avoid explaining its significance"],"Application requires linking the teaching to a specific action or situation."),
    choice("islp12c-3","The Qur'an is regarded by Muslims as…",1,["a later historical summary","the revealed word of God","a collection written by companions","a biography of the Prophet only"],"Muslims believe the Qur'an is the revealed word of Allah.")
  ],
  "isl-p1-4a": [
    choice("islp14a-1","Why are the Prophet's family members studied in Islamiyat?",3,["only to memorise names","because family history replaces Qur'an study","because they were all rulers","their lives provide examples of faith, character and family relationships"],"The family is studied for knowledge of their lives and examples of conduct."),
    choice("islp14a-2","Khadija was important in the Prophet's early life because she…",0,["supported him at the beginning of his mission","was his daughter","was a caliph","led the conquest of Makka"],"Khadija supported the Prophet emotionally and materially and was the first to believe in him."),
    choice("islp14a-3","Fatima was the daughter of…",2,["Abu Bakr","Umar","the Prophet Muhammad","Uthman"],"Fatima was one of the Prophet's daughters.")
  ],
  "isl-p2-3d": [
    choice("islp23d-1","A major challenge during Ali's caliphate was…",1,["the first revelation","civil conflict within the Muslim community","the compilation of the Qur'an under Abu Bakr","the conquest of Makka"],"Ali's caliphate was marked by serious internal conflicts."),
    choice("islp23d-2","The Battle of the Camel involved Ali and opponents including…",3,["the Roman emperor","the Prophet's companions only as a united side","the Abbasids","Aisha, Talha and Zubayr"],"The Battle of the Camel was an early major conflict of Ali's caliphate."),
    choice("islp23d-3","When assessing Ali's leadership, an answer should consider…",0,["the civil conflicts, his decisions and the difficulties of maintaining unity","only military victories","only his family background","only later dynasties"],"A balanced answer connects leadership decisions with the circumstances of civil conflict.")
  ],
  "isl-p2-4d": [
    choice("islp24d-1","Hajj is obligatory for a Muslim who…",2,["is under five years old","has never prayed","is physically and financially able to perform it","has no intention to worship"],"Hajj is obligatory once for those who are able to undertake it."),
    choice("islp24d-2","Jihad in Islamic teaching can refer to…",0,["striving in the cause of God, including moral struggle and other legitimate forms","only warfare","only pilgrimage","only charity"],"Jihad has a broad meaning of striving; its interpretation depends on context."),
    choice("islp24d-3","A strong Islamiyat answer on Hajj or Jihad should…",1,["give a definition only","explain the teaching and its practical significance","avoid Qur'an and Hadith evidence","list unrelated historical dates"],"Higher-level responses connect accurate teaching with significance and application.")
  ],
};

function substantiveFactsFor(topic: Topic): PrivateQuestion[] {
  const fact = SUBSTANTIVE_TOPIC_FACTS[topic.id];
  if (!fact) return [];
  const key = topic.id.replace(/[^a-z0-9]/gi, "");
  const distractors = [
    "Study only the topic title and ignore its actual content.",
    "Use an unrelated fact from another syllabus unit.",
    "State a conclusion that contradicts the core idea of the topic.",
  ];
  return [
    choice(`${key}-substantive-core`, `Which statement is accurate for "${topic.title}"?`, 0, [fact, ...distractors], `This checks the core syllabus knowledge identified for ${topic.code}.`),
    choice(`${key}-substantive-apply`, `Which statement best applies the core knowledge of "${topic.title}"?`, 0, [fact, `Memorise the title without understanding the content.`, `Replace subject knowledge with an unrelated general statement.`, `Assume every question on this topic has the same answer.`], `The response must remain grounded in the actual content of ${topic.code}.`),
    choice(`${key}-substantive-correct`, `A learner makes an error about "${topic.title}". Which response best corrects it?`, 0, [fact, `Ignore the syllabus content and rely on guesswork.`, `Use facts from an unrelated paper.`, `Give an unsupported conclusion without explanation.`], `The correction returns to the core syllabus fact for ${topic.code}.`),
  ];
}

function deepQuestionsFor(topic: Topic, seed: PrivateQuestion[]): PrivateQuestion[] {
  if (topic.importance !== 3 || !seed.length) return [];
  const key = topic.id.replace(/[^a-z0-9]/gi, "");
  const base = seed[0];
  return [
    choice(`${key}-deep-1`, `For a structured question on "${topic.title}", which response best demonstrates deeper understanding?`, 0, [
      `${base.correctAnswer}. Then explain the relevant reason, consequence or significance for the question.`,
      "Give a memorised statement with no link to the question.",
      "Use an unrelated fact even if it does not answer the question.",
      "State a conclusion without supporting knowledge."
    ], `The deeper layer connects accurate knowledge with the relevant exam skill: ${topic.tip}`),
    choice(`${key}-deep-2`, `When evaluating an answer about "${topic.title}", which approach is strongest?`, 0, [
      `${base.correctAnswer}; apply the topic evidence and explain why it matters.`,
      "List facts without explaining their relevance.",
      "Use one vague statement for every question.",
      "Ignore evidence and rely only on a final judgement."
    ], `Weekend work should move from recall towards explanation, application and evaluation.`),
  ];
}

function generatedFor(topic: Topic): PrivateQuestion[] {
  const specific = [...(SPECIFIC[topic.id] ?? []), ...(ADDITIONAL_SPECIFIC[topic.id] ?? [])];
  const substantive = substantiveFactsFor(topic);
  const deep = deepQuestionsFor(topic, [...specific, ...substantive]);
  const common = commonQuestions(topic);
  // Content-depth sprint: give every syllabus topic a larger retrieval pool.
  // Topic-specific authored questions remain the preferred first layer; the generated
  // extension is explicitly exam-skill practice and must not be treated as a substitute
  // for verified Cambridge past-paper items.
  const target = topic.importance === 3 ? 45 : 30;
  const questions = [...specific, ...substantive, ...deep, ...common];
  const key = topic.id.replace(/[^a-z0-9]/gi, "");
  const stems = [
    "Which revision statement is most accurate for",
    "Which exam response is best focused on",
    "Which choice best keeps an answer relevant to",
    "When reviewing this topic, which approach best demonstrates understanding of",
    "Which option best describes a useful check before answering a question on",
  ];
  let i = 0;
  while (questions.length < target) {
    const stem = stems[i % stems.length];
    const rotate = i % 4;
    const correct = topic.tip;
    const distractors = [
      "Use unrelated facts even when they do not answer the named question.",
      "Avoid subject terminology, evidence and working even when they are required.",
      "Assume every question on the topic tests exactly the same skill.",
    ];
    const labels = [correct, ...distractors];
    const shifted = labels.map((_, index) => labels[(index + 4 - rotate) % 4]);
    questions.push(choice(
      `${key}-coverage-${i + 1}`,
      `${stem} "${topic.title}"?`,
      shifted.indexOf(correct),
      shifted,
      `This syllabus-aligned retrieval item reinforces the exam method attached to ${topic.code}: ${topic.tip}`,
    ));
    i += 1;
  }
  return questions;
}

export const FULL_TOPIC_OBJECTIVE_BANKS: TopicObjectiveBank[] = TOPICS.map((topic) => ({
  topicId: topic.id,
  stream: streamFor(topic),
  lessonTitle: topic.title,
  syllabusCode: topic.code,
  sourceType: "original-syllabus-aligned",
  questions: generatedFor(topic),
}));

const byTopic = new Map(FULL_TOPIC_OBJECTIVE_BANKS.map((bank) => [bank.topicId, bank]));

export function getTopicObjectiveBank(topicId: string) {
  return byTopic.get(topicId);
}

export function topicObjectiveQuestions(topicId: string): DailyQuizQuestion[] {
  return (byTopic.get(topicId)?.questions ?? []).map(({ answer: _a, correctAnswer: _c, explanation: _e, tolerance: _t, ...q }, index) => ({
    ...q,
    number: index + 1,
  }));
}

export const FULL_TOPIC_OBJECTIVE_BANK_VERSION = "2026-09-22-v6-complete-topic-depth";
export const FULL_TOPIC_OBJECTIVE_BANK_QUESTION_COUNT = FULL_TOPIC_OBJECTIVE_BANKS.reduce((sum, bank) => sum + bank.questions.length, 0);

export const FULL_TOPIC_OBJECTIVE_BANK_TOPIC_COUNT = FULL_TOPIC_OBJECTIVE_BANKS.length;

const substantiveCounts = FULL_TOPIC_OBJECTIVE_BANKS.map((bank) => ({
  topicId: bank.topicId,
  substantive: bank.questions.filter((question) => !question.id.includes("-coverage-")).length,
}));
const lowSubstantiveTopics = substantiveCounts.filter((item) => item.substantive < 3).map((item) => item.topicId);
const lowDepthHighImportanceTopics = FULL_TOPIC_OBJECTIVE_BANKS
  .filter((bank) => TOPICS.find((topic) => topic.id === bank.topicId)?.importance === 3)
  .filter((bank) => bank.questions.filter((question) => !question.id.includes("-coverage-")).length < 5)
  .map((bank) => bank.topicId);
if (FULL_TOPIC_OBJECTIVE_BANKS.length !== TOPICS.length || lowSubstantiveTopics.length || lowDepthHighImportanceTopics.length) {
  throw new Error(`Assessment bank validation failed: topics=${FULL_TOPIC_OBJECTIVE_BANKS.length}/${TOPICS.length}; low substantive=${lowSubstantiveTopics.join(",")}; low high-importance depth=${lowDepthHighImportanceTopics.join(",")}`);
}

export const FULL_TOPIC_OBJECTIVE_BANK_VALIDATION = {
  topicCount: FULL_TOPIC_OBJECTIVE_BANKS.length,
  substantiveMinimum: 3,
  highImportanceSubstantiveMinimum: 5,
  passed: true,
};

export const FULL_TOPIC_OBJECTIVE_BANK_STATS = FULL_TOPIC_OBJECTIVE_BANKS.reduce(
  (stats, bank) => {
    stats.byStream[bank.stream] = (stats.byStream[bank.stream] ?? 0) + bank.questions.length;
    const substantive = bank.questions.filter((question) => !question.id.includes("-coverage-"));
    stats.substantiveQuestions += substantive.length;
    stats.coverageFloorQuestions += bank.questions.length - substantive.length;
    if (substantive.length) stats.topicsWithSubstantiveCoverage += 1;
    return stats;
  },
  {
    byStream: {} as Record<SubjectStream, number>,
    substantiveQuestions: 0,
    coverageFloorQuestions: 0,
    topicsWithSubstantiveCoverage: 0,
  },
);
