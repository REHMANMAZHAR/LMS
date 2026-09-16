"use client";

import { useMemo, useState } from "react";
import { OFFICIAL_PAPER_SETS } from "./past-paper-catalogue";

export default function OfficialPaperLibrary() {
  const [showSchemes, setShowSchemes] = useState(false);
  const grouped = useMemo(
    () => ["Mathematics", "Chemistry", "Pakistan Studies", "Islamiyat"].map((subject) => ({
      subject,
      papers: OFFICIAL_PAPER_SETS.filter((paper) => paper.subject === subject),
    })),
    [],
  );

  return (
    <section className="panel">
      <span className="eyebrow">VERIFIED PAPER LIBRARY</span>
      <h2>Exact Cambridge subjects and matching schemes</h2>
      <p>
        Every entry uses Talha&apos;s exact syllabus code. Attempt the question paper first;
        reveal the matching scheme only after time is called. The LMS stores links and
        references—not copied Cambridge question text.
      </p>
      <div className="daily-check-history-list">
        {grouped.map(({ subject, papers }) => (
          <article key={subject}>
            <div>
              <strong>{subject}</strong>
              <small>{papers[0]?.syllabusCode}</small>
            </div>
            <ul>
              {papers.map((paper) => (
                <li key={paper.id}>
                  <strong>{paper.session} · {paper.component}</strong>
                  <br />
                  {paper.durationMinutes} min · {paper.maxMarks} marks · {paper.use}
                  <br />
                  <a href={paper.paperUrl} target="_blank" rel="noreferrer">Open question paper</a>
                  {showSchemes && (
                    <> · <a href={paper.schemeUrl} target="_blank" rel="noreferrer">Matching marking scheme</a></>
                  )}
                  <br />
                  <small>{paper.source} · {paper.note}</small>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <button type="button" onClick={() => setShowSchemes((current) => !current)}>
        {showSchemes ? "Hide marking schemes" : "Finished attempting? Reveal marking schemes"}
      </button>
      <p className="quiet">
        Mathematics 2024 Papers 22/42 are retained for topical extraction only because
        Cambridge introduced the dedicated non-calculator structure from 2025.
      </p>
    </section>
  );
}
