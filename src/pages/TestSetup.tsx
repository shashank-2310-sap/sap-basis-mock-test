import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ALL_QUESTIONS, MIXED_SET_ID } from '../bank'
import { useQuestionSet } from '../context/QuestionSetProvider'
import { useTestSession } from '../context/TestSession'
import { buildTest, passScoreFor, TEST_DURATION_SEC, testSizeFor } from '../lib/testGen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Source = 'set' | 'mixed'

export function TestSetup() {
  const nav = useNavigate()
  const { set } = useQuestionSet()
  const { setPending } = useTestSession()
  const [source, setSource] = useState<Source>('set')

  const pool = source === 'mixed' ? ALL_QUESTIONS : set.questions
  const testSize = testSizeFor(pool.length)
  const passScore = passScoreFor(testSize)

  function start() {
    const built = buildTest(pool, testSize)
    setPending(built, source === 'mixed' ? MIXED_SET_ID : set.id)
    nav('/test/run')
  }

  const options: { value: Source; label: string; hint: string }[] = [
    { value: 'set', label: set.name, hint: `${set.questions.length} questions` },
    { value: 'mixed', label: 'Mixed (All Sets)', hint: `${ALL_QUESTIONS.length} questions` },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">Start a mock test</CardTitle>
          <p className="text-sm text-muted-foreground">
            {source === 'mixed' ? 'Mixed (All Sets)' : set.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Question pool
            </span>
            <div
              role="radiogroup"
              aria-label="Question pool for this test"
              className="inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1"
            >
              {options.map((o) => {
                const active = o.value === source
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSource(o.value)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      active
                        ? 'bg-primary text-primary-foreground shadow'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {o.label}
                    <span className={cn('ml-1.5 font-normal', active ? 'text-primary-foreground/80' : 'text-muted-foreground/70')}>
                      · {o.hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <ul className="space-y-2 text-foreground/90">
            <li>
              • <strong>{testSize} questions</strong> drawn at random from{' '}
              {source === 'mixed' ? (
                <>all {ALL_QUESTIONS.length} across every set</>
              ) : (
                <>all {set.questions.length}</>
              )}
              , no repeats.
            </li>
            <li>• <strong>{TEST_DURATION_SEC / 60}-minute</strong> countdown; the test finalizes automatically at zero.</li>
            <li>• Pass mark is <strong>{passScore}/{testSize} (75%)</strong>.</li>
            <li>• One question per screen. Move with Previous / Next or the navigator.</li>
            <li>• Multiple-answer questions need the <strong>exact</strong> set — no partial credit, no negative marking.</li>
            <li>• Answers stay hidden until the test ends.</li>
          </ul>
          <Button type="button" onClick={start} size="lg" className="w-full text-base">
            Start test
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
