'use client'

import { createContext, useContext } from 'react'

const AuthReadyContext = createContext(true)
export const useAuthReady = () => useContext(AuthReadyContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthReadyContext.Provider value={true}>
      {children}
    </AuthReadyContext.Provider>
  )
}
