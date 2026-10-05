import { Card, CardContent } from '@/components/ui/card'

// Question-level explanation, shown once below the options/answer area after a
// question is submitted (Practice) or in review (Reports). The bank's `why` may
// be an empty string - in that case nothing is rendered (no invented text).
export function Explanation({ why }: { why: string }) {
  const text = (why ?? '').trim()
  if (!text) return null
  return (
    <Card className="border-border/60 bg-muted/40 shadow-none">
      <CardContent className="p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Explanation
        </p>
        <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
      </CardContent>
    </Card>
  )
}
