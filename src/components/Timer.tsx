import { formatClock } from '../lib/format'
import { cn } from '@/lib/utils'

export function Timer({ remainingSec }: { remainingSec: number }) {
  const low = remainingSec <= 300 // last 5 minutes
  const critical = remainingSec <= 60

  // Announce only at thresholds. role="timer" has an implicit live=off, so the
  // ticking value is NOT read every second; the sr-only region speaks once when
  // five minutes / one minute remain.
  let announce = ''
  if (remainingSec === 300) announce = 'Five minutes remaining'
  else if (remainingSec === 60) announce = 'One minute remaining'

  return (
    <div
      role="timer"
      aria-label={`Time remaining ${formatClock(remainingSec)}`}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-lg font-bold tabular-nums',
        critical
          ? 'bg-red-500/15 text-red-600 dark:text-red-300'
          : low
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
            : 'bg-secondary text-secondary-foreground',
      )}
    >
      <span aria-hidden="true">⏱</span>
      <span aria-hidden="true">{formatClock(remainingSec)}</span>
      <span className="sr-only" aria-live="assertive">
        {announce}
      </span>
    </div>
  )
}
