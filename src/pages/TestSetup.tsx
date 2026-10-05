import { useNavigate } from 'react-router-dom'
import { useQuestionSet } from '../context/QuestionSetProvider'
import { useTestSession } from '../context/TestSession'
import { buildTest, PASS_SCORE, TEST_DURATION_SEC, TEST_SIZE } from '../lib/testGen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TestSetup() {
  const nav = useNavigate()
  const { set } = useQuestionSet()
  const { setPending } = useTestSession()

  function start() {
    const built = buildTest(set.questions, TEST_SIZE)
    setPending(built)
    nav('/test/run')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">Start a mock test</CardTitle>
          <p className="text-sm text-muted-foreground">{set.name}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-foreground/90">
            <li>• <strong>{TEST_SIZE} questions</strong> drawn at random from all {set.questions.length}, no repeats.</li>
            <li>• <strong>{TEST_DURATION_SEC / 60}-minute</strong> countdown; the test finalizes automatically at zero.</li>
            <li>• Pass mark is <strong>{PASS_SCORE}/{TEST_SIZE} (75%)</strong>.</li>
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
