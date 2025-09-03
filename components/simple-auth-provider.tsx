"use client"

import { createContext, useContext, type ReactNode } from "react"

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: false,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ isLoggedIn: false, loading: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
export default AuthProvider