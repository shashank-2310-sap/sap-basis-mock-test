# Claude Code Prompt — Rebuild the "SAP Basis Mock Test" Platform From Scratch

Build a polished, responsive, **fully client-side** mock-test web application for
SAP system administration certification practice. The app ships two bundled
question banks ("sets"), a Test Mode, a Practice Mode, and persistent per-set
progress/reports — all running entirely in the browser with no backend.

The two question-bank JSON files are the **single source of question content,
options, correct answers, and explanations**. They are provided alongside this
prompt (see §3). Treat them as authoritative data: never invent, rewrite,
paraphrase, reorder, merge, or delete any question text, option text, option id,
`correct_answers`, or `why`. Never replace an answer key with model knowledge.

---

## 1. Tech stack (required)

- **Vite + React 18 + TypeScript** — a pure client-side SPA. **Do NOT use Next.js**
  (no SSR/RSC/server is needed; everything is browser-only).
- **Tailwind CSS v3** for styling.
- **shadcn/ui** (Radix primitives) for the component system — Button, Card, Badge,
  Label, RadioGroup, Checkbox, Progress, Table, AlertDialog, DropdownMenu, Alert.
- **react-router-dom** for routing.
- **IndexedDB** with a **localStorage fallback** for persistent reports.
- Icons: **lucide-react** (used sparingly; theme toggle, inline affordances).
- `@/` path alias → `src/` (configure in `tsconfig.json` and `vite.config.ts`).
- Must work locally with `npm install` && `npm run dev`, and `npm run build`
  (type-check + production build) must pass clean.

Do not create a backend. Load both banks as **static JSON assets bundled at build
time** (imported, not fetched) so the app works fully offline.

---

## 2. App identity & theming

- App title: **"SAP Basis Mock Test"** (used in the header, test chrome, and
  `index.html` `<title>`).
- **Dark + light theme with a toggle**, defaulting to **dark**:
  - Use shadcn's CSS-variable token system (`--background`, `--foreground`,
    `--card`, `--primary`, etc.) with a `:root` (light) and `.dark` block.
    `--primary` is a blue accent (`217 91% 60%`).
  - A theme provider (persist choice in `localStorage` key `theme`; options
    `light` / `dark` / `system`) toggles the `.dark` class on `documentElement`.
  - A **Sun/Moon dropdown** toggle (Light / Dark / System) sits in the header.
  - Add a tiny inline script in `index.html` that applies the saved theme (default
    dark) **before first paint** to avoid a light flash.
- Build every surface with shadcn primitives and **semantic token classes**
  (`bg-card`, `text-muted-foreground`, `border`, …), not hard-coded colors.

---

## 3. The question banks (two sets)

Two bundled JSON files, each `{ "questions": [ ... ] }`, imported into the app:

| Set id       | Display name              | File (bundle)                      | Count |
|--------------|---------------------------|------------------------------------|-------|
| `basis-imp`  | **SAP Basis Imp Questions** | `src/data/questions.json`          | 175   |
| `unit-end`   | **Unit End Questions**      | `src/data/questions-unit-end.json` | 275   |

`basis-imp` is the default set. Copy the provided source banks into those paths
byte-exact (no content edits).

### Question schema (exactly these fields, nothing else)

```jsonc
{
  "questions": [
    {
      "id": "C_TADM_23_Q001",      // stable, unique within and across sets
      "question_number": 1,
      "domain": "TADM10",
      "question": "...",
      "options": [                  // option fields are ONLY id + text
        { "id": "A", "text": "..." },
        { "id": "B", "text": "..." }
      ],
      "correct_answers": ["B", "C"], // the final answer key, used verbatim
      "why": "Question-level explanation. May be an empty string."
    }
  ]
}
```

There is **no** `why_not`, `verification`, `verified`, `eligible_*`, `source`,
`is_correct`, `answer_type`, or any audit/verification metadata. Do not add any.

- The correct-answer set comes **only** from `correct_answers`. Never recompute it
  from option text, infer it, or cross-check an external source at runtime.
- **Single- vs multi-answer is derived** from `correct_answers.length > 1` (there
  is no answer-type flag). Single → radio inputs; multi → checkboxes.
- `why` is a single **question-level** explanation. Never attach it to individual
  options. A blank `why` must render nothing (no invented or placeholder text).

---

## 4. Active-set selection + Home-page switcher

- The active set is an **app-wide, persisted selection** (`localStorage` key
  `questionSet`, default `basis-imp`) held in a React context, exposing the active
  set's `name`, `questions`, and `validation`.
- Expose a sets registry (e.g. `SETS` in `src/bank.ts`) plus:
  - `getQuestion(id)` backed by a **combined index across all sets**, so any saved
    report resolves regardless of the active set;
  - `getSetIdForQuestion(id)` to tag reports with their set.
- **Home page** shows a **text-based segmented control** (labeled "Question set")
  to switch sets — plain text buttons, **no icons**. Switching it live-updates the
  Home stats/domain chips and drives which bank Test/Practice/Reports use.
- Everything works identically for both sets.

---

## 5. Test Mode

- Select exactly **80 random questions from the active set** (no repeats).
- Randomize question order per attempt; randomize each question's option order
  independently (unbiased Fisher-Yates).
- Preserve each option's original id; regenerate displayed labels (`A`, `B`, …)
  from display position so the original position can't be inferred. **Score against
  the original option id, never the displayed index.**
- 1 point/question, 80 total, pass = **60/80 (75%)**. No partial credit, no
  negative marking. MSQ scores only on an **exact set match**.
- **60-minute** (3600s) persistent countdown; auto-finalizes at zero.
- Visible **End Test** button → confirm with an **AlertDialog** (not
  `window.confirm`) → finalize immediately and show results.
- Never reveal correct answers during an active test.
- One question per screen; Previous/Next + a navigator palette (numbers/status
  only — never other questions' text/options).
- Reloading the run route must not silently start a new attempt (the built test is
  held in memory only; a refresh abandons the in-progress attempt by design).

---

## 6. Practice Mode

- Use **all questions of the active set**, randomized order + option order, no timer.
- One question per screen; Previous/Next + navigator palette.
- The user must submit before the answer is revealed. On submit, reveal: the
  correct answer(s), whether they were right, and the question-level `why` shown
  **once below the options** (hidden if `why` is blank).
- Radio for single-answer, checkboxes for multi; MSQ requires the exact set (no
  partial credit). Preserve selection + option order while navigating.
- An **End session** button (in the header/meta row) opens a one-time summary
  dialog for the current session — Attempted, Correct, Wrong, Not attempted,
  Correct % (correct / attempted), and Time taken (session elapsed) — computed live
  from session state. These stats are **ephemeral (never persisted)**; the dialog
  offers Close and Restart (fresh randomized session).

---

## 7. Reports / progress (persistent, per set)

- Persist every finished Test Mode attempt to **IndexedDB** (localStorage
  fallback). Keep a **versioned** schema so future changes don't corrupt old
  reports.
- Each report stores at minimum: attempt id, timestamp, mode, **`setId`**
  (which set it was drawn from), question ids, per-question option orders,
  per-question selections, per-question correctness, score, total, percentage,
  pass/fail, time used, end reason, and correct/incorrect/unanswered counts.
  **Do not** store explanation text — resolve it from the bank by question id at
  view time.
- **Reports are scoped per set:** the Progress page shows only the **active set's**
  attempts and names the set (older reports lacking a `setId` default to
  `basis-imp`). Show: tests taken, passed, failed, average score, best score,
  average percentage, a score-trend chart, and a recent-attempts **Table**. Delete
  an attempt via an **AlertDialog** confirm.
- A report-detail page reconstructs the exact attempt (using stored option orders)
  and reviews every question: domain + single/multi badges, correctness, the full
  correct answer, per-option correct/incorrect coloring (icon + text, not color
  alone), and the question-level `why`.

---

## 8. One-question-per-screen (both modes)

Render exactly one question at a time — never two questions, a stacked list, or the
next question's text/options on the active screen. The palette/navigator shows only
question numbers + status (answered / unanswered / current, and
correct/incorrect in Practice & review). Same rule on mobile (scroll within the one
card; no second question appears below).

On wide screens the navigator is a **sticky sidebar whose number grid scrolls
independently** (its own bounded, scrollable region) — with 80–275 questions the
navigator must never force the whole page to scroll; it stays in view while its
grid scrolls internally.

---

## 9. Validation (per set, on startup)

Validate each set against the schema with its **own expected count** (175 / 275):

- exactly the expected number of questions; unique question ids; valid
  `question_number`s; every question has options; option ids unique within a
  question; every `correct_answers` id exists among that question's options;
  `correct_answers` is **non-empty** (fatal if empty); `why` is a string (blank
  allowed).
- **Fatal** problems (wrong count, duplicate/missing ids, bad option set, empty
  answer key) stop the app for the **active set** with a clear developer-facing
  error screen; nothing is silently dropped. A blank `why` is never a problem.

---

## 10. Accessibility

Keyboard-navigable; labelled radio/checkbox inputs; visible focus rings; strong
contrast in both themes; correctness conveyed with icon + text (not color alone);
responsive desktop/tablet/mobile layout.

---

## 11. Build & deploy

- Static client build to `dist/`. Configure Rollup **`manualChunks`** so no single
  chunk is oversized and caching is granular: each question bank in its own chunk,
  all third-party libs in a single `vendor` chunk, app code separate. (A single
  vendor chunk avoids cross-vendor circular chunks.)
- The output is a static SPA deployable to any static host (e.g. Vercel, GitHub
  Pages). If targeting a host served from a subpath, set Vite `base` accordingly;
  for SPA deep-link support on static hosts, add the host's catch-all →
  `index.html` rewrite (e.g. `vercel.json` rewrites), or use a 404 fallback.

---

## 12. Suggested project structure

```
src/
  bank.ts                      # SETS registry, getQuestion (combined), getSetIdForQuestion, APP_TITLE
  types.ts                     # Question/QuestionOption/QuestionBank + StoredReport, Mode, EndReason, BuiltQuestion
  data/
    questions.json             # set 1 (basis-imp, 175)
    questions-unit-end.json    # set 2 (unit-end, 275)
  lib/
    validate.ts  scoring.ts  testGen.ts  db.ts  format.ts  shuffle.ts  utils.ts (cn)
  context/
    TestSession.tsx            # in-memory hand-off of a built test setup -> runner
    QuestionSetProvider.tsx    # active-set context (persisted)
  components/
    theme-provider.tsx  mode-toggle.tsx  SetSwitcher.tsx  ErrorBoundary.tsx
    Layout.tsx  Badge.tsx  OptionList.tsx  Explanation.tsx  Palette.tsx  ProgressBar.tsx  Timer.tsx
    ui/                        # shadcn primitives
  pages/
    Home.tsx  TestSetup.tsx  TestRunner.tsx  Practice.tsx  Reports.tsx  ReportDetail.tsx  NotFound.tsx  ValidationError.tsx
  App.tsx  main.tsx  index.css
```

Scoring helpers (reuse): `setsEqual`, `isCorrect` (empty answer key never scores
correct — defensive), `isMultiAnswer` (`correct_answers.length > 1`). Test
selection: shuffle pool → take 80 → shuffle → shuffle each question's options,
storing option orders for exact report reconstruction.

---

## 13. Deliverables

A fully working app with: clean component structure; a type-safe bank schema;
per-set validation; both sets with a Home switcher; dark/light theme + toggle; Test
Mode (timer, End-Test AlertDialog); Practice Mode (submit → reveal + `why`, plus an
End-session ephemeral summary); per-set reports (IndexedDB, versioned) with trend +
table + delete dialog and a full report-detail review; a top-level error boundary;
a Vitest suite (scoring, test-generation, and per-bank data-integrity incl. the
"(N)"-matches-answer-count check); chunk-split production build; a README; and a
short developer note on scoring and option-randomization.

Verify before finishing: single/multi scoring; MSQ exact-set (no partial/negative);
80-question generation; 60-min timer + auto-finalize; manual End Test;
random question/option order; Practice reveal + blank-`why` hidden; Practice
End-session summary (ephemeral); report persistence + reconstruction; **switching
sets updates Home stats, which bank Test/Practice use, and which reports show** (and
persists across reload); per-set validation errors; theme toggle persists and
defaults to dark; `npm run build` passes clean with no chunk warnings.

The supplied JSON banks are the authoritative content — never silently change the
questions, options, answer keys, or explanations.
