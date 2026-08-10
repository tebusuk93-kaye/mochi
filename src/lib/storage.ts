import type { AppData } from '../types'

const STORAGE_KEY = 'mochi-production-data'

export const defaultData: AppData = {
  settings: { jpyToCad: 0.0092 },
  supplies: [],
  fixedAssets: [],
  recipes: [],
  importedProducts: [],
  production: [],
  sales: [],
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultData }
    const parsed = JSON.parse(raw) as AppData
    return { ...defaultData, ...parsed }
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
