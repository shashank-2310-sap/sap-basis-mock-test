import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_SET_ID, getSet, SETS, type QuestionSet } from '../bank'

// App-wide selection of the active question set, persisted so it survives reloads.
// Mirrors the ThemeProvider pattern.

interface QuestionSetValue {
  setId: string
  set: QuestionSet
  setSetId: (id: string) => void
  sets: QuestionSet[]
}

const STORAGE_KEY = 'questionSet'

const Ctx = createContext<QuestionSetValue | null>(null)

export function QuestionSetProvider({ children }: { children: ReactNode }) {
  const [setId, setSetIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved && SETS.some((s) => s.id === saved) ? saved : DEFAULT_SET_ID
    } catch {
      return DEFAULT_SET_ID
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, setId)
    } catch {
      /* ignore disabled storage */
    }
  }, [setId])

  const value: QuestionSetValue = {
    setId,
    set: getSet(setId),
    setSetId: setSetIdState,
    sets: SETS,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useQuestionSet(): QuestionSetValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useQuestionSet must be used within QuestionSetProvider')
  return v
}
