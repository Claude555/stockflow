"use client"

import { createContext, useContext, useEffect, useState } from "react"

interface StoreSettings {
  storeName: string
  storeEmail?: string
  storePhone?: string
  storeAddress?: string
  currency: string
  taxRate: number
  receiptFooter?: string
}

const StoreContext = createContext<StoreSettings>({
  storeName: "StockFlow",
  currency: "KES",
  taxRate: 0,
})

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "StockFlow",
    currency: "KES",
    taxRate: 0,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch("/api/settings/store")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Failed to fetch store settings:", error)
    }
  }

  return (
    <StoreContext.Provider value={settings}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)