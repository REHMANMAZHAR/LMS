# Talha CIE 2027 Study System

A private, independently hosted Cambridge IGCSE study tracker for Talha.

## What it includes

- Chemistry 0620, Mathematics 0580 Extended, Pakistan Studies 0448 and Islamiyat 0493
- 207 syllabus topics with Not started, Learning, Practising and Secure stages
- evidence-based mastery: two threshold passes on different dates, including one timed attempt
- provisional C-to-A* priority for Mathematics and B-to-A* plans for the other three subjects
- adaptive daily missions for recall, priority learning, exam practice and correction
- diagnostics, assessment types, paper/component tracking and lost-mark categories
- built-in, automatically marked topic quizzes with server-only answer keys and correction feedback
- a full-topic objective bank generated for all 207 syllabus topics, with a clearly separated substantive-question layer and a coverage-floor layer; the bank exposes auditable topic/subject/question counts
- zero-API Study Tools for topic-specific Google, YouTube and official Cambridge searches
- focused copy-and-paste tutor prompts for ChatGPT, Gemini and NotebookLM, with no AI request made by the LMS
- a parent A* tracker with evidence readiness, consistency, subject status and next focus
- automatic synchronization across devices through Cloudflare D1
- a downloadable progress backup from Parent view
- a private family access code; no external account is required for the core LMS

## Hosting architecture

- **GitHub:** private source repository and version history
- **Cloudflare Workers:** application hosting and HTTPS
- **Cloudflare D1:** synchronized family data
- **Cloudflare Workers Builds:** automatic deployment from the `main` branch

The intended single-family usage fits comfortably within Cloudflare's free
Workers and D1 allowances. A custom domain is optional and is not required.

## Local setup

Requirements: Node.js 22 or newer and a Cloudflare account.

1. Install dependencies with `npm ci`.
2. Copy `.dev.vars.example` to `.dev.vars` and replace both example values.
3. Run `npm run dev`. Required tables are initialized safely on first use.

Never commit `.dev.vars`, an access code, a signing secret, or a Cloudflare API
token. The repository ignores local secret files.

Run `npm test` before deployment. It checks TypeScript, linting, the production
build, and the full application compile path. The objective bank also exposes
runtime coverage statistics so substantive authored questions are not confused
with the syllabus-coverage floor. `npm run test:quizzes` is an optional local Cloudflare
integration test that exercises family login, quiz submission, D1 sync,
evidence promotion, duplicate protection, and backup creation.

## Topic quiz workflow

1. Study a topic and mark it **Learning** in the Syllabus.
2. For a topic with a **Reviewed quiz ready** label, open **Quiz** and complete
   the eight-question, 12-minute attempt.
3. Mathematics and Chemistry require at least 85%; Pakistan Studies and
   Islamiyat require at least 80%. A qualifying result moves the topic to
   **Practising** automatically; a tick alone cannot do this.
4. **Secure** still requires two qualifying results on different dates,
   including at least one timed result.
5. Review every correction shown after submission, then re-test later.

Quiz questions sent to the browser never contain the answer key. Marking is
performed by the authenticated Worker, and both summary evidence and detailed
quiz feedback are synchronized to D1.

The reviewed sets are short knowledge-and-application checks, not substitutes
for full exam practice. Pakistan Studies source work and extended judgements,
Islamiyat 10+4 responses, Chemistry structured/practical questions and full
Mathematics solutions should still be recorded in **Tests**.

## Zero-cost Study Tools workflow

1. Open **Study tools** or use **Explore** beside a syllabus topic.
2. Use the generated Google, YouTube or official Cambridge-site search for
   that exact topic.
3. Choose Teach, Recall, Correct or a 10-minute plan. Add Talha's question or
   working, then copy the prepared Cambridge-focused prompt.
4. Open ChatGPT or Gemini in a separate tab and paste the prompt. The LMS does
   not call either service, transmit the prompt or store the conversation.
5. For source-grounded help, create one NotebookLM notebook per subject, add
   trusted sources, copy the NotebookLM prompt and paste it into the notebook.

External services may require their own account and have provider-controlled
plans or usage limits. They are optional: the LMS, synchronized progress and
built-in quizzes continue to work without them. External output can be
inaccurate and never changes progress, evidence, marks or Secure status.

## First Cloudflare deployment

1. Create a D1 database named `talha-cie-study-db`.
2. Replace the placeholder `database_id` in `wrangler.jsonc` with the D1 ID.
3. Add the production secrets `FAMILY_ACCESS_CODE` and
   `SESSION_SIGNING_SECRET` in Cloudflare. Use a private family passphrase of at
   least 12 characters and a random signing secret of at least 32 characters.
4. No Workers AI binding or AI API secret is required.
5. Deploy with `npm run deploy`, or connect the private GitHub repository using
   Cloudflare Workers Builds for automatic deployment after each push.

`keep_vars` is enabled in `wrangler.jsonc`, so dashboard-managed variables are
preserved across code deployments. Encrypted Worker secrets are also retained
by Cloudflare unless they are explicitly deleted.

## Backups

GitHub protects the application source and its full change history. Study data
is stored separately in D1. Open **Parent view → Download progress backup** to
save a dated JSON copy of Talha's progress, assessment evidence and settings.
The v3 backup also includes detailed built-in quiz attempts and corrections.

## Production deployment

Cloudflare Workers Builds is connected to this repository. The production Worker builds and deploys from the `main` branch; feature branches create non-production versions for review.


## Assessment-bank quality policy

The LMS now distinguishes two kinds of objective-bank coverage:

- **Substantive questions** — authored knowledge/application questions intended to test the actual syllabus content.
- **Coverage-floor questions** — lightweight syllabus-scope/exam-method checks used so every mapped topic has an immediately usable daily-check pool.

Coverage-floor questions are not presented as equivalent to full Cambridge-style content practice. Weekend assessment resolution prefers controlled/imported or authored topic questions when available and reports missing reviewed coverage rather than silently inventing past-paper evidence.

The long-term authoring target is to keep expanding substantive questions topic-by-topic, with higher-value topics receiving larger pools and original Cambridge-aligned structured questions added for weekend work. Past-paper references are recorded only when they are actually verified; the LMS does not invent paper/session/question citations or copy complete copyrighted papers.
