# Developer notes

Short tour of the two load-bearing pieces — scoring and option randomization —
plus the data-fidelity approach and a few deliberate decisions.

## Option randomization (and why it can't change the answer key)

Each rendered question carries an `optionOrder: string[]` — the **original**
option ids (`A`, `B`, …) in shuffled display order, produced by an unbiased
Fisher-Yates shuffle (`src/lib/shuffle.ts`).

- The **label** a user sees (A, B, C …) is derived from the position in
  `optionOrder` (`src/components/OptionList.tsx`), so the on-screen letter is
  regenerated after shuffling and reveals nothing about the original position.
- **Selection and scoring always use the original option id**, never the display
  index. So reshuffling the display never changes which answer is correct.

`optionOrder` is created once per attempt/session and preserved while navigating
back and forth (test attempt state; `useMemo` in Practice), and it is stored in
each report so an attempt can be reconstructed exactly.

## Scoring (`src/lib/scoring.ts`)

Identical rule whether a question has one correct option or several:

```
selected set === correct set  -> 1 point
otherwise                     -> 0 points
```

The bank carries no answer-type flag, so single- vs multi-answer is derived from
`correct_answers.length` (`isMultiAnswer`), which drives radio-vs-checkbox and the
"select all that apply" messaging. No partial credit, no negative marking.
`setsEqual` compares the selected original-ids against `correct_answers` as sets.
Per-question category used in reports: `correct` (exact match) / `unanswered`
(empty selection, not a match) / `incorrect` (non-empty, not a match) — these
partition the questions and `score` = `correct` count. Pass = `score >= 60` of 80.

### A guard worth knowing
`isCorrect` special-cases a question with an **empty** `correct_answers`: it is
**never** scored correct. Startup validation already rejects any bank that ships
an empty answer key (it is fatal), so this guard is purely defensive — it protects
scoring from an answer-less question ever reaching the runtime.

## Active-test lifecycle

The built test is handed from setup to the runner via an in-memory context
(`src/context/TestSession.tsx`) and consumed exactly once (in an effect, so React
StrictMode's double-invoke can't drop it). It is **not** persisted, so reloading
`/test/run` can't silently resurrect or start a new attempt — it redirects to the
setup screen. A refresh therefore abandons the in-progress attempt by design;
this keeps the "don't accidentally create a new active attempt" guarantee simple
and robust. `endedRef` prevents double-finalize (e.g. the timer expiring while the
user is confirming the End-Test dialog).

## Reports (`src/lib/db.ts`)

IndexedDB store `reports` keyed by `attemptId`, with a `localStorage` fallback for
browsers that block IndexedDB. Reports store question ids, the per-question
display order, the user's selections, per-question correctness and the
aggregates — **not** the explanation text, which is resolved from the bundled bank
by id at view time. `REPORT_SCHEMA_VERSION` + the IndexedDB `DB_VERSION` keep the
schema versioned so future bank changes don't corrupt old reports.

## The question bank schema

The bundled `src/data/questions.json` is the authoritative content dataset,
imported directly (no build step). Each question has exactly `id`,
`question_number`, `domain`, `question`, `options` (each `{ id, text }`),
`correct_answers`, and `why`; see `src/types.ts` and `src/lib/validate.ts`.

- `correct_answers` is the final answer key, used verbatim — never recomputed from
  option text or model knowledge, and never cross-checked against an external
  source at runtime.
- `why` is a single question-level explanation, rendered once below the options
  after submission (`src/components/Explanation.tsx`); a blank `why` renders
  nothing. It is never attached to individual options.
- There is no per-option explanation, no verification/eligibility/source metadata,
  and no answer-type flag — single vs multi is derived from `correct_answers`.

Question ids are stable internal keys and are never shown in the UI.
