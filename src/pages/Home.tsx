import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { TEST_DURATION_SEC, passScoreFor, testSizeFor } from '../lib/testGen'
import { useQuestionSet } from '../context/QuestionSetProvider'
import { SetSwitcher } from '../components/SetSwitcher'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

export function Home() {
  const { set } = useQuestionSet()
  const c = set.validation.counts
  const totalQuestions = set.questions.length
  const domains = Object.entries(c.byDomain).sort((a, b) => b[1] - a[1])
  const testSize = testSizeFor(totalQuestions)
  const passScore = passScoreFor(testSize)

  const modes = [
    {
      to: '/test',
      title: 'Test Mode',
      body: `${testSize} random questions, ${TEST_DURATION_SEC / 60}-minute timer, ${passScore}/${testSize} to pass.`,
      cta: 'Start a test',
    },
    {
      to: '/practice',
      title: 'Practice Mode',
      body: `All ${totalQuestions} questions, no timer. Submit each answer to reveal the correct response and explanation.`,
      cta: 'Start practicing',
    },
    {
      to: '/reports',
      title: 'Progress & Reports',
      body: 'Review past test attempts, scores and trends. Open any attempt to re-read every question.',
      cta: 'View progress',
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-extrabold">SAP Basis Mock Test</CardTitle>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Question set
            </span>
            <SetSwitcher />
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Exam-style mock testing and self-paced practice on the {set.name} bank
            ({totalQuestions} questions). All answers and explanations come from the supplied bank.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={c.total} label="Total questions" />
            <Stat value={testSize} label="Questions per test" />
            <Stat value={`${passScore}/${testSize}`} label="Passing score (75%)" />
            <Stat value={`${TEST_DURATION_SEC / 60} min`} label="Time limit" />
          </div>
          {set.id !== 'unit-end' && (
            <div className="flex flex-wrap gap-2">
              {domains.map(([d, n]) => (
                <Badge key={d} variant="info">
                  {d}: {n}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {modes.map((m) => (
          <Link key={m.to} to={m.to} className="group">
            <Card className="h-full transition hover:border-primary hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-primary">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{m.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 font-semibold text-primary">
                  {m.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
