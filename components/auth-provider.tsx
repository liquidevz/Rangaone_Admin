// components\auth-provider.tsx  
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isAuthenticated, refreshToken } from "@/lib/auth"

interface AuthContextType {
  isLoggedIn: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
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
  }, [pathname, router])

  return <AuthContext.Provider value={{ isLoggedIn, loading }}>{children}</AuthContext.Provider>
}

export { AuthContext }
