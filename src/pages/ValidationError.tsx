import { useQuestionSet } from '../context/QuestionSetProvider'
import { Card, CardContent } from '@/components/ui/card'

// Developer-facing error screen shown when the active question set fails
// structural validation. No question is silently dropped - the app simply refuses
// to run on broken data and explains why.
export function ValidationError() {
  const { set } = useQuestionSet()
  const { validation } = set
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Card className="border-2 border-destructive/50">
        <CardContent className="p-6">
          <h1 className="text-xl font-bold text-destructive">Question bank validation failed</h1>
          <p className="mt-2 text-foreground/90">
            The app will not start because the <strong>{set.name}</strong> bank did not pass structural
            validation. Fix the data file (or replace it with the authoritative bank) and reload.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Loaded {set.questions.length} questions in this set.
          </p>
          <h2 className="mt-4 font-semibold text-foreground">Fatal problems</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-destructive">
            {validation.fatal.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {validation.warnings.length > 0 && (
            <>
              <h2 className="mt-4 font-semibold text-foreground">Warnings (non-fatal)</h2>
              <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-auto pl-6 text-sm text-amber-600 dark:text-amber-300">
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
