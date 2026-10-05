import { describe, it, expect } from 'vitest'
import { setsEqual, isCorrect, isMultiAnswer } from './scoring'
import type { Question } from '../types'

function q(correct: string[]): Question {
  return {
    id: 'x',
    question_number: 1,
    domain: 'TADM10',
    question: 'q',
    options: [
      { id: 'A', text: 'a' },
      { id: 'B', text: 'b' },
      { id: 'C', text: 'c' },
    ],
    correct_answers: correct,
    why: '',
  }
}

describe('setsEqual', () => {
  it('is order-independent', () => {
    expect(setsEqual(['A', 'B'], ['B', 'A'])).toBe(true)
  })
  it('rejects different lengths', () => {
    expect(setsEqual(['A'], ['A', 'B'])).toBe(false)
  })
  it('rejects different members of equal length', () => {
    expect(setsEqual(['A', 'B'], ['A', 'C'])).toBe(false)
  })
  it('treats two empty sets as equal', () => {
    expect(setsEqual([], [])).toBe(true)
  })
})

describe('isMultiAnswer', () => {
  it('is true only when more than one answer is correct', () => {
    expect(isMultiAnswer(q(['A']))).toBe(false)
    expect(isMultiAnswer(q(['A', 'B']))).toBe(true)
  })
})

describe('isCorrect', () => {
  it('requires the exact set (single answer)', () => {
    expect(isCorrect(q(['A']), ['A'])).toBe(true)
    expect(isCorrect(q(['A']), ['B'])).toBe(false)
  })
  it('requires the exact set (multi answer, no partial credit)', () => {
    expect(isCorrect(q(['A', 'B']), ['B', 'A'])).toBe(true)
    expect(isCorrect(q(['A', 'B']), ['A'])).toBe(false)
    expect(isCorrect(q(['A', 'B']), ['A', 'B', 'C'])).toBe(false)
  })
  it('never scores correct when the answer key is empty', () => {
    expect(isCorrect(q([]), [])).toBe(false)
  })
})
