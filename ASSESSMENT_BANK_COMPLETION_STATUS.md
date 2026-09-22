# Talha LMS Assessment Bank Status — 22 September 2026

## Completed in this milestone

### 1. Substantive topic-quality expansion
The authored substantive layer was expanded from 42 topics to 61 topics, with 183 explicitly authored knowledge/application questions across Chemistry, Mathematics, Pakistan Studies and Islamiyat.

These questions are separate from the coverage-floor generator. They test actual subject content rather than merely asking whether the learner knows the topic title or generic exam method.

### 2. Larger high-importance pools
Every topic marked importance 3 now receives a 45-question objective pool. Other topics receive a 30-question pool. Topic-specific authored questions are placed first, followed by clearly identifiable coverage-floor questions.

### 3. Verified past-paper reference layer
`app/past-paper-catalogue.ts` has been restored as an auditable reference-only layer. It contains exact paper/question references and question/mark-scheme URLs checked on 2026-09-16. It does not reproduce Cambridge paper text.

Current reference layer: 29 verified topical references covering Mathematics, Chemistry, Pakistan Studies and Islamiyat, plus the previously verified paper/session references.

## Important quality boundary

The substantive layer is **not yet 207/207 topics**. The remaining 146 topics still rely on the coverage-floor layer unless they have reviewed questions in the separate daily bank. They should not be labelled as fully authored substantive coverage.

The next content milestone is therefore to author and review the remaining topics rather than treating automatically generated coverage questions as equivalent to Cambridge-style practice.

## Current code version

FULL_TOPIC_OBJECTIVE_BANK_VERSION = 2026-09-22-v4-substantive-expansion

## Verification

The GitHub commits for this milestone are:
- `9a0d3a7` — increased high-importance pools
- `3661288` — expanded substantive authored questions
- `c2e156c` — restored verified past-paper reference layer
