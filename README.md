# Talha CIE 2027 Study System

A private, independently hosted Cambridge IGCSE study tracker for Talha.

## What it includes

- Chemistry 0620, Mathematics 0580 Extended, Pakistan Studies 0448 and Islamiyat 0493
- 207 syllabus topics with Not started, Learning, Practising and Secure stages
- evidence-based mastery: two threshold passes on different dates, including one timed attempt
- provisional C-to-A* priority for Mathematics and B-to-A* plans for the other three subjects
- adaptive daily missions for recall, priority learning, exam practice and correction
- diagnostics, assessment types, paper/component tracking and lost-mark categories
- a parent A* tracker with evidence readiness, consistency, subject status and next focus
- automatic synchronization across devices through Cloudflare D1
- a downloadable progress backup from Parent view
- a private family access code; no ChatGPT account is required

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

## First Cloudflare deployment

1. Create a D1 database named `talha-cie-study-db`.
2. Replace the placeholder `database_id` in `wrangler.jsonc` with the D1 ID.
3. Add the production secrets `FAMILY_ACCESS_CODE` and
   `SESSION_SIGNING_SECRET` in Cloudflare. Use a private family passphrase of at
   least 12 characters and a random signing secret of at least 32 characters.
4. Deploy with `npm run deploy`, or connect the private GitHub repository using
   Cloudflare Workers Builds for automatic deployment after each push.

`keep_vars` is enabled in `wrangler.jsonc`, so dashboard-managed variables are
preserved across code deployments. Encrypted Worker secrets are also retained
by Cloudflare unless they are explicitly deleted.

## Backups

GitHub protects the application source and its full change history. Study data
is stored separately in D1. Open **Parent view → Download progress backup** to
save a dated JSON copy of Talha's progress, assessment evidence and settings.
