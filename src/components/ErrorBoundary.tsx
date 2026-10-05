import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * Top-level safety net: if any page/render throws, show a friendly fallback with a
 * reload action instead of a blank white screen. Saved reports (IndexedDB) are
 * untouched. No external error reporting — the error is only logged to the console.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected UI error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg p-6">
          <Card className="p-6 text-center">
            <CardTitle className="text-xl">Something went wrong</CardTitle>
            <CardContent className="p-0">
              <p className="mt-2 text-sm text-muted-foreground">
                An unexpected error occurred. Reloading usually fixes it — your saved reports
                are not affected.
              </p>
              <Button className="mt-4" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
