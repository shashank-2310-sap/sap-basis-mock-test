import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { APP_TITLE, getSetIdForQuestion } from '../bank'
import { AnswerTypeBadge, DomainBadge } from '../components/Badge'
import { OptionList } from '../components/OptionList'
import { Palette, type PaletteStatus } from '../components/Palette'
import { ProgressBar } from '../components/ProgressBar'
import { Timer } from '../components/Timer'
import { ModeToggle } from '@/components/mode-toggle'
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
import { useCountdown } from '../hooks/useCountdown'
import { useTestSession } from '../context/TestSession'
import { newAttemptId } from '../lib/format'
import { isCorrect } from '../lib/scoring'
import { saveReport, REPORT_SCHEMA_VERSION } from '../lib/db'
import { passScoreFor, TEST_DURATION_SEC } from '../lib/testGen'
import type { BuiltQuestion, EndReason, StoredReport } from '../types'

export function TestRunner() {
  const nav = useNavigate()
  const { takePending } = useTestSession()

  const [built, setBuilt] = useState<BuiltQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [ended, setEnded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const endedRef = useRef(false)
  const startRef = useRef(0)
  const initedRef = useRef(false)
  const builtRef = useRef<BuiltQuestion[] | null>(null)
  const selRef = useRef<Record<string, string[]>>({})
  builtRef.current = built
  selRef.current = selections

  // Consume the pending test exactly once. Done in an effect (not a useState
  // initializer) so React StrictMode's double-invoke can't drop the attempt.
  useEffect(() => {
    if (initedRef.current) return
    initedRef.current = true
    const pending = takePending()
    if (!pending || pending.length === 0) {
      nav('/test', { replace: true }) // reload / direct hit -> no silent new attempt
      return
    }
    startRef.current = Date.now()
    setBuilt(pending)
  }, [nav, takePending])

  const finalize = useCallback(
    async (reason: EndReason) => {
      const b = builtRef.current
      if (endedRef.current || !b) return
      endedRef.current = true
      setEnded(true)

      const sels = selRef.current
      const timeUsedSec = Math.min(TEST_DURATION_SEC, Math.round((Date.now() - startRef.current) / 1000))

      const questionIds: string[] = []
      const optionOrders: Record<string, string[]> = {}
      const selections: Record<string, string[]> = {}
      const correctness: Record<string, boolean> = {}
      let correctCount = 0
      let incorrectCount = 0
      let unansweredCount = 0

      for (const item of b) {
        const q = item.question
        const sel = sels[q.id] ?? []
        questionIds.push(q.id)
        optionOrders[q.id] = item.optionOrder
        selections[q.id] = sel
        const ok = isCorrect(q, sel)
        correctness[q.id] = ok
        if (ok) correctCount++
        else if (sel.length === 0) unansweredCount++
        else incorrectCount++
      }

      const total = b.length
      const score = correctCount
      const report: StoredReport = {
        schemaVersion: REPORT_SCHEMA_VERSION,
        attemptId: newAttemptId(),
        timestamp: Date.now(),
        mode: 'test',
        setId: getSetIdForQuestion(b[0].question.id),
        questionIds,
        optionOrders,
        selections,
        correctness,
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0,
        passed: score >= passScoreFor(total),
        timeUsedSec,
        endReason: reason,
        correctCount,
        incorrectCount,
        unansweredCount,
      }

      try {
        await saveReport(report)
      } catch {
        /* persistence best-effort; still show results */
      }
      nav(`/report/${report.attemptId}`, { replace: true })
    },
    [nav],
  )

  const running = !!built && !ended
  const remaining = useCountdown(TEST_DURATION_SEC, running, () => finalize('timeout'))

  if (!built) {
    return <div className="p-8 text-center text-muted-foreground">Loading test…</div>
  }

  const total = built.length
  const bq = built[index] ?? built[total - 1]
  const q = bq.question
  const selected = selections[q.id] ?? []

  const setSelected = (ids: string[]) => {
    if (endedRef.current) return
    setSelections((prev) => ({ ...prev, [q.id]: ids }))
  }

  const statuses: PaletteStatus[] = built.map((item) =>
    (selections[item.question.id]?.length ?? 0) > 0 ? 'answered' : 'unanswered',
  )
  const answeredCount = statuses.filter((s) => s === 'answered').length

  return (
    <div className="flex min-h-full flex-col bg-background">
      {/* Test chrome - deliberately no site navigation */}
      <header className="sticky top-0 z-10 border-b border-primary/20 bg-primary text-primary-foreground shadow">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-sm font-bold tracking-tight">{APP_TITLE}</div>
            <div className="text-xs text-primary-foreground/80">Test Mode</div>
          </div>
          <div className="flex items-center gap-3">
            <Timer remainingSec={remaining} />
            <Button type="button" variant="secondary" onClick={() => setConfirmOpen(true)}>
              End Test
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-5 px-4 py-5 lg:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>
                Question {index + 1} of {total}
              </span>
              <span>{answeredCount} answered</span>
            </div>
            <ProgressBar value={index + 1} max={total} label={`Question ${index + 1} of ${total}`} />
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <DomainBadge domain={q.domain} />
                <AnswerTypeBadge multi={q.correct_answers.length > 1} />
              </div>
              <h1 className="text-lg font-semibold leading-snug text-foreground">{q.question}</h1>
              <div className="mt-4">
                <OptionList built={bq} selected={selected} onChange={setSelected} />
              </div>
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
            {index < total - 1 ? (
              <Button type="button" onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
                Next →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                Finish &amp; submit
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
          <Card className="lg:flex lg:h-full lg:flex-col">
            <CardContent className="p-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
              <h2 className="mb-2 text-sm font-bold text-foreground">Navigator</h2>
              <div className="scroll-slim max-h-[60vh] overflow-y-auto overscroll-contain px-1 py-1 pr-2 lg:max-h-none lg:min-h-0 lg:flex-1">
                <Palette count={total} current={index} statuses={statuses} onJump={setIndex} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End the test now?</AlertDialogTitle>
            <AlertDialogDescription>
              Your answers will be scored and this attempt saved to your reports. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction onClick={() => finalize('manual')}>End test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
