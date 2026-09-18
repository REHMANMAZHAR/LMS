import type { DailyQuizQuestion } from "./daily-quiz-model";
import { TOPICS, type Topic } from "./data";
import type { PrivateQuestion } from "./daily-quiz-bank";

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

function choice(id: string, prompt: string, correctIndex: number, labels: string[], explanation: string): PrivateQuestion {
  return {
    id,
    prompt,
    type: "choice",
    answer: optionIds[correctIndex],
    correctAnswer: labels[correctIndex],
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
};

function generatedFor(topic: Topic): PrivateQuestion[] {
  const specific = SPECIFIC[topic.id] ?? [];
  const common = commonQuestions(topic);
  return [...specific, ...common];
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

export const FULL_TOPIC_OBJECTIVE_BANK_VERSION = "2026-09-18-v1";
export const FULL_TOPIC_OBJECTIVE_BANK_QUESTION_COUNT = FULL_TOPIC_OBJECTIVE_BANKS.reduce((sum, bank) => sum + bank.questions.length, 0);
