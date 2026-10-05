import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useQuestionSet } from '../context/QuestionSetProvider'
import { AnswerTypeBadge, DomainBadge } from '../components/Badge'
import { Explanation } from '../components/Explanation'
import { OptionList } from '../components/OptionList'
import { Palette, type PaletteStatus } from '../components/Palette'
import { ProgressBar } from '../components/ProgressBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { formatDuration } from '../lib/format'
import { isCorrect, isMultiAnswer } from '../lib/scoring'
import { buildPractice } from '../lib/testGen'

function SummaryTile({
  value,
  label,
  tone = 'default',
}: {
  value: string | number
  label: string
  tone?: 'default' | 'good' | 'bad'
}) {
  const color =
    tone === 'good'
      ? 'text-green-600 dark:text-green-400'
      : tone === 'bad'
        ? 'text-red-600 dark:text-red-400'
        : 'text-primary'
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
      <div className={cn('text-2xl font-extrabold', color)}>{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

export function Practice() {
  const { set } = useQuestionSet()
  const [sessionKey, setSessionKey] = useState(0)
  // Built once per set per session: question order and option order stay fixed while
  // you navigate back and forth. Switching the active set — or restarting (sessionKey) —
  // rebuilds and reshuffles the session.
  const built = useMemo(() => buildPractice(set.questions), [set.id, sessionKey])
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)

  // Session clock: resets whenever a new session is built (set switch or restart).
  const startedAtRef = useRef(Date.now())
  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [set.id, sessionKey])

  const total = built.length
  // Defensive: keep the index in range if the pool ever shrinks (e.g. a smaller set).
  useEffect(() => {
    if (index > total - 1) setIndex(Math.max(0, total - 1))
  }, [index, total])
  const bq = built[index] ?? built[total - 1]
  const q = bq.question
  const selected = selections[q.id] ?? []
  const isSubmitted = !!submitted[q.id]
  const ok = isCorrect(q, selected)
  const multi = isMultiAnswer(q)

  const statuses: PaletteStatus[] = built.map((item) => {
    const id = item.question.id
    if (submitted[id]) return isCorrect(item.question, selections[id] ?? []) ? 'correct' : 'incorrect'
    return (selections[id]?.length ?? 0) > 0 ? 'answered' : 'unanswered'
  })
  const answeredCount = Object.keys(submitted).length

  // Ephemeral session stats (never stored) for the end-of-session summary.
  const correctCount = statuses.filter((s) => s === 'correct').length
  const wrongCount = statuses.filter((s) => s === 'incorrect').length
  const attemptedCount = correctCount + wrongCount
  const notAttemptedCount = total - attemptedCount
  const correctPct = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0

  function openSummary() {
    setElapsedSec(Math.round((Date.now() - startedAtRef.current) / 1000))
    setSummaryOpen(true)
  }

  function setSelected(ids: string[]) {
    if (isSubmitted) return
    setSelections((prev) => ({ ...prev, [q.id]: ids }))
  }
  function submit() {
    if (selected.length === 0 || isSubmitted) return
    setSubmitted((prev) => ({ ...prev, [q.id]: true }))
  }
  function restartSession() {
    setSelections({})
    setSubmitted({})
    setIndex(0)
    setSessionKey((k) => k + 1)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
      <div className="min-w-0">
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground">
            <span>
              Question {index + 1} of {total}
            </span>
            <div className="flex items-center gap-3">
              <span>{answeredCount} submitted</span>
              <Button type="button" variant="outline" size="sm" onClick={openSummary}>
                End session
              </Button>
            </div>
          </div>
          <ProgressBar value={index + 1} max={total} label={`Question ${index + 1} of ${total}`} />
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <DomainBadge domain={q.domain} />
              <AnswerTypeBadge multi={multi} />
            </div>
            <h1 className="text-lg font-semibold leading-snug text-foreground">{q.question}</h1>

            <div className="mt-4">
              <OptionList built={bq} selected={selected} onChange={setSelected} review={isSubmitted} />
            </div>

            {!isSubmitted ? (
              <Button type="button" onClick={submit} disabled={selected.length === 0} className="mt-4">
                {multi ? 'Submit selected answers' : 'Submit answer'}
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg p-3 font-semibold',
                    ok
                      ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                      : 'bg-red-500/15 text-red-700 dark:text-red-300',
                  )}
                >
                  {ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {ok ? 'Correct' : 'Incorrect'}
                </div>
                <Explanation why={q.why} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            ← Previous
          </Button>
          <Button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={index === total - 1}
          >
            Next →
          </Button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <Card className="lg:flex lg:h-full lg:flex-col">
          <CardContent className="p-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <h2 className="mb-2 text-sm font-bold text-foreground">Navigator</h2>
            <div className="scroll-slim max-h-[60vh] overflow-y-auto overscroll-contain px-1 py-1 pr-2 lg:max-h-none lg:min-h-0 lg:flex-1">
              <Palette count={total} current={index} statuses={statuses} onJump={setIndex} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Green = correct, red = incorrect, blue = selected (not submitted), grey = not attempted.
            </p>
          </CardContent>
        </Card>
      </aside>

      <AlertDialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Practice session summary</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">
              Your results for this practice session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <SummaryTile value={attemptedCount} label={`Attempted (of ${total})`} />
            <SummaryTile value={notAttemptedCount} label="Not attempted" />
            <SummaryTile value={correctCount} label="Correct" tone="good" />
            <SummaryTile value={wrongCount} label="Wrong" tone="bad" />
            <SummaryTile value={`${correctPct}%`} label="Correct %" tone="good" />
            <SummaryTile value={formatDuration(elapsedSec)} label="Time taken" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={restartSession}>Restart practice</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
