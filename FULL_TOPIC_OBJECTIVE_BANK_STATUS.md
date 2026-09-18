# Full-syllabus objective bank expansion — 18 Sep 2026

This branch starts the systematic expansion requested for Talha's four Cambridge subjects.

## Scope
- Mathematics 0580 Extended
- Chemistry 0620 Extended
- Pakistan Studies 0448
- Islamiyat 0493

## Design
The new `app/full-topic-objective-bank.ts` creates an objective bank entry for **every topic currently present in app/data.ts**, so no syllabus-map topic is left without an objective-question source.

Questions are original LMS-authored, syllabus-aligned items. They must not be labelled as Cambridge past-paper questions unless an exact, verified paper reference exists.

The bank supports:
- topic ID and syllabus-code traceability
- answer and explanation
- MCQ options
- subject stream
- versioning and total-count reporting
- later integration into random daily checks and weekend assessment selection

## Quality rule
The generic coverage questions are a floor, not the finished target. High-value topics receive subject-specific questions first. Continue replacing/augmenting generic coverage with 20–30+ substantive questions per normal topic and 40–60+ for major topics.

## Current expansion focus
The first subject-specific expansion covers representative/high-priority areas across:
- Chemistry: bonding, stoichiometry, electrolysis, energetics, rates, acids/salts, metals, organic chemistry, chromatography
- Mathematics: bounds, percentages, surds, algebra, equations, sequences, gradients, geometry, Pythagoras, probability, statistics
- Pakistan Studies: 1857, Aligarh, Khilafat, 1940–47, natural resources, energy, agriculture, industry
- Islamiyat: revelation/compilation, Hijra, battles/treaties, Hadith reliability, early Caliphs, beliefs and pillars

## Next integration
1. Add a topic-bank API/session mode that samples questions without exposing answers.
2. Track question IDs previously seen by the learner to reduce repetition.
3. Save skipped separately from wrong.
4. Weight missed/skipped questions into spaced review.
5. Continue subject-specific authoring until every topic reaches its target depth.
