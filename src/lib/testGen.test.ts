import { describe, it, expect } from 'vitest'
import { buildTest, buildPractice, TEST_SIZE } from './testGen'
import type { Question } from '../types'

function fakeBank(n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `Q${i}`,
    question_number: i + 1,
    domain: 'TADM10',
    question: `q${i}`,
    options: [
      { id: 'A', text: 'a' },
      { id: 'B', text: 'b' },
      { id: 'C', text: 'c' },
      { id: 'D', text: 'd' },
    ],
    correct_answers: ['A'],
    why: '',
  }))
}

describe('buildTest', () => {
  it('selects exactly TEST_SIZE questions from a larger pool', () => {
    expect(buildTest(fakeBank(200), TEST_SIZE)).toHaveLength(TEST_SIZE)
  })
  it('never repeats a question within a test', () => {
    const ids = buildTest(fakeBank(200), TEST_SIZE).map((b) => b.question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('caps at the pool size when the pool is smaller than count', () => {
    expect(buildTest(fakeBank(3), TEST_SIZE)).toHaveLength(3)
  })
  it('keeps each option order a permutation of the original ids (no loss/dup)', () => {
    for (const b of buildTest(fakeBank(100), TEST_SIZE)) {
      const original = b.question.options.map((o) => o.id).sort()
      expect([...b.optionOrder].sort()).toEqual(original)
    }
  })
})

describe('buildPractice', () => {
  it('includes every question exactly once', () => {
    const all = fakeBank(50)
    const built = buildPractice(all)
    expect(built).toHaveLength(50)
    expect(new Set(built.map((b) => b.question.id)).size).toBe(50)
  })
})
