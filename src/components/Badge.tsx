import { Badge } from '@/components/ui/badge'

export function AnswerTypeBadge({ multi }: { multi: boolean }) {
  return (
    <Badge
      variant={multi ? 'purple' : 'secondary'}
      title={multi ? 'Multiple answers - select all that apply' : 'Single answer'}
    >
      {multi ? 'Multiple answers' : 'Single answer'}
    </Badge>
  )
}

export function DomainBadge({ domain }: { domain: string }) {
  return <Badge variant="info">{domain}</Badge>
}
