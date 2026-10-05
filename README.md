# SAP Basis Mock Test

A polished, responsive mock-test web application for SAP system administration
certification practice. It runs entirely in the browser — Test Mode, Practice
Mode, and persistent progress/reports — across **two switchable question sets**:
**SAP Basis Imp Questions** (175 Q) and **Unit End Questions** (275 Q). The active
set is chosen on the Home page and persists; each set keeps its own reports.

> The question text, options, correct answers and explanations all come from the
> supplied question bank JSON. The app never invents, rewrites or reorders
> question/option text, and never replaces the bank's answer key (`correct_answers`)
> with model knowledge.

## Tech stack

- **Vite + React 18 + TypeScript** (pure client-side SPA — no backend)
- **Tailwind CSS** for styling
- **react-router-dom** for routing
- **IndexedDB** (with a `localStorage` fallback) for persistent reports

A pure client app was chosen over Next.js on purpose: everything here (the test
timer, IndexedDB persistence) is browser-only, so there is nothing for a server to
do and no SSR guards to fight.

## Prerequisites

- **Node.js 18+** and npm. (Install from https://nodejs.org if `node -v` fails.)

## Run it

```bash
npm install
npm run dev        # open the printed http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
npm test           # run the Vitest suite (scoring, test generation, bank integrity)
```

## Deployment (Vercel)

The app is a static client-side SPA — no backend, no environment variables — so it
deploys to Vercel directly from your machine with the **Vercel CLI** (no Git host
required).

**One time**

```bash
npm i -g vercel     # install the CLI
vercel login        # authenticate with your Vercel account (browser / email)
```

**Deploy**

```bash
vercel              # first run: guided setup, creates a PREVIEW deployment
vercel --prod       # promote to PRODUCTION (your public URL)
```

On the first `vercel` run it asks a few questions — accept the defaults except the
name:

- **Scope:** your account/team.
- **Link to existing project?** No.
- **Project name:** this becomes your URL — `‹name›.vercel.app` (lowercase +
  hyphens; if the subdomain is already taken globally, pick a variant). You can
  rename it later in **Project Settings** and the URL follows.
- **Directory:** `./`.
- **Build settings:** Vercel **auto-detects Vite** — Build Command `npm run build`,
  Output Directory `dist`. Accept these.

Re-run `vercel --prod` any time to ship a new production build.

**Notes for maintainers**

- **Keep `vercel.json`.** It pins the build (`framework`/`buildCommand`/
  `outputDirectory`) so a stray dashboard change can't drift, and ships the SPA
  rewrite (`/(.*) → /index.html`). Without the rewrite, refreshing or opening a
  deep link (`/reports`, `/report/:id`) returns a 404, because a static host has no
  server to route unknown paths back to the app.
- **`dist/` and `.vercel/` are git-ignored on purpose.** Vercel runs `npm run build`
  itself (never commit build output), and `.vercel/` is just this machine's link to
  the Vercel project.
- **No env vars / secrets** are needed.
- **Deploying from the Vercel dashboard instead?** Import the project and set
  **Build Command** = `npm run build`, **Output Directory** = `dist` (usually
  auto-filled by the Vite preset).
- **Want auto-deploys + per-PR preview URLs?** Connect a Git repository to the same
  Vercel project under **Project Settings → Git**; the CLI setup above still works
  alongside it.

## Modes

### Test Mode
- 80 random questions from the active set (no repeats), order randomized, options
  randomized independently per question.
- 60-minute countdown; auto-finalizes at zero. Visible **End Test** button
  finalizes immediately (with a confirm dialog).
- 1 point per question, pass = **60/80 (75%)**, no partial credit, no negative
  marking. For MSQ, you score only when the **complete** set of correct options
  is selected.
- One question per screen, Previous/Next + a status navigator. On wide screens the
  navigator is a sticky sidebar that scrolls on its own, so the page doesn't scroll
  with it. Correct answers and explanations are hidden until the test ends.

### Practice Mode
- All questions of the active set, randomized order and options, no timer.
- Submit an answer to reveal: the correct answer(s), whether you were right, and
  the question's explanation (`why`) shown once below the options. Questions whose
  `why` is blank simply show no explanation.
- **End session** (button in the header row) opens a one-time summary — Attempted,
  Correct, Wrong, Not attempted, Correct % (of attempted) and Time taken — for the
  current session. These numbers are **not stored**; from the dialog you can close
  it or restart a fresh session.

### Progress / Reports
- Every test attempt is stored locally (IndexedDB), tagged with its question set.
  The Progress page shows the **active set's** attempts — tests taken,
  passed/failed, average and best score, average percentage, a score trend, and
  recent attempts. Open any attempt for a full question-by-question review.

## The question banks

Two bundled banks are imported (not fetched), so the app works fully offline:

- `src/data/questions.json` — **SAP Basis Imp Questions** (175 Q)
- `src/data/questions-unit-end.json` — **Unit End Questions** (275 Q)

They are the authoritative content datasets. The set registry lives in
`src/bank.ts` (`SETS`, each with an `id`, display `name`, questions and its own
expected count); the active set is held in `src/context/QuestionSetProvider.tsx`
(persisted in `localStorage`) and switched from the Home-page control. To add or
replace a set, drop in a JSON file in the schema below and register it in `SETS`.

### Schema

Each question carries exactly these fields (and nothing else):

```jsonc
{
  "questions": [
    {
      "id": "C_TADM_23_Q001",
      "question_number": 1,
      "domain": "TADM10",
      "question": "...",
      "options": [{ "id": "A", "text": "..." }, { "id": "B", "text": "..." }],
      "correct_answers": ["B", "C"],   // the final answer key, used verbatim
      "why": "Question-level explanation. May be an empty string."
    }
  ]
}
```

Options have only `id` and `text`. There is no per-option explanation, no
verification/eligibility/source metadata, and no answer-type flag — single- vs
multi-answer is derived from the length of `correct_answers`.

## Data validation

On startup the app validates the bank. **Fatal** problems (wrong count, duplicate
ids, missing options, a duplicate option id, an empty `correct_answers`, or a
correct-answer id not present among that question's options) stop the app with a
developer-facing error. Everything else is a non-fatal **warning** logged
internally — **no question is ever dropped, and all 175 are eligible for both
modes**. A blank `why` is always allowed.

## Accessibility

Keyboard-navigable, labelled radio/checkbox inputs, visible focus rings, correct/
incorrect conveyed with icons + text (not color alone), and a responsive
desktop/tablet/mobile layout.
