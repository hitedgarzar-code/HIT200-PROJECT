'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import SplashScreen from './SplashScreen'

interface SplashContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  showSplash: boolean
}

const SplashContext = createContext<SplashContextType | undefined>(undefined)

export function SplashProvider({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Only show splash on first load
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('splash-seen')
    if (hasSeenSplash) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('splash-seen', 'true')
  }

  return (
    <SplashContext.Provider value={{ isLoading, setIsLoading, showSplash }}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {children}
    </SplashContext.Provider>
  )
}

export function useSplash() {
  const context = useContext(SplashContext)
  if (context === undefined) {
    throw new Error('useSplash must be used within SplashProvider')
  }
  return context
}
