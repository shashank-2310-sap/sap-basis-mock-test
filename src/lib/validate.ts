import type { QuestionBank } from '../types'

export interface ValidationResult {
  ok: boolean // false only on fatal structural problems
  fatal: string[]
  warnings: string[]
  counts: {
    total: number
    byDomain: Record<string, number>
  }
}

const DEFAULT_EXPECTED_COUNT = 175

/**
 * Validate a bank on startup against the authoritative JSON schema:
 *   id, question_number, domain, question, options[{id,text}], correct_answers, why.
 *  - Fatal problems stop the app with a developer-facing error.
 *  - Everything else is a non-fatal warning: NO question is ever dropped.
 * A blank `why` is allowed and never a problem. `expectedCount` is the number of
 * questions this particular set should contain (sets differ in size).
 */
export function validateBank(bank: QuestionBank, expectedCount = DEFAULT_EXPECTED_COUNT): ValidationResult {
  const fatal: string[] = []
  const warnings: string[] = []
  const byDomain: Record<string, number> = {}

  const questions = Array.isArray(bank?.questions) ? bank.questions : null
  if (!questions) {
    fatal.push('Question bank has no "questions" array.')
    return { ok: false, fatal, warnings, counts: { total: 0, byDomain } }
  }

  if (questions.length !== expectedCount) {
    fatal.push(`Expected exactly ${expectedCount} questions, found ${questions.length}.`)
  }

  const seenIds = new Set<string>()
  const seenNumbers = new Set<number>()

  questions.forEach((q, i) => {
    const where = q?.id || `index ${i}`
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1

    if (!q.id) fatal.push(`Question at index ${i} has no id.`)
    else if (seenIds.has(q.id)) fatal.push(`Duplicate question id: ${q.id}`)
    else seenIds.add(q.id)

    if (typeof q.question_number !== 'number' || !Number.isFinite(q.question_number)) {
      warnings.push(`Question ${where} has an invalid question_number.`)
    } else if (seenNumbers.has(q.question_number)) {
      warnings.push(`Question ${where} has duplicate question_number ${q.question_number}.`)
    } else {
      seenNumbers.add(q.question_number)
    }

    if (typeof q.why !== 'string') warnings.push(`Question ${where} has a non-string "why".`)

    if (!Array.isArray(q.options) || q.options.length === 0) {
      fatal.push(`Question ${where} has no options.`)
      return
    }

    const optionIds = new Set<string>()
    q.options.forEach((o) => {
      if (!o.id) fatal.push(`Question ${where} has an option with no id.`)
      else if (optionIds.has(o.id)) fatal.push(`Question ${where} has duplicate option id ${o.id}.`)
      else optionIds.add(o.id)
    })

    const correct = Array.isArray(q.correct_answers) ? q.correct_answers : []
    if (correct.length === 0) {
      fatal.push(`Question ${where} has an empty correct_answers array.`)
    }
    correct.forEach((cid) => {
      if (!optionIds.has(cid)) {
        fatal.push(`Question ${where}: correct answer id "${cid}" is not among its options.`)
      }
    })
  })

  return {
    ok: fatal.length === 0,
    fatal,
    warnings,
    counts: { total: questions.length, byDomain },
  }
}
