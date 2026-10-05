import type { BuiltQuestion, Question } from '../types'
import { shuffle } from './shuffle'

export const TEST_SIZE = 80
export const TEST_DURATION_SEC = 3600
export const PASS_SCORE = 60 // 75% of 80

function buildOne(q: Question): BuiltQuestion {
  return { question: q, optionOrder: shuffle(q.options.map((o) => o.id)) }
}

/**
 * Test selection (spec section 11):
 *  1. start from the full pool, 2. shuffle it, 3. take the first N,
 *  4. shuffle those N, 5. independently shuffle each question's options.
 * No question repeats within a test.
 */
export function buildTest(all: Question[], count: number = TEST_SIZE): BuiltQuestion[] {
  const shuffledPool = shuffle(all)
  const picked = shuffledPool.slice(0, Math.min(count, shuffledPool.length))
  return shuffle(picked).map(buildOne)
}

/** Practice: every question, randomized order, options shuffled once per session. */
export function buildPractice(all: Question[]): BuiltQuestion[] {
  return shuffle(all).map(buildOne)
}
