import { Progress } from '@/components/ui/progress'

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return <Progress value={pct} aria-label={label ?? `Progress ${value} of ${max}`} />
}
