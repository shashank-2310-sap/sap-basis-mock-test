import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { BuiltQuestion } from '../types'

// Carries a freshly built test from the setup screen into the runner. Kept in
// memory only: a page refresh clears it, so reloading /test/run cannot silently
// resurrect or restart an attempt (spec section 12). The runner consumes it once.

/** A pending test plus the id of the set (or 'mixed') it was drawn from, so the
 *  saved report is tagged to the right scope regardless of which questions landed. */
interface PendingTest {
  built: BuiltQuestion[]
  setId: string
}

interface TestSessionValue {
  takePending: () => PendingTest | null
  setPending: (built: BuiltQuestion[], setId: string) => void
}

const Ctx = createContext<TestSessionValue | null>(null)

export function TestSessionProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<PendingTest | null>(null)
  // state only to keep the provider identity stable; value uses refs.
  const [value] = useState<TestSessionValue>(() => ({
    takePending: () => {
      const p = pendingRef.current
      pendingRef.current = null
      return p
    },
    setPending: (built: BuiltQuestion[], setId: string) => {
      pendingRef.current = { built, setId }
    },
  }))

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTestSession(): TestSessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTestSession must be used within TestSessionProvider')
  return v
}
