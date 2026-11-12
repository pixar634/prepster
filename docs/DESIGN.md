# Prepster: design and roadmap

**Status:** accepted 2026-11-13. Phase 0 (cleanup) and Phase 1 (the sample) built.
**Reference:** [JobMagnet's interview module](https://github.com/pixar634/jobmagnet/blob/main/app/interview.py), the
engine this ports.

## ⏱ SESSION HANDOFF: read this first

**2026-11-13: Phase 1 built; next is real preps with a key (Phase 2).**
- **Live state:** nothing deployed. `npm run dev`, then open `/sample`: a finished prep with invented people, the adaptive
  practice deck for each round, and the warehouse practical running in the browser sandbox (Python and JavaScript).
- **Done:** Phase 0 (cleanup); Phase 1 (below). Checked by looking, in Chrome at 1280 and 390 px wide: two "got it" in a
  row raised the difficulty; the reference solutions scored 41 of 41 through the page in both languages; an infinite loop
  was stopped after 10 seconds and the page recovered; no console errors.
- **Next, in order:** 1. Phase 2 (key settings, intake, research, rounds, spoken answers, export). 2. Phase 3 (deploy and
  a real-user test).
- **Owed checks:** the sandbox on a real phone (only a 390 px desktop window so far); keyboard shortcuts with a screen
  reader; the first Python run's download time on mobile data.
- **Open decisions:** O1 and O2 below.
- **Verify with:** `npm ci && npm run check`

## 0. Why

A candidate has an interview at a named company next week. They want to know what the company builds, how it
interviews for this role, and which questions they'll face, with answers built honestly from their own CV. Question
banks are generic and invent nothing useful about the company. JobMagnet already does this well, but only as a local
app tied to its CV pipeline. Prepster puts that engine on the web: upload a CV, paste the job, prepare.

## 1. What already exists: port it, don't rebuild it

| JobMagnet | What it gives | In Prepster |
|---|---|---|
| `app/interview.py` prompts: RESEARCH, QUESTIONS, SAY, CODETEST, PRACTICAL, PRACTICAL_REVIEW | Tested prompts for every step | `lib/prompts/`, wording kept |
| `_sourced`, `_question`, `_problem`, `_ptest`, `_practical` | Code that drops bad model output: research without a real link, coding questions for roles that don't code, thin tests | Schemas with the same drop rules, in `lib/schemas/` |
| `app/engines.py` (Claude CLI, web search tool) | Model calls | Server routes on `@anthropic-ai/sdk`, with Anthropic's web search tool for research |
| `report.json`, `plan.json`, the profile | Role, company, gaps, tailored CV, true facts | Intake: CV upload and the pasted job description; the model sorts which requirements the CV shows |
| `app/static/runner.js` | A Web Worker sandbox with network removed; Pyodide for Python | `public/runner.js`, nearly as-is |
| `app/practical_sample.json` | A checked practical (warehouse inventory) that needs no model | The no-key sample |
| `ivDeck`, `ivPick` in `app/static/app.js` | The adaptive deck: two "got it" in a row raise the difficulty, "review again" lowers it | A React component |
| `markdown()` | Prep notes as Markdown | Export |

## 2. Decisions

| ID | Decision | Why | Status |
|---|---|---|---|
| D1 | Prepster is a hosted web app that ports JobMagnet's interview engine | A public demo anyone can use; JobMagnet stays the local, private tool | accepted 2026-11-13 |
| D2 | The model runs on the visitor's own Anthropic key, kept in their browser and sent only with their requests. On a local run the server may use the owner's key from `.env.local`, behind `PREPSTER_SERVER_KEY`, which ships off | Hosting costs the owner nothing and strangers can't drain a key | accepted 2026-11-13 |
| D3 | A built-in sample works with no key | Anyone can try the deck and the practical for free | accepted 2026-11-13 |
| D4 | Voice mock interview with the browser's own speech (Web Speech API), behind a switch that ships off | Free and no third party; Chrome and Edge only, so text stays the main path | accepted 2026-11-13 |
| D5 | Storage in the browser only (IndexedDB), with Markdown export. No accounts, no database | Nothing private on our servers; fastest to build | accepted 2026-11-13 |
| D6 | Stack: Next.js App Router, Tailwind, shadcn/ui; Claude through `@anthropic-ai/sdk` on server routes | Already set up; server routes keep web search and prompts off the client | accepted 2026-11-13 |
| D7 | Commits go straight to `main` for now; CI runs on every push | Solo repo, owner's call | accepted 2026-11-13 |

## 3. Design

### The flow
1. **Intake:** CV (PDF or text), the job description (pasted), company and role. A PDF goes to Claude as a document
   block; nothing is stored on the server.
2. **Research** (Claude with web search): products, stack, values, recent launches, the interview process, reported
   questions. Each item keeps the URL it came from, or code drops it.
3. **Rounds:** three rounds planned the way this company runs them where that's known. Coding questions only for roles
   that code; the last round always covers culture, built on the company's stated values.
4. **Practice deck:** one question at a time; the answer is hidden until revealed; got it / review again.
5. **Coding test and practical** (coding roles only), run in the browser sandbox.
6. **Voice mock** (switch): the browser reads the question, transcribes the answer, Claude marks each point as covered
   or not.

### Server routes (stateless)
`/api/research`, `/api/rounds`, `/api/say`, `/api/codetest`, `/api/practical`, `/api/practical/review`,
`/api/voice/grade`. Each one takes the key from the request (or from the environment when `PREPSTER_SERVER_KEY=on`),
calls Claude, checks the reply against its schema and returns it. Keys and CVs are never logged.

### Numbers, and the code that computes them
- Tests passed: the browser sandbox runs them and counts.
- "Covered 4 of 6 points" (voice): Claude classifies each point; code counts them.
- Difficulty in the deck: the streak rule in code.
- The practical review: JobMagnet shows the model's 1 to 5 scores. Prepster shows the reviewer's judgement in words
  ("below the bar", "at the bar", "strong") and labels it as the model's opinion, because the model doesn't produce
  numbers here.

### Truth rules, carried over
- Research without a real source link is dropped by code, never shown.
- Answers about the candidate use only facts from their CV; where the CV lacks something, the answer says so and
  bridges to the nearest real experience.
- Anything the candidate uploads is passed to the model as fenced data, never as instructions.
- Generated code never runs on a server.
- The sample is an invented candidate and company, labelled as a sample, with no made-up source links.

## 4. Switches

| Key | Default | On | Off |
|---|---|---|---|
| `PREPSTER_SERVER_KEY` | off | A request without a key uses `ANTHROPIC_API_KEY` from the environment (local runs only) | A request without a key is refused with "Add your key, or try the sample" |
| `NEXT_PUBLIC_VOICE` | off | Rounds offer a spoken mock | Rounds are text only, exactly as before |

## 5. Legal and privacy

- CVs and preps stay in the browser. The server passes them to Anthropic per request and keeps nothing; a privacy page
  says so before Phase 3 ships.
- Research reads public pages through Anthropic's web search tool; Prepster scrapes nothing. Reported interview
  questions are summarised with a link, not copied.
- The visitor's key lives in browser storage, so the site loads no third-party scripts on the page (Pyodide runs only
  inside the worker), and the key is held for the session unless the visitor asks to remember it.

## 6. Phases

- ✅ **Phase 0, cleanup.** Dependencies, CI, Dependabot, README, licence, this doc. *Exit:* `npm run check` passes
  locally and in CI.
- ✅ **Phase 1, the app shell and the no-key sample (built 2026-11-13).** A sample prep (invented candidate and company), the practice
  deck, the practical with the warehouse sample, and the browser sandbox. *Exit:* the sample's reference solutions pass
  every test in the sandbox, in Python and JavaScript, checked by a test (`lib/__tests__/sandbox.test.ts`, which loads the
  real `public/runner.js`); checked in the browser at phone and desktop width.
- ☐ **Phase 2, real preps with a key.** Key settings, intake, research, rounds, spoken answers, Markdown export.
  *Exit:* one real prep end to end on a local run; a unit test shows research without links is dropped.
- ☐ **Phase 3, deploy and a real-user test.** Hosting (O1), privacy page; 3 to 5 people preparing for real interviews
  use it, and one session is watched. *Exit:* their feedback is written here before Phase 4 starts.
- ☐ **Phase 4, the coding test, the practical writer and the review.**
- ☐ **Phase 5, the voice mock**, behind its switch. *Exit:* works in Chrome on a phone; with the switch off the app
  renders exactly as Phase 4.

Why the sample comes first: it's checkable by looking, costs nothing, and gives the public site something that works
from day one.

## 7. Risks, and what was rejected

- **Rejected: the PrepWise tutorial stack** (Firebase, Gemini, Vapi). Its questions are generic and unsourced;
  JobMagnet's engine is stronger and already proven.
- **Rejected: a paid voice service** (D4) and **accounts with a database** (D5).
- **Rejected: the owner's key on the public site.** Anyone could spend it.
- **Risk: long generations against serverless time limits.** A full prep takes 2 to 5 minutes in JobMagnet. Measure in
  Phase 2; if needed, write one round per call and stream progress.
- **Risk: Web Speech API accuracy and support.** Text stays the default path.
- **Risk: building ahead of proof.** The real-user test in Phase 3 comes before the coding and voice features.

## 8. Open decisions

- **O1 Hosting.** Recommended: Vercel (made by the Next.js team, free tier). Check its function time limit against a
  real prep first. Needed by Phase 3.
- **O2 An Anthropic API key for local runs.** JobMagnet runs on the Claude CLI subscription, which doesn't cover the
  API; real preps need a key from console.anthropic.com, billed per use (roughly $0.50 to $1 per full prep on Claude
  Opus 5.5, estimated, not measured). Needed by Phase 2.

## 9. Verification

`npm ci && npm run check` runs lint with zero warnings, the typecheck and the build. CI runs the same on every push to
`main`.
