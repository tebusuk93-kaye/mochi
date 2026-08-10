import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppData } from '../types'
import { defaultData, loadData, saveData } from '../lib/storage'

interface AppContextValue {
  data: AppData
  updateData: (updater: (prev: AppData) => AppData) => void
  resetData: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData)

  useEffect(() => {
    setData(loadData())
  }, [])

  useEffect(() => {
    saveData(data)
  }, [data])

  const updateData = (updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev))
  }

  const resetData = () => setData({ ...defaultData })

  return (
    <AppContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
