// Question references, not republished paper text. Checked against matching PDFs 2026-09-16.
export type PaperReference = { id:string; topicId:string; label:string; reference:string; marks:number; minutes:number; paperUrl:string; schemeUrl:string; kind:"Past paper"|"Specimen"; host:string };
const mirror="https://pastpapers.papacambridge.com/directories/CAIE/CAIE-pastpapers/upload/";
const mathPaper="https://www.cambridgeinternational.org/Images/663664-2025-specimen-paper-2.pdf";
const mathScheme="https://www.cambridgeinternational.org/Images/663672-2025-specimen-paper-2-mark-scheme.pdf";
const entries:PaperReference[]=[];
function add(subject:string,paper:string,scheme:string,rows:Array<[string,string,string,number,number]>,kind:PaperReference["kind"]="Past paper") {
  for(const [topicId,reference,label,marks,minutes] of rows)entries.push({id:`${subject}:${reference}`,topicId,label,reference:`${subject} · ${reference}`,marks,minutes,paperUrl:paper,schemeUrl:scheme,kind,host:kind==="Specimen"?"Cambridge International":"Cambridge paper hosted by PapaCambridge"});
}
add("0580/02 specimen from 2025",mathPaper,mathScheme,[
 ["math-e1-9","Q2","Significant figures",1,2], ["math-e1-8","Q12(a–b)","Standard form",4,5],
 ["math-e2-7","Q9(a–b)","Sequences",3,4], ["math-e2-13","Q18(a–d)","Functions",9,11],
 ["math-e1-18","Q19(a–b)","Surds",4,5], ["math-e2-3","Q23","Algebraic fractions",3,4],
],"Specimen");
add("0620/22 May/June 2024",mirror+"0620_s24_qp_22.pdf",mirror+"0620_s24_ms_22.pdf",[
 ["chem-1-2","Q1","Diffusion",1,2], ["chem-2-2","Q2","Periodic groups and shells",1,2],
 ["chem-2-3","Q3","Isotopes",1,2], ["chem-2-5","Q4","Covalent bonding",1,2],
]);
add("0448/01 May/June 2024",mirror+"0448_s24_qp_01.pdf",mirror+"0448_s24_ms_1.pdf",[
 ["pak-kq2","Q2(c)","Mughal decline",14,17], ["pak-kq3","Q1(d)","Causes of the 1857 uprising",10,12],
 ["pak-kq4","Q2(a)","Sir Syed's publication",4,5], ["pak-kq6","Q3(b)","Simla Deputation",7,9],
 ["pak-kq8","Q3(c)","Congress Rule",14,17], ["pak-kq13","Q4(b)","East Pakistan",7,9],
]);
add("0493/12 May/June 2024",mirror+"0493_s24_qp_12.pdf",mirror+"0493_s24_ms_12.pdf",[
 ["isl-p1-2b","Q2(a–b)","Qur'an compilation and its significance",14,25],
]);
add("0448/02 May/June 2024",mirror+"0448_s24_qp_02.pdf",mirror+"0448_s24_ms_2.pdf",[
 ["pak-p2-2","Q1(b)(ii)","Environmental impacts of extraction",3,4],
 ["pak-p2-8","Q4(c)(i–ii)","Migration",5,6],
]);
export const PAST_PAPER_REFERENCES:readonly PaperReference[]=entries;
