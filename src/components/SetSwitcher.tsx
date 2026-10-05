import { useQuestionSet } from '../context/QuestionSetProvider'
import { cn } from '@/lib/utils'

// Text-based segmented control for choosing the active question set. Deliberately
// label-only (no icons). Buttons show the full set names and wrap on narrow screens.
export function SetSwitcher({ className }: { className?: string }) {
  const { setId, setSetId, sets } = useQuestionSet()
  return (
    <div
      role="radiogroup"
      aria-label="Active question set"
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-lg border bg-muted p-1',
        className,
      )}
    >
      {sets.map((s) => {
        const active = s.id === setId
        return (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setSetId(s.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {s.name}
          </button>
        )
      })}
    </div>
  )
}
