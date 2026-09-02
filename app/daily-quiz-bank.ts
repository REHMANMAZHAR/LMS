import type { DailyQuizQuestion } from "./daily-quiz-model";

type PrivateQuestion = Omit<DailyQuizQuestion, "number"> & {
  answer: string;
  correctAnswer: string;
  explanation: string;
};

export type DailyQuiz = {
  taskId: string;
  stream: "Mathematics" | "Chemistry" | "Islamiyat" | "Pakistan History" | "Pakistan Geography";
  topicId: string;
  lessonTitle: string;
  questions: PrivateQuestion[];
};

const choice = (id: string, prompt: string, answer: string, correctAnswer: string, explanation: string, options: string[]): PrivateQuestion => ({
  id, prompt, type: "choice", answer, correctAnswer, explanation,
  options: options.map((label, index) => ({ id: String.fromCharCode(97 + index), label })),
});
const numeric = (id: string, prompt: string, answer: string, explanation: string, answerSuffix?: string): PrivateQuestion => ({
  id, prompt, type: "numeric", answer, correctAnswer: `${answer}${answerSuffix ? ` ${answerSuffix}` : ""}`, explanation, placeholder: "Enter a number", answerSuffix,
});
const quiz = (stream: DailyQuiz["stream"], day: number, topicId: string, lessonTitle: string, questions: PrivateQuestion[]): DailyQuiz => ({ taskId: `guided:${stream}:${day}`, stream, topicId, lessonTitle, questions });

export const DAILY_QUIZZES: DailyQuiz[] = [
  quiz("Mathematics", 1, "math-e1-1", "Integers, prime numbers, factors, LCM and HCF", [
    choice("m1a", "Which number is prime?", "b", "29", "A prime number has exactly two positive factors.", ["21", "29", "39", "51"]),
    numeric("m1b", "Find the HCF of 24 and 36.", "12", "The common factors have greatest value 12."),
    numeric("m1c", "Find the LCM of 12 and 18.", "36", "Using prime factors, take the greatest power of every prime: 2² × 3² = 36."),
  ]),
  quiz("Mathematics", 2, "math-e1-4", "Fractions, decimals and recurring decimals", [
    choice("m2a", "Write 0.375 as a fraction in simplest form.", "c", "3/8", "0.375 = 375/1000 = 3/8.", ["3/5", "3/4", "3/8", "5/8"]),
    choice("m2b", "Which decimal is equivalent to 7/20?", "b", "0.35", "7/20 = 35/100.", ["0.28", "0.35", "0.7", "3.5"]),
    choice("m2c", "Calculate 2/3 + 1/4.", "d", "11/12", "Use denominator 12: 8/12 + 3/12 = 11/12.", ["3/7", "5/7", "3/12", "11/12"]),
  ]),
  quiz("Mathematics", 3, "math-e1-3", "Prime factorisation, square roots and cube roots", [
    choice("m3a", "Which is the prime factorisation of 72?", "b", "2³ × 3²", "72 = 8 × 9 = 2³ × 3².", ["2² × 3²", "2³ × 3²", "2³ × 3³", "6 × 12"]),
    numeric("m3b", "Find √144.", "12", "12 × 12 = 144."),
    numeric("m3c", "Find ∛216.", "6", "6 × 6 × 6 = 216."),
  ]),
  quiz("Mathematics", 4, "math-e1-6", "BODMAS and directed-number arithmetic", [
    numeric("m4a", "Calculate 7 + 3 × 4.", "19", "Multiplication comes before addition: 7 + 12 = 19."),
    numeric("m4b", "Calculate −6 + 14 − 9.", "-1", "−6 + 14 = 8, then 8 − 9 = −1."),
    numeric("m4c", "Calculate 20 ÷ (2 + 3) × 4.", "16", "Work inside brackets first, then division and multiplication left to right."),
  ]),
  quiz("Mathematics", 5, "math-e1-8", "Standard form conversions and calculations", [
    choice("m5a", "Write 0.000072 in standard form.", "c", "7.2 × 10⁻⁵", "Move the decimal five places right, so the power is −5.", ["7.2 × 10⁻⁴", "72 × 10⁻⁶", "7.2 × 10⁻⁵", "0.72 × 10⁻⁴"]),
    choice("m5b", "Write 5.43 × 10⁶ as an ordinary number.", "b", "5,430,000", "A positive power of 6 moves the decimal six places right.", ["543,000", "5,430,000", "54,300,000", "0.00000543"]),
    choice("m5c", "Calculate (3 × 10⁴)(2 × 10³) in standard form.", "d", "6 × 10⁷", "Multiply 3 × 2 and add the powers: 10⁴ × 10³ = 10⁷.", ["5 × 10⁷", "6 × 10¹²", "6 × 10⁶", "6 × 10⁷"]),
  ]),
  quiz("Mathematics", 6, "math-e1-9", "Estimation, significant figures and decimal places", [
    choice("m6a", "Round 0.006784 to 2 significant figures.", "b", "0.0068", "The first two significant digits are 6 and 7; the next digit rounds 7 up.", ["0.0067", "0.0068", "0.007", "0.00678"]),
    numeric("m6b", "Round 38.476 to 1 decimal place.", "38.5", "The hundredths digit is 7, so 38.4 rounds up to 38.5."),
    numeric("m6c", "Estimate 19.8 × 3.12 by rounding each number to 1 significant figure.", "60", "19.8 ≈ 20 and 3.12 ≈ 3, so the estimate is 60."),
  ]),
  quiz("Mathematics", 7, "math-e1-11", "Ratio, scale and direct proportion", [
    choice("m7a", "Simplify 18:30.", "c", "3:5", "Divide both terms by their HCF, 6.", ["6:10", "9:15", "3:5", "5:3"]),
    numeric("m7b", "Share 48 in the ratio 1:3. What is the larger share?", "36", "There are 4 parts; each is 12, so the larger share is 3 × 12."),
    numeric("m7c", "Five books cost 20 dollars at a constant rate. What do eight books cost?", "32", "Each book costs 4 dollars, so eight cost 32.", "dollars"),
  ]),

  quiz("Chemistry", 1, "chem-1-1", "Particle arrangement in solids, liquids and gases", [
    choice("c1a", "Which best describes particles in a solid?", "a", "Closely packed in fixed positions, vibrating", "Solid particles vibrate about fixed positions.", ["Closely packed in fixed positions, vibrating", "Far apart and stationary", "Close together and moving past each other", "Far apart and moving slowly only"]),
    choice("c1b", "Why can a gas be compressed easily?", "c", "There are large gaps between its particles", "Compression reduces the large empty spaces between gas particles.", ["Its particles shrink", "Its particles have no mass", "There are large gaps between its particles", "Its forces are strongest"]),
    choice("c1c", "Which change occurs when a liquid freezes?", "b", "Particles become fixed in a regular arrangement", "The particles lose energy and become fixed, although they still vibrate.", ["Particles disappear", "Particles become fixed in a regular arrangement", "Particles become much larger", "Particles stop all movement"]),
  ]),
  quiz("Chemistry", 2, "chem-1-2", "Temperature, pressure, gas volume and diffusion", [
    choice("c2a", "Why does diffusion become faster when temperature rises?", "d", "Particles gain kinetic energy and move faster", "Higher temperature increases average particle kinetic energy.", ["Particles become heavier", "The concentration gradient disappears", "Particles attract more strongly", "Particles gain kinetic energy and move faster"]),
    choice("c2b", "Diffusion is movement of particles from…", "a", "higher concentration to lower concentration", "Net movement continues down the concentration gradient.", ["higher concentration to lower concentration", "lower concentration to higher concentration", "low pressure to high pressure only", "liquid to solid only"]),
    choice("c2c", "At constant temperature, compressing a gas into half the volume usually makes its pressure…", "c", "increase", "Particles collide with the container walls more frequently.", ["zero", "decrease", "increase", "unchanged"]),
  ]),
  quiz("Chemistry", 3, "chem-2-1", "Elements, compounds and mixtures", [
    choice("c3a", "Which statement describes a compound?", "b", "Different elements chemically bonded in a fixed ratio", "A compound has chemically bonded elements in fixed proportions.", ["One type of atom mixed physically", "Different elements chemically bonded in a fixed ratio", "Any substances stirred together", "A substance separated only by filtration"]),
    choice("c3b", "Which can normally be separated by physical methods?", "c", "A mixture", "Mixture components are not chemically bonded.", ["An element", "A compound", "A mixture", "An atom"]),
    choice("c3c", "Air is best classified as…", "d", "a mixture of gases", "Its gases are physically mixed and their proportions can vary.", ["an element", "a single compound", "a pure substance", "a mixture of gases"]),
  ]),
  quiz("Chemistry", 4, "chem-2-2", "Atomic structure: protons, neutrons and electrons", [
    choice("c4a", "Which particle has charge −1 and very small relative mass?", "c", "electron", "Electrons are negatively charged and have negligible relative mass.", ["proton", "neutron", "electron", "nucleus"]),
    choice("c4b", "Where are protons and neutrons found?", "a", "In the nucleus", "Nearly all atomic mass is concentrated in the nucleus.", ["In the nucleus", "In electron shells", "Outside the atom", "Only in ions"]),
    choice("c4c", "Why is an atom electrically neutral?", "d", "It has equal numbers of protons and electrons", "Equal positive and negative charges cancel.", ["It contains no charged particles", "Neutrons cancel protons", "Electrons have no charge", "It has equal numbers of protons and electrons"]),
  ]),
  quiz("Chemistry", 5, "chem-2-2", "Proton number, nucleon number and electron structures", [
    numeric("c5a", "An atom has nucleon number 23 and proton number 11. How many neutrons?", "12", "Neutrons = nucleon number − proton number."),
    numeric("c5b", "A neutral magnesium atom has proton number 12. How many electrons?", "12", "A neutral atom has equal protons and electrons."),
    choice("c5c", "What is the electron arrangement of sodium, proton number 11?", "b", "2,8,1", "Fill the first shell with 2, the second with 8, leaving 1.", ["2,9", "2,8,1", "2,7,2", "8,3"]),
  ]),
  quiz("Chemistry", 6, "chem-2-3", "Isotopes and relative atomic mass", [
    choice("c6a", "Isotopes of the same element have…", "a", "the same protons but different neutrons", "Proton number defines the element; neutron number may vary.", ["the same protons but different neutrons", "different protons but the same neutrons", "different electrons only", "different chemical symbols"]),
    numeric("c6b", "An isotope has nucleon number 37 and proton number 17. How many neutrons?", "20", "37 − 17 = 20."),
    numeric("c6c", "An element is 75% isotope-35 and 25% isotope-37. Find its relative atomic mass.", "35.5", "(0.75 × 35) + (0.25 × 37) = 35.5."),
  ]),
  quiz("Chemistry", 7, "chem-2-4", "Ionic bonding and sodium chloride dot-and-cross diagrams", [
    choice("c7a", "What happens when sodium forms Na⁺?", "b", "It loses one electron", "Losing one negative electron leaves a +1 charge.", ["It gains one proton", "It loses one electron", "It gains one electron", "It loses one neutron"]),
    choice("c7b", "What holds oppositely charged ions together?", "d", "Strong electrostatic attraction", "Ionic bonding is electrostatic attraction between oppositely charged ions.", ["Shared protons", "Weak gravity", "Magnetic force", "Strong electrostatic attraction"]),
    choice("c7c", "Which ion does chlorine form in sodium chloride?", "c", "Cl⁻", "Chlorine gains one electron to complete its outer shell.", ["Cl⁺", "Cl²⁺", "Cl⁻", "Cl²⁻"]),
  ]),

  quiz("Islamiyat", 1, "isl-quran-7", "Surah al-Baqarah 2:21–22: theme and application", [
    choice("i1a", "What central response does the passage require from people?", "b", "Worship the Lord who created them", "Creation and provision are given as reasons to worship God alone.", ["Worship created things", "Worship the Lord who created them", "Avoid all worldly work", "Seek provision from idols"]),
    choice("i1b", "Which blessing is explicitly connected with provision in this passage?", "d", "Rain producing fruits", "The passage connects rain, crops and provision with God's sustaining power.", ["Military victory", "Trade caravans", "Precious metals", "Rain producing fruits"]),
    choice("i1c", "A sound present-day application is to…", "a", "show gratitude and avoid associating partners with God", "Tawhid requires worship and gratitude directed to God alone.", ["show gratitude and avoid associating partners with God", "treat nature as divine", "ignore material blessings", "pray only when in difficulty"]),
  ]),
  quiz("Islamiyat", 2, "isl-quran-1", "Surah al-Baqarah 2:255 (Ayat al-Kursi)", [
    choice("i2a", "Which attribute is emphasised by 'neither drowsiness nor sleep overtakes Him'?", "c", "God's perfect, tireless life", "Unlike creation, God never becomes tired or inattentive.", ["Human free will", "The role of angels", "God's perfect, tireless life", "The need for trade"]),
    choice("i2b", "According to the passage, intercession occurs…", "b", "only with God's permission", "The verse places all authority, including permission to intercede, with God.", ["whenever anyone chooses", "only with God's permission", "only at night", "without God's knowledge"]),
    choice("i2c", "Which theme best unites the verse?", "d", "God's oneness, sovereignty, knowledge and power", "The attributes all establish God's unique authority and majesty.", ["Rules of inheritance", "The life of prophets", "Community leadership", "God's oneness, sovereignty, knowledge and power"]),
  ]),
  quiz("Islamiyat", 3, "isl-quran-2", "Surah al-An‘am 6:101–103: theme and application", [
    choice("i3a", "The title 'Originator of the heavens and earth' chiefly teaches that God…", "a", "creates without a prior model", "The passage presents God as the unique source of creation.", ["creates without a prior model", "depends on creation", "has human limitations", "can be represented by images"]),
    choice("i3b", "What does the passage teach about human sight?", "c", "Vision cannot encompass God, but God encompasses all vision", "Human perception is limited; God's knowledge is not.", ["Everyone can see God now", "Sight is unimportant", "Vision cannot encompass God, but God encompasses all vision", "Only prophets possess sight"]),
    choice("i3c", "Which belief follows directly from the passage?", "b", "God has no offspring or equal", "The passage rejects attributing offspring and partners to God.", ["Creation shares divine power", "God has no offspring or equal", "God needs helpers", "Only visible things are real"]),
  ]),
  quiz("Islamiyat", 4, "isl-p1-3a", "The first revelation at Cave Hira", [
    choice("i4a", "Who brought the first revelation to the Prophet?", "d", "Angel Jibril", "Jibril delivered the command to read/recite.", ["Abu Bakr", "Waraqa", "Umar", "Angel Jibril"]),
    choice("i4b", "Who first comforted and reassured the Prophet after the event?", "a", "Khadija", "Khadija supported him and took him to Waraqa ibn Nawfal.", ["Khadija", "Abu Talib", "Bilal", "Hamza"]),
    choice("i4c", "Why is the event historically decisive?", "c", "It began revelation and Muhammad's prophethood", "The first verses marked the beginning of the Qur'anic revelation and prophetic mission.", ["It ended the migration", "It established the first mosque", "It began revelation and Muhammad's prophethood", "It immediately converted all Makkah"]),
  ]),
  quiz("Islamiyat", 5, "isl-quran-3", "Surah Fussilat 41:37: signs, worship and application", [
    choice("i5a", "How does the passage describe the sun and moon?", "b", "As signs of God", "Created signs point beyond themselves to their Creator.", ["As gods", "As signs of God", "As angels", "As objects without purpose"]),
    choice("i5b", "What worship is prohibited in the passage?", "d", "Prostrating to the sun or moon", "The verse redirects prostration from created signs to God.", ["Daily prayer", "Gratitude", "Reciting scripture", "Prostrating to the sun or moon"]),
    choice("i5c", "The positive command is to prostrate to…", "a", "God who created the signs", "Only the Creator is worthy of worship.", ["God who created the signs", "the brightest star", "religious leaders", "any part of nature"]),
  ]),
  quiz("Islamiyat", 6, "isl-p1-3a", "Pre-Islamic Arabia: social, economic and religious setting", [
    choice("i6a", "Which religious condition was widespread in Makkah before Islam?", "c", "Idol worship", "Many tribes kept idols in and around the Ka'ba.", ["Universal monotheism", "No religious practice", "Idol worship", "Buddhist rule"]),
    choice("i6b", "Which economic activity made Makkah important?", "b", "Caravan trade", "Its location and sanctuary supported regional trade.", ["Ocean fishing", "Caravan trade", "Coal mining", "Rice farming"]),
    choice("i6c", "Which social problem helps explain Islam's reforming message?", "d", "Tribal conflict and unequal treatment of vulnerable people", "Islam challenged injustice while redirecting loyalty toward moral and religious community.", ["Absence of tribes", "Complete equality", "No poverty", "Tribal conflict and unequal treatment of vulnerable people"]),
  ]),
  quiz("Islamiyat", 7, "isl-quran-4", "Surah al-Shura 42:4–5: divine majesty and mercy", [
    choice("i7a", "What belongs to God according to the passage?", "a", "Whatever is in the heavens and earth", "Ownership of all creation expresses divine sovereignty.", ["Whatever is in the heavens and earth", "Only sacred buildings", "Only angels", "Only the unseen world"]),
    choice("i7b", "What do the angels do in the passage?", "c", "Praise God and seek forgiveness for people on earth", "Their worship and prayer display both majesty and mercy.", ["Rule independently", "Create the heavens", "Praise God and seek forgiveness for people on earth", "Receive worship"]),
    choice("i7c", "Which pair of qualities closes the passage's teaching?", "b", "Forgiving and merciful", "Despite divine greatness, the passage stresses forgiveness and mercy.", ["Tired and distant", "Forgiving and merciful", "Visible and limited", "Needing assistance"]),
  ]),

  quiz("Pakistan History", 1, "pak-kq1", "Shah Waliullah: religious reforms and historical impact", [
    choice("h1a", "Why did Shah Waliullah translate the Qur'an into Persian?", "b", "To make its teachings accessible to more Muslims", "Persian was widely understood by educated Muslims in the region.", ["To replace Arabic prayer", "To make its teachings accessible to more Muslims", "To support British rule", "To create a new scripture"]),
    choice("h1b", "Which ruler did he invite to oppose Maratha power?", "d", "Ahmad Shah Abdali", "He appealed to Abdali as part of an effort to protect Muslim political power.", ["Ranjit Singh", "Lord Clive", "Nadir Shah", "Ahmad Shah Abdali"]),
    choice("h1c", "His long-term importance is best explained by…", "a", "religious revival and influence on later reformers", "His teaching encouraged renewal, unity and later reform movements.", ["religious revival and influence on later reformers", "ending all British rule himself", "founding the Muslim League", "winning the Battle of Plassey"]),
  ]),
  quiz("Pakistan History", 2, "pak-kq1", "Syed Ahmad Shaheed Barelvi and Islamic revival", [
    choice("h2a", "What was a central aim of Syed Ahmad's movement?", "c", "Revive Islamic practice and resist non-Muslim rule", "The movement combined reform with armed struggle in the north-west.", ["Promote Company trade", "Restore Mughal luxury", "Revive Islamic practice and resist non-Muslim rule", "Abolish religious teaching"]),
    choice("h2b", "Where was Syed Ahmad killed in 1831?", "a", "Balakot", "The defeat at Balakot ended his life but not the movement's influence.", ["Balakot", "Plassey", "Delhi", "Dhaka"]),
    choice("h2c", "Why did the movement face local opposition in the north-west?", "d", "Some reforms and taxes conflicted with local customs and interests", "Local resistance weakened his political base.", ["It supported Sikh taxation", "It had no religious programme", "It was led by the East India Company", "Some reforms and taxes conflicted with local customs and interests"]),
  ]),
  quiz("Pakistan History", 3, "pak-kq1", "Haji Shariatullah and the Faraizi Movement", [
    choice("h3a", "The word Faraizi refers to…", "b", "obligatory duties of Islam", "The movement stressed performance of the faraiz.", ["British laws", "obligatory duties of Islam", "military ranks", "land taxes"]),
    choice("h3b", "In which region did the movement grow?", "c", "Bengal", "It responded to religious and social conditions among Bengali Muslims.", ["Punjab", "Sindh", "Bengal", "Kashmir"]),
    choice("h3c", "Who continued and developed the movement after Haji Shariatullah?", "a", "Dudu Mian", "His son Dudu Mian organised followers and opposed exploitation.", ["Dudu Mian", "Mir Jafar", "Syed Amir Ali", "Lord Dalhousie"]),
  ]),
  quiz("Pakistan History", 4, "pak-kq2", "Internal causes of Mughal decline", [
    choice("h4a", "Which internal problem repeatedly weakened Mughal government after Aurangzeb?", "d", "Succession disputes and weak rulers", "Civil conflict and short, weak reigns damaged stability.", ["Too few territories", "A strong treasury", "Complete court unity", "Succession disputes and weak rulers"]),
    choice("h4b", "Why did the empire's size become a weakness?", "b", "Communication and control over distant provinces were difficult", "Slow communication enabled governors and rivals to act independently.", ["It prevented farming", "Communication and control over distant provinces were difficult", "It removed all borders", "It stopped taxation entirely"]),
    choice("h4c", "How did prolonged warfare contribute to decline?", "a", "It drained money and military resources", "Expensive campaigns weakened the treasury and administration.", ["It drained money and military resources", "It guaranteed peaceful succession", "It increased central control everywhere", "It eliminated court rivalry"]),
  ]),
  quiz("Pakistan History", 5, "pak-kq2", "Nadir Shah and Ahmad Shah Abdali: external attacks", [
    choice("h5a", "Who invaded and sacked Delhi in 1739?", "c", "Nadir Shah", "The invasion removed wealth and exposed Mughal weakness.", ["Ahmad Shah Abdali", "Robert Clive", "Nadir Shah", "Ranjit Singh"]),
    choice("h5b", "What was a major effect of these invasions?", "a", "Loss of wealth, prestige and control", "Repeated attacks weakened finance and confidence in Mughal authority.", ["Loss of wealth, prestige and control", "A stronger central army", "Permanent peace", "The end of provincial independence"]),
    choice("h5c", "Ahmad Shah Abdali's repeated invasions especially increased…", "d", "political instability in northern India", "Repeated incursions disrupted already weak Mughal control.", ["Mughal tax efficiency", "industrial production", "British withdrawal", "political instability in northern India"]),
  ]),
  quiz("Pakistan History", 6, "pak-kq2", "East India Company: from trade to political power", [
    choice("h6a", "What was the Company's original main purpose in India?", "b", "Trade", "It began as a commercial company with factories and trading posts.", ["Religious government", "Trade", "Mughal restoration", "Universal education"]),
    choice("h6b", "Which development most helped it gain political power?", "d", "Private armies, alliances and intervention in local conflicts", "Military and diplomatic leverage converted commercial influence into rule.", ["Giving up fortified posts", "Ending all trade", "Refusing Indian allies", "Private armies, alliances and intervention in local conflicts"]),
    choice("h6c", "Why did weakening Mughal authority matter to the Company?", "a", "It created openings for regional influence and territorial control", "A fragmented political system was easier for the Company to manipulate.", ["It created openings for regional influence and territorial control", "It forced the Company to leave", "It made every province united", "It removed local rivalries"]),
  ]),
  quiz("Pakistan History", 7, "pak-kq2", "Battle of Plassey 1757: causes and significance", [
    choice("h7a", "Who commanded the Company's forces at Plassey?", "c", "Robert Clive", "Clive led the Company against Siraj-ud-Daulah.", ["Mir Jafar", "Ahmad Shah Abdali", "Robert Clive", "Dudu Mian"]),
    choice("h7b", "Whose betrayal seriously weakened Siraj-ud-Daulah?", "a", "Mir Jafar", "The conspiracy kept a major part of the Nawab's army from fighting effectively.", ["Mir Jafar", "Shah Waliullah", "Tipu Sultan", "Bahadur Shah Zafar"]),
    choice("h7c", "Why was the victory important?", "d", "It gave the Company decisive influence and access to Bengal's wealth", "Bengal's resources financed further expansion.", ["It immediately ended all Mughal rule", "It expelled the British", "It created Pakistan", "It gave the Company decisive influence and access to Bengal's wealth"]),
  ]),

  quiz("Pakistan Geography", 1, "pak-p2-1", "Pakistan’s location, coordinates, neighbours and borders", [
    choice("g1a", "Which sea lies south of Pakistan?", "b", "Arabian Sea", "Pakistan's coastline opens onto the Arabian Sea.", ["Red Sea", "Arabian Sea", "Caspian Sea", "Mediterranean Sea"]),
    choice("g1b", "Which country borders Pakistan to the north-east?", "d", "China", "The China-Pakistan border lies in the high mountain north-east.", ["Iran", "Afghanistan", "Oman", "China"]),
    choice("g1c", "Why is Pakistan's position strategically important?", "a", "It links South Asia with Central and Western Asia and has sea access", "Its land position and Arabian Sea ports create regional connections.", ["It links South Asia with Central and Western Asia and has sea access", "It is an island", "It has no international borders", "It lies entirely north of the Himalayas"]),
  ]),
  quiz("Pakistan Geography", 2, "pak-p2-1", "Northern Highlands: relief and sub-regions", [
    choice("g2a", "Which three major ranges meet in northern Pakistan?", "c", "Himalaya, Karakoram and Hindu Kush", "These ranges form the principal northern highland systems.", ["Kirthar, Alps and Andes", "Sulaiman, Atlas and Urals", "Himalaya, Karakoram and Hindu Kush", "Salt Range, Rockies and Alps"]),
    choice("g2b", "K2 is located in the…", "a", "Karakoram Range", "K2 is the highest peak of the Karakoram.", ["Karakoram Range", "Kirthar Range", "Salt Range", "Sulaiman Range"]),
    choice("g2c", "Which physical feature is common in the highest northern areas?", "d", "Glaciers and steep valleys", "High altitude and rugged relief support extensive glaciation.", ["Wide delta distributaries", "Mangrove swamps", "Flat desert plains only", "Glaciers and steep valleys"]),
  ]),
  quiz("Pakistan Geography", 3, "pak-p2-1", "Western Highlands", [
    choice("g3a", "Which range is part of the Western Highlands?", "b", "Sulaiman Range", "The Sulaiman, Kirthar and Safed Koh ranges are western highland features.", ["Karakoram", "Sulaiman Range", "Himalaya", "Salt Range only"]),
    choice("g3b", "Why is settlement often sparse in the Western Highlands?", "d", "Rugged, dry terrain limits water, farming and access", "Relief and aridity restrict economic activity and communications.", ["Frequent delta flooding", "Dense tropical forest", "Very fertile flat land", "Rugged, dry terrain limits water, farming and access"]),
    choice("g3c", "Which pass is an important route through the north-western mountains?", "a", "Khyber Pass", "The Khyber Pass has long linked the Peshawar region with Afghanistan.", ["Khyber Pass", "Bolan Delta", "Potwar Glacier", "Indus Estuary"]),
  ]),
  quiz("Pakistan Geography", 4, "pak-p2-1", "Balochistan and Potwar Plateaux", [
    choice("g4a", "Which plateau is closely related to the Salt Range?", "c", "Potwar Plateau", "The Potwar Plateau lies north of the Salt Range.", ["Balochistan Plateau", "Deccan Plateau", "Potwar Plateau", "Tibetan Plateau"]),
    choice("g4b", "A major characteristic of the Balochistan Plateau is…", "a", "arid basins separated by mountain ranges", "Its rugged relief and enclosed basins occur in a dry climate.", ["arid basins separated by mountain ranges", "a wet delta", "continuous low floodplain", "dense equatorial forest"]),
    choice("g4c", "The Potwar Plateau's dissected relief is strongly associated with…", "d", "erosion by streams and seasonal drainage", "Running water has cut gullies and valleys into the plateau surface.", ["glacial deposition at sea level", "coral reef growth", "volcanic lava", "erosion by streams and seasonal drainage"]),
  ]),
  quiz("Pakistan Geography", 5, "pak-p2-1", "Salt Range and Upper Indus Plain", [
    choice("g5a", "A doab is land located…", "b", "between two rivers", "The term describes an interfluve between two rivers.", ["inside a desert dune", "between two rivers", "above a glacier", "along the sea coast only"]),
    choice("g5b", "What distinguishes an active floodplain?", "c", "It is regularly reached by present-day floods and fresh alluvium", "Active floodplains lie close to rivers and receive recent deposits.", ["It is never flooded", "It is made only of rock", "It is regularly reached by present-day floods and fresh alluvium", "It lies above every river terrace"]),
    choice("g5c", "The Upper Indus Plain is mainly formed from…", "a", "alluvium deposited by the Indus river system", "River deposition created the extensive plain.", ["alluvium deposited by the Indus river system", "recent lava", "wind-blown snow", "coral limestone"]),
  ]),
  quiz("Pakistan Geography", 6, "pak-p2-1", "Lower Indus Plain, delta and coast", [
    choice("g6a", "What forms where the Indus divides into distributaries near the sea?", "d", "A delta", "Deposition at the river mouth builds the Indus delta.", ["A glacier", "A plateau", "A mountain pass", "A delta"]),
    choice("g6b", "Which vegetation is characteristic of parts of the Indus delta?", "b", "Mangroves", "Salt-tolerant mangroves grow in intertidal delta environments.", ["Conifer forest", "Mangroves", "Alpine meadow", "Tea plantation"]),
    choice("g6c", "One major natural risk in the lower plain and delta is…", "a", "river or coastal flooding", "Low relief exposes the area to river floods and coastal hazards.", ["river or coastal flooding", "avalanches", "glacial crevasses", "volcanic eruptions"]),
  ]),
  quiz("Pakistan Geography", 7, "pak-p2-1", "Desert regions: Thar, Thal and Cholistan", [
    choice("g7a", "Which desert lies mainly in south-eastern Pakistan?", "c", "Thar", "The Thar extends across south-eastern Sindh and into India.", ["Thal", "Cholistan", "Thar", "Kharan"]),
    choice("g7b", "The Thal Desert is located between the…", "a", "Indus and Jhelum rivers", "Thal occupies part of the Sindh Sagar Doab.", ["Indus and Jhelum rivers", "Ravi and Sutlej only", "coast and delta", "Karakoram and Himalaya"]),
    choice("g7c", "How can irrigation change desert livelihoods?", "d", "It can support crops and more permanent settlement where water is available", "Reliable water permits cultivation but must be managed sustainably.", ["It removes all aridity permanently", "It prevents every soil problem", "It makes dunes into mountains", "It can support crops and more permanent settlement where water is available"]),
  ]),
];

const byTaskId = new Map(DAILY_QUIZZES.map((item) => [item.taskId, item]));
export const DAILY_QUIZ_VERSION = "daily-check-v1";
export const DAILY_QUIZ_DURATION_SECONDS = 10 * 60;
export function hasDailyQuiz(taskId: string) { return byTaskId.has(taskId); }
export function getDailyQuiz(taskId: string) { return byTaskId.get(taskId); }
export function publicDailyQuestion(question: PrivateQuestion, number: number): DailyQuizQuestion {
  const { answer: _answer, correctAnswer: _correctAnswer, explanation: _explanation, ...visible } = question;
  return { ...visible, number };
}
function normaliseNumeric(value: string) { return value.trim().replace(/,/g, "").replace(/−/g, "-"); }
export function markDailyQuestion(question: PrivateQuestion, response: string | undefined) {
  const value = String(response ?? "");
  const correct = question.type === "numeric"
    ? normaliseNumeric(value) === normaliseNumeric(question.answer)
    : value === question.answer;
  return { questionId: question.id, prompt: question.prompt, response: value, correct, correctAnswer: question.correctAnswer, explanation: question.explanation };
}

