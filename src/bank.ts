import rawBasisImp from './data/questions.json'
import rawUnitEnd from './data/questions-unit-end.json'
import rawExtra from './data/questions-extra.json'
import type { Question, QuestionBank } from './types'
import { validateBank, type ValidationResult } from './lib/validate'

// Each set is a self-contained bundled bank (JSON import) so the app works fully
// offline with no fetch. Sets differ in size, so each declares its expected count.
export interface QuestionSet {
  id: string
  name: string
  questions: Question[]
  validation: ValidationResult
}

function buildSet(id: string, name: string, raw: unknown, expectedCount: number): QuestionSet {
  const bank = raw as unknown as QuestionBank
  return {
    id,
    name,
    questions: bank.questions ?? [],
    validation: validateBank(bank, expectedCount),
  }
}

export const SETS: QuestionSet[] = [
  buildSet('basis-imp', 'SAP Basis Imp Questions', rawBasisImp, 181),
  buildSet('unit-end', 'Unit End Questions', rawUnitEnd, 275),
  buildSet('extra', 'Extra Questions', rawExtra, 75),
]

export const DEFAULT_SET_ID = SETS[0].id

export function getSet(id: string): QuestionSet {
  return SETS.find((s) => s.id === id) ?? SETS[0]
}

// Combined index across ALL sets. Question ids are unique per set and across sets
// (distinct prefixes), so a saved report resolves regardless of the active set.
const index = new Map<string, Question>()
const setOfQuestion = new Map<string, string>()
for (const set of SETS) {
  for (const q of set.questions) {
    index.set(q.id, q)
    setOfQuestion.set(q.id, set.id)
  }
}

export function getQuestion(id: string): Question | undefined {
  return index.get(id)
}

/** Which set a question id belongs to (used to tag reports). */
export function getSetIdForQuestion(id: string): string {
  return setOfQuestion.get(id) ?? DEFAULT_SET_ID
}

// ---- Mixed test mode ----
// A test-only pseudo-set that draws from every set at once. It is deliberately
// NOT part of SETS (so it never appears in the Home switcher, Practice, or
// validation); it exists only so a mixed test can be built and its reports tagged.

export const MIXED_SET_ID = 'mixed'
export const MIXED_SET_NAME = 'Mixed (All Sets)'

/** Every question across all sets, combined. Ids are unique across sets, so a
 *  test built from this pool can never repeat a question. */
export const ALL_QUESTIONS: Question[] = SETS.flatMap((s) => s.questions)

/** Human-readable name for a stored report's setId, including the mixed pseudo-set. */
export function setNameFor(setId: string): string {
  return setId === MIXED_SET_ID ? MIXED_SET_NAME : getSet(setId).name
}

/** Public app title. */
export const APP_TITLE = 'SAP Basis Mock Test'
