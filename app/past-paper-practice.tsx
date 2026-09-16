"use client";
import { useState } from "react";
import { PAST_PAPER_REFERENCES } from "./past-paper-catalogue";
export default function PastPaperPractice({topicIds}:{topicIds:string[]}) {
 const [showSchemes,setShowSchemes]=useState(false);
 const entries=PAST_PAPER_REFERENCES.filter(item=>topicIds.includes(item.topicId));
 return <section className="panel"><span className="eyebrow">TRACEABLE CAMBRIDGE QUESTIONS</span><h3>Past-paper practice</h3>
 <p>Selected question references with matching marking schemes. Specimen material is labelled separately. Time estimates are LMS estimates. These written tasks are marked with the scheme, not by the short quiz engine.</p>
 {!entries.length?<p>No checked question references are mapped to these topics yet. This is a coverage gap, not a completed assessment.</p>:<>
 <p>{entries.length} references · approximately {entries.reduce((sum,item)=>sum+item.minutes,0)} minutes. Check that you have studied the named subtopic before attempting it. This selection is not automatically a complete 20- or 60-minute assessment.</p>
 <ul>{entries.map(item=><li key={item.id}><strong>{item.label}</strong> — {item.reference} · {item.marks} marks · {item.kind}<br/><a href={item.paperUrl} target="_blank" rel="noreferrer">Open question paper</a>{showSchemes&&<> · <a href={item.schemeUrl} target="_blank" rel="noreferrer">Matching marking scheme</a></>}<small> · {item.host}</small></li>)}</ul>
 <button onClick={()=>setShowSchemes(!showSchemes)}>{showSchemes?"Hide marking links":"Finished attempting? Show marking schemes"}</button>
 <p>Record the marked attempt in Weekend Assessments. Opening a paper does not mark the topic complete or secure.</p></>}
 </section>;
}
