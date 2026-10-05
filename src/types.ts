// Schema types for the question bank JSON. These mirror the authoritative SAP
// question bank exactly; nothing here rewrites content. The bank is the single
// source of truth for the answer key (`correct_answers`).

export interface QuestionOption {
  id: string // original, stable option id: "A".."H"
  text: string
}

export interface Question {
  id: string
  question_number: number
  domain: string
  question: string
  options: QuestionOption[]
  correct_answers: string[]
  /** Question-level explanation. May be an empty string (then shown nowhere). */
  why: string
}

export interface QuestionBank {
  questions: Question[]
}

// ---- Runtime / attempt types ----

export type Mode = 'test' | 'practice'
// 'tabswitch' is retained so pre-existing saved reports (from when leaving the tab
// ended a test) still render; it is no longer produced by the app.
export type EndReason = 'manual' | 'timeout' | 'tabswitch'

/** A single rendered question within an attempt: the question plus the shuffled
 *  display order of its option ids. The displayed label (A, B, ...) is derived
 *  from the index in `optionOrder`; scoring always uses the original option id. */
export interface BuiltQuestion {
  question: Question
  optionOrder: string[] // original option ids in displayed order
}

/** Persisted report. Explanation text is NOT stored here - it is resolved from
 *  the question bank by question id at view time. */
export interface StoredReport {
  schemaVersion: number
  attemptId: string
  timestamp: number
  mode: Mode
  /** Which question set this attempt was drawn from (e.g. 'basis-imp'). */
  setId: string
  questionIds: string[]
  optionOrders: Record<string, string[]> // questionId -> displayed option-id order
  selections: Record<string, string[]> // questionId -> selected original option ids
  correctness: Record<string, boolean> // questionId -> was the response correct
  score: number
  total: number
  percentage: number
  passed: boolean
  timeUsedSec: number
  endReason: EndReason
  correctCount: number
  incorrectCount: number
  unansweredCount: number
}
