// components\auth-guard.tsx  
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated, refreshToken } from "@/lib/auth"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check authentication on client side
    const checkAuth = async () => {
      const isAuth = isAuthenticated()
      console.log("AuthGuard: Authentication check result:", isAuth)

      if (!isAuth) {
        console.log("AuthGuard: Not authenticated, redirecting to login")
        setLoading(false)
        setAuthenticated(false)
        // Use window.location for a full page refresh to clear any state
        window.location.href = "/login"
        return
      }

      // Even if we have a token, try to refresh it
      try {
        const refreshed = await refreshToken()
        if (!refreshed) {
          console.log("AuthGuard: Token refresh failed, redirecting to login")
          setLoading(false)
          setAuthenticated(false)
          // Clear any remaining tokens
          if (typeof window !== "undefined") {
            localStorage.removeItem("adminAccessToken")
            localStorage.removeItem("adminRefreshToken")
          }
          window.location.href = "/login"
          return
        }
      } catch (error) {
        console.error("AuthGuard: Error refreshing token:", error)
        setLoading(false)
        setAuthenticated(false)
        window.location.href = "/login"
        return
      }

      setAuthenticated(true)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  return <>{children}</>
}
