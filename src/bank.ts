import rawBasisImp from './data/questions.json'
import rawUnitEnd from './data/questions-unit-end.json'
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
  buildSet('basis-imp', 'SAP Basis Imp Questions', rawBasisImp, 175),
  buildSet('unit-end', 'Unit End Questions', rawUnitEnd, 275),
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

/** Public app title. */
export const APP_TITLE = 'SAP Basis Mock Test'
