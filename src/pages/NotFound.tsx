import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

export function NotFound() {
  return (
    <Card className="p-8 text-center">
      <CardContent className="p-0">
        <CardTitle className="text-2xl">Page not found</CardTitle>
        <p className="mt-2 text-muted-foreground">That screen does not exist.</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
