import { describe, it, expect } from 'vitest'
import { SETS } from './bank'

// Guards the bundled question banks against the kind of data mistake that has
// slipped through before (e.g. a "(3)" question with a single correct answer, or
// a stale correct_answers id). Runs over every set, so manual JSON edits are
// checked automatically via `npm test`.
describe.each(SETS.map((s) => [s.name, s] as const))('question set: %s', (_name, set) => {
  it('passes structural validation with no fatal problems', () => {
    expect(set.validation.fatal).toEqual([])
    expect(set.validation.ok).toBe(true)
  })

  it('has unique question ids', () => {
    const ids = set.questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every correct_answers id exists among that question\'s options and is non-empty', () => {
    for (const q of set.questions) {
      expect(q.correct_answers.length).toBeGreaterThan(0)
      const optionIds = new Set(q.options.map((o) => o.id))
      for (const cid of q.correct_answers) {
        expect(optionIds.has(cid), `${q.id}: "${cid}" not an option`).toBe(true)
      }
    }
  })

  it('answer count matches any "(N)" hint in the question text', () => {
    for (const q of set.questions) {
      const m = q.question.match(/\((\d+)\)\s*$/)
      if (m) {
        expect(
          q.correct_answers.length,
          `${q.id} (q#${q.question_number}): text says (${m[1]}) but ${q.correct_answers.length} marked`,
        ).toBe(Number(m[1]))
      }
    }
  })

  it('every option id is unique within its question', () => {
    for (const q of set.questions) {
      const ids = q.options.map((o) => o.id)
      expect(new Set(ids).size, `${q.id} has duplicate option ids`).toBe(ids.length)
    }
  })
})
