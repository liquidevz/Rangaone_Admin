"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"

interface AuthCheckProps {
  children: React.ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log("User not authenticated, redirecting to login")
      router.push("/login")
    }
  }, [router])

  if (!isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}