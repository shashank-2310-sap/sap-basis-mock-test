import type { StoredReport } from '../types'

// Versioned client-side persistence. Primary: IndexedDB. Fallback: localStorage
// (e.g. private-mode browsers that block IndexedDB). The schema is versioned so
// future bank/report changes don't corrupt old reports.

export const REPORT_SCHEMA_VERSION = 2
const DB_NAME = 'sap-basis-acd-mock-test'
const DB_VERSION = 1
const STORE = 'reports'
const LS_KEY = 'sap-basis-acd-mock-test:reports'

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'attemptId' })
        store.createIndex('byTimestamp', 'timestamp', { unique: false })
        store.createIndex('byMode', 'mode', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ---- localStorage fallback ----
function lsReadAll(): StoredReport[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as StoredReport[]) : []
  } catch {
    return []
  }
}
function lsWriteAll(reports: StoredReport[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(reports))
  } catch {
    /* ignore quota / disabled storage */
  }
}

export async function saveReport(report: StoredReport): Promise<void> {
  if (!hasIndexedDB()) {
    const all = lsReadAll().filter((r) => r.attemptId !== report.attemptId)
    all.push(report)
    lsWriteAll(all)
    return
  }
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(report)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}

export async function getAllReports(): Promise<StoredReport[]> {
  if (!hasIndexedDB()) {
    return lsReadAll().sort((a, b) => b.timestamp - a.timestamp)
  }
  const db = await openDB()
  try {
    const reports = await new Promise<StoredReport[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => resolve((req.result as StoredReport[]) || [])
      req.onerror = () => reject(req.error)
    })
    return reports.sort((a, b) => b.timestamp - a.timestamp)
  } finally {
    db.close()
  }
}

export async function getReport(attemptId: string): Promise<StoredReport | undefined> {
  if (!hasIndexedDB()) {
    return lsReadAll().find((r) => r.attemptId === attemptId)
  }
  const db = await openDB()
  try {
    return await new Promise<StoredReport | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(attemptId)
      req.onsuccess = () => resolve(req.result as StoredReport | undefined)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

export async function deleteReport(attemptId: string): Promise<void> {
  if (!hasIndexedDB()) {
    lsWriteAll(lsReadAll().filter((r) => r.attemptId !== attemptId))
    return
  }
  const db = await openDB()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(attemptId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } finally {
    db.close()
  }
}
