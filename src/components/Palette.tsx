import { cn } from '@/lib/utils'

export type PaletteStatus = 'answered' | 'unanswered' | 'correct' | 'incorrect'

interface Props {
  count: number
  current: number
  statuses: PaletteStatus[]
  onJump: (index: number) => void
}

// Question navigator. Shows numbers + status only (never question text or
// options for other questions, per spec section 5). Status is conveyed by color
// AND by aria-label so it is not color-only (accessibility).
export function Palette({ count, current, statuses, onJump }: Props) {
  return (
    <nav aria-label="Question navigator">
      <ol className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-6 lg:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => {
          const st = statuses[i] ?? 'unanswered'
          const isCurrent = i === current
          let cls = 'bg-background text-muted-foreground border-input hover:bg-accent'
          let note = 'not answered'
          if (st === 'answered') {
            cls = 'bg-primary/15 text-primary border-primary/40'
            note = 'answered'
          } else if (st === 'correct') {
            cls = 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/50'
            note = 'correct'
          } else if (st === 'incorrect') {
            cls = 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/50'
            note = 'incorrect'
          }
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? 'true' : undefined}
                aria-label={`Question ${i + 1}, ${note}${isCurrent ? ', current' : ''}`}
                className={cn(
                  'h-9 w-full rounded-md border text-sm font-semibold tabular-nums transition-colors',
                  cls,
                  isCurrent && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                )}
              >
                {i + 1}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
