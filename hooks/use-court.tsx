import React, { createContext, useContext, useState, ReactNode } from 'react'

interface CourtContextValue {
  court: string
  setCourt: (value: string) => void
}

const CourtContext = createContext<CourtContextValue | undefined>(undefined)

export function CourtProvider({ children }: { children: ReactNode }) {
  const [court, setCourt] = useState('TRF2')

  return (
    <CourtContext.Provider value={{ court, setCourt }}>
      {children}
    </CourtContext.Provider>
  )
}

export function useCourt(): CourtContextValue {
  const context = useContext(CourtContext)
  if (!context) {
    throw new Error('useCourt must be used within a CourtProvider')
  }
  return context
}
