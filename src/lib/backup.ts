import type { AppData } from '../types'
import { migrateData } from './storage'

export const BACKUP_VERSION = 1
export const BACKUP_APP_ID = 'mochi-production-dashboard'

export interface BackupFile {
  version: number
  exportedAt: string
  app: string
  data: AppData
}

export function createBackupFile(data: AppData): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP_ID,
    data,
  }
}

export function serializeBackup(data: AppData): string {
  return JSON.stringify(createBackupFile(data), null, 2)
}

export function parseBackupJson(raw: string): AppData {
  const parsed = JSON.parse(raw) as BackupFile | AppData

  if (parsed && typeof parsed === 'object' && 'app' in parsed && parsed.app === BACKUP_APP_ID && 'data' in parsed) {
    return migrateData(parsed.data)
  }

  return migrateData(parsed as Partial<AppData>)
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    map.set(item.id, item)
  }
  return Array.from(map.values())
}

export function mergeAppData(current: AppData, incoming: AppData): AppData {
  return {
    settings: incoming.settings,
    supplies: mergeById(current.supplies, incoming.supplies),
    fixedAssets: mergeById(current.fixedAssets, incoming.fixedAssets),
    recipes: mergeById(current.recipes, incoming.recipes),
    importedProducts: mergeById(current.importedProducts, incoming.importedProducts),
    production: mergeById(current.production, incoming.production),
    sales: mergeById(current.sales, incoming.sales),
  }
}

export function backupFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `mochi-backup-${date}.json`
}

export function downloadBackup(data: AppData): void {
  const blob = new Blob([serializeBackup(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = backupFilename()
  link.click()
  URL.revokeObjectURL(url)
}

export async function shareBackup(data: AppData): Promise<boolean> {
  const file = new File([serializeBackup(data)], backupFilename(), { type: 'application/json' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'Mochi Production Backup',
      text: 'Backup of my mochi production dashboard data',
      files: [file],
    })
    return true
  }
  return false
}
