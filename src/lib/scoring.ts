import type { Question } from '../types'

/** True when two id lists represent the same set (order-independent). */
export function setsEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  for (const x of b) if (!s.has(x)) return false
  return true
}

/**
 * Multiple-answer when the bank's answer key has more than one correct option.
 * The bank carries no explicit answer-type flag, so this is derived from
 * `correct_answers` and drives checkbox-vs-radio and "select all" messaging.
 */
export function isMultiAnswer(question: Question): boolean {
  return question.correct_answers.length > 1
}

/**
 * Scoring rule (identical for single- and multi-answer):
 *   selected set === correct set  -> correct (1 point)
 *   otherwise                     -> 0 points
 * No partial credit. No negative marking. Evaluated against original option ids,
 * compared only against the JSON `correct_answers`.
 */
export function isCorrect(question: Question, selectedOriginalIds: readonly string[]): boolean {
  // Defensive: a question with no answer key can never be scored correct (startup
  // validation already rejects the bank if this ever happens).
  if (question.correct_answers.length === 0) return false
  return setsEqual(selectedOriginalIds, question.correct_answers)
}
