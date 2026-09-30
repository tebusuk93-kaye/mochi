import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppData } from '../types'
import { defaultData, loadData, saveData } from '../lib/storage'

interface AppContextValue {
  data: AppData
  hydrated: boolean
  updateData: (updater: (prev: AppData) => AppData) => void
  replaceData: (data: AppData) => void
  resetData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setData(loadData())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveData(data)
  }, [data, hydrated])

  const updateData = (updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev))
  }

  const replaceData = (next: AppData) => setData(next)

  const resetData = () => setData({ ...defaultData })

  return (
    <AppContext.Provider value={{ data, updateData, replaceData, resetData, hydrated }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
