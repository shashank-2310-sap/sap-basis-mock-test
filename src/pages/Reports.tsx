import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_SET_ID } from '../bank'
import { useQuestionSet } from '../context/QuestionSetProvider'
import { deleteReport, getAllReports } from '../lib/db'
import { formatDateTime, formatDuration } from '../lib/format'
import type { StoredReport } from '../types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
      <div className="text-2xl font-extrabold text-primary">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

export function Reports() {
  const { set } = useQuestionSet()
  const [reports, setReports] = useState<StoredReport[] | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function refresh() {
    getAllReports().then((all) =>
      setReports(all.filter((r) => r.mode === 'test' && (r.setId ?? DEFAULT_SET_ID) === set.id)),
    )
  }
  useEffect(() => {
    refresh()
    // Re-filter when the active set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.id])

  if (reports === null) return <div className="p-8 text-center text-muted-foreground">Loading progress…</div>

  if (reports.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="text-xl">No test attempts yet</CardTitle>
        <p className="mt-2 text-muted-foreground">
          Finish a mock test in <strong>{set.name}</strong> and your results will appear here.
        </p>
        <Button asChild className="mt-4 w-fit self-center">
          <Link to="/test">Start a test</Link>
        </Button>
      </Card>
    )
  }

  const n = reports.length
  const passed = reports.filter((r) => r.passed).length
  const bestScore = Math.max(...reports.map((r) => r.score))
  const avgScore = Math.round(reports.reduce((s, r) => s + r.score, 0) / n)
  const avgPct = Math.round(reports.reduce((s, r) => s + r.percentage, 0) / n)
  const chrono = [...reports].sort((a, b) => a.timestamp - b.timestamp)

  async function confirmDelete() {
    if (!deleteId) return
    await deleteReport(deleteId)
    setDeleteId(null)
    refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-extrabold">Progress &amp; reports</CardTitle>
          <p className="text-sm text-muted-foreground">
            {set.name} · switch sets on the Home page to see the other set's history.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat value={n} label="Tests taken" />
            <Stat value={passed} label="Passed" />
            <Stat value={n - passed} label="Failed" />
            <Stat value={avgScore} label="Avg score" />
            <Stat value={bestScore} label="Best score" />
            <Stat value={`${avgPct}%`} label="Avg percentage" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1.5 overflow-x-auto border-b pb-1">
            {chrono.map((r) => (
              <div
                key={r.attemptId}
                className="flex h-full min-w-[18px] flex-1 flex-col items-center justify-end"
                title={`${r.percentage}% · ${formatDateTime(r.timestamp)}`}
              >
                <div
                  className={`w-full rounded-t ${r.passed ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${Math.max(4, r.percentage)}%` }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Oldest → newest. Green bars passed, red bars failed. Hover for details.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Time</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.attemptId}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.timestamp)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">
                    {r.score}/{r.total}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.percentage}%</TableCell>
                  <TableCell>
                    <Badge variant={r.passed ? 'success' : 'danger'}>{r.passed ? 'PASS' : 'FAIL'}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {formatDuration(r.timeUsedSec)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button asChild variant="link" size="sm" className="px-0">
                      <Link to={`/report/${r.attemptId}`}>Review</Link>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(r.attemptId)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this report?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the saved attempt from this browser. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
