import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { BuiltQuestion } from '../types'

// Carries a freshly built test from the setup screen into the runner. Kept in
// memory only: a page refresh clears it, so reloading /test/run cannot silently
// resurrect or restart an attempt (spec section 12). The runner consumes it once.

interface TestSessionValue {
  takePending: () => BuiltQuestion[] | null
  setPending: (built: BuiltQuestion[]) => void
}

const Ctx = createContext<TestSessionValue | null>(null)

export function TestSessionProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<BuiltQuestion[] | null>(null)
  // state only to keep the provider identity stable; value uses refs.
  const [value] = useState<TestSessionValue>(() => ({
    takePending: () => {
      const p = pendingRef.current
      pendingRef.current = null
      return p
    },
    setPending: (built: BuiltQuestion[]) => {
      pendingRef.current = built
    },
  }))

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTestSession(): TestSessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTestSession must be used within TestSessionProvider')
  return v
}
