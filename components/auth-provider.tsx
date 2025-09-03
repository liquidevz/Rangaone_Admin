// components\auth-provider.tsx  
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, refreshToken } from "@/lib/auth"

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const checkAuth = async () => {


      // Skip auth check for public pages
      if (pathname === "/login" || pathname === "/") {
        setLoading(false)
        setIsLoggedIn(false)
        return
      }

      // Check if user is authenticated
      const authenticated = isAuthenticated()


      if (!authenticated) {
        // If not authenticated, redirect to login

        setIsLoggedIn(false)
        setLoading(false)
        router.push("/login")
        return
      }

      try {
        // Try to refresh the token, but don't immediately redirect on failure
        const refreshed = await refreshToken()
        if (!refreshed) {

          // Clear any remaining tokens
          if (typeof window !== "undefined") {
            localStorage.removeItem("adminAccessToken")
            localStorage.removeItem("adminRefreshToken")
          }
          setIsLoggedIn(false)
          setLoading(false)
          // Use window.location for a full page refresh to clear any state
          window.location.href = "/login"
          return
        } else {

          setIsLoggedIn(true)
        }
      } catch (error) {

        // Don't redirect here, let the API calls handle auth failures
        setIsLoggedIn(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Set up a timer to refresh the token periodically (every 5 minutes)
    const refreshInterval = setInterval(
      async () => {
        if (isAuthenticated()) {

          try {
            const refreshed = await refreshToken()
            if (!refreshed) {

              // Don't redirect here, let the next API call handle it
            }
          } catch (error) {

          }
        }
      },
      5 * 60 * 1000, // 5 minutes
    )

    return () => clearInterval(refreshInterval)
  }, [mounted, pathname, router])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  const contextValue: AuthContextType = {
    isLoggedIn,
    loading
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export { AuthContext }
