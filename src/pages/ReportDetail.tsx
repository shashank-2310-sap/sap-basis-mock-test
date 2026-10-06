import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getQuestion, getSet, DEFAULT_SET_ID } from '../bank'
import { AnswerTypeBadge, DomainBadge } from '../components/Badge'
import { Explanation } from '../components/Explanation'
import { OptionList } from '../components/OptionList'
import { getReport } from '../lib/db'
import { formatDateTime, formatDuration } from '../lib/format'
import { isMultiAnswer } from '../lib/scoring'
import { passScoreFor } from '../lib/testGen'
import type { EndReason, StoredReport } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const LETTERS = 'ABCDEFGH'

const END_REASON_LABEL: Record<EndReason, string> = {
  manual: 'Manually ended',
  timeout: 'Time expired',
  tabswitch: 'Test ended because the test window was left',
}

function SummaryStat({
  value,
  label,
  tone = 'default',
}: {
  value: string | number
  label: string
  tone?: 'default' | 'good' | 'bad'
}) {
  const color =
    tone === 'good' ? 'text-green-600 dark:text-green-400' : tone === 'bad' ? 'text-red-600 dark:text-red-400' : 'text-primary'
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
      <div className={cn('text-2xl font-extrabold', color)}>{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

export function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState<StoredReport | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    let active = true
    getReport(id).then((r) => {
      if (active) setReport(r ?? null)
    })
    return () => {
      active = false
    }
  }, [id])

  if (report === undefined) return <div className="p-8 text-center text-muted-foreground">Loading report…</div>
  if (report === null) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="text-xl">Report not found</CardTitle>
        <Button asChild variant="link" className="mt-3 self-center">
          <Link to="/reports">Back to progress</Link>
        </Button>
      </Card>
    )
  }

  const passed = report.passed
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-foreground">Test result</h1>
              <p className="text-sm text-muted-foreground">
                {getSet(report.setId ?? DEFAULT_SET_ID).name} · {formatDateTime(report.timestamp)}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-lg font-extrabold',
                passed
                  ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                  : 'bg-red-500/15 text-red-700 dark:text-red-300',
              )}
            >
              {passed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              {passed ? 'PASS' : 'FAIL'}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryStat value={`${report.score}/${report.total}`} label="Score" tone={passed ? 'good' : 'bad'} />
            <SummaryStat value={`${report.percentage}%`} label={`Pass ${Math.round((passScoreFor(report.total) / report.total) * 100)}%`} />
            <SummaryStat value={report.correctCount} label="Correct" tone="good" />
            <SummaryStat value={report.incorrectCount} label="Incorrect" tone="bad" />
            <SummaryStat value={report.unansweredCount} label="Unanswered" />
            <SummaryStat value={formatDuration(report.timeUsedSec)} label="Time used" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="secondary">End reason: {END_REASON_LABEL[report.endReason] ?? report.endReason}</Badge>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link to="/reports">All reports</Link>
            </Button>
            <Button asChild variant="link" size="sm" className="px-0">
              <Link to="/test">Take another test</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Question-by-question review</h2>
        <ol className="space-y-5">
          {report.questionIds.map((qid, i) => {
            const q = getQuestion(qid)
            if (!q) {
              return (
                <li key={qid}>
                  <Card className="p-5 text-sm text-muted-foreground">
                    Question {i + 1}: no longer present in the bank ({qid}).
                  </Card>
                </li>
              )
            }
            const order = report.optionOrders[qid] ?? q.options.map((o) => o.id)
            const selected = report.selections[qid] ?? []
            const ok = report.correctness[qid]
            const answered = selected.length > 0
            const correctLetters = q.correct_answers
              .map((cid) => LETTERS[order.indexOf(cid)] ?? '?')
              .sort()
              .join(', ')

            return (
              <li key={qid}>
                <Card>
                  <CardContent className="p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-muted-foreground">#{i + 1}</span>
                      <DomainBadge domain={q.domain} />
                      <AnswerTypeBadge multi={isMultiAnswer(q)} />
                      <span className="ml-auto">
                        <Badge variant={ok ? 'success' : answered ? 'danger' : 'secondary'}>
                          {ok ? '✓ Correct' : answered ? '✗ Incorrect' : '— Not answered'}
                        </Badge>
                      </span>
                    </div>
                    <h3 className="font-semibold leading-snug text-foreground">{q.question}</h3>
                    <div className="mt-3">
                      <OptionList built={{ question: q, optionOrder: order }} selected={selected} review />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground/90">
                      Complete correct answer: {correctLetters || '(none)'}
                    </p>
                    <div className="mt-3">
                      <Explanation why={q.why} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
