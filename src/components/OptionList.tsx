import type { ReactNode } from 'react'
import type { BuiltQuestion } from '../types'
import { isMultiAnswer } from '../lib/scoring'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

const LETTERS = 'ABCDEFGH'

interface Props {
  built: BuiltQuestion
  selected: string[]
  onChange?: (ids: string[]) => void
  /** review=true reveals correctness. */
  review?: boolean
  /** disabled locks inputs (e.g. after a practice question is submitted). */
  disabled?: boolean
}

/**
 * Renders one question's options in their shuffled display order. The visible
 * label (A, B, ...) comes from the display index; selection state and scoring
 * use the ORIGINAL option id, so randomizing never changes the answer key.
 * Single-answer questions use a radio group, multi-answer use checkboxes.
 */
export function OptionList({ built, selected, onChange, review = false, disabled = false }: Props) {
  const q = built.question
  const isMulti = isMultiAnswer(q)
  const correctSet = new Set(q.correct_answers)
  const selSet = new Set(selected)
  const name = `q-${q.id}`
  const locked = disabled || review || !onChange

  function toggleMulti(id: string) {
    if (!onChange || locked) return
    if (selSet.has(id)) onChange(selected.filter((x) => x !== id))
    else onChange([...selected, id])
  }

  function rowView(oid: string, idx: number) {
    const opt = q.options.find((o) => o.id === oid)
    if (!opt) return null
    const letter = LETTERS[idx] ?? String(idx + 1)
    const chosen = selSet.has(oid)
    const isAnsCorrect = correctSet.has(oid)
    const ctrlId = `${name}-${oid}`

    let box = 'border-input bg-background'
    if (!review && chosen) box = 'border-primary bg-primary/10 ring-1 ring-primary'
    let marker: ReactNode = null
    if (review) {
      if (isAnsCorrect) {
        box = 'border-green-500 bg-green-500/10'
        marker = (
          <span className="text-sm font-semibold text-green-700 dark:text-green-300">
            ✓ Correct answer
          </span>
        )
      } else if (chosen) {
        box = 'border-red-500 bg-red-500/10'
        marker = (
          <span className="text-sm font-semibold text-red-700 dark:text-red-300">
            ✗ Your answer - incorrect
          </span>
        )
      }
    }

    const control = isMulti ? (
      <Checkbox
        id={ctrlId}
        className="mt-0.5"
        checked={chosen}
        disabled={locked}
        onCheckedChange={() => toggleMulti(oid)}
        aria-label={`Option ${letter}: ${opt.text}`}
      />
    ) : (
      <RadioGroupItem
        id={ctrlId}
        className="mt-0.5"
        value={oid}
        disabled={locked}
        aria-label={`Option ${letter}: ${opt.text}`}
      />
    )

    return (
      <li key={oid}>
        <Label
          htmlFor={ctrlId}
          className={cn(
            'flex items-start gap-3 rounded-lg border-2 p-3 font-normal leading-normal transition-colors',
            box,
            locked ? 'cursor-default' : 'cursor-pointer hover:bg-accent',
          )}
        >
          {control}
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-semibold text-foreground">{letter}.</span>
              <span className="text-base text-foreground/90">{opt.text}</span>
            </span>
            {marker && <span className="mt-1 block">{marker}</span>}
          </span>
        </Label>
      </li>
    )
  }

  const rows = built.optionOrder.map((oid, idx) => rowView(oid, idx))

  if (isMulti) {
    return (
      <fieldset className="m-0 border-0 p-0">
        <legend className="sr-only">Select all answers that apply</legend>
        <ul className="space-y-2.5" role="group">
          {rows}
        </ul>
      </fieldset>
    )
  }

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Select one answer</legend>
      <RadioGroup
        name={name}
        value={selected[0] ?? ''}
        disabled={locked}
        onValueChange={(v) => onChange?.([v])}
        asChild
      >
        <ul className="space-y-2.5">{rows}</ul>
      </RadioGroup>
    </fieldset>
  )
}
