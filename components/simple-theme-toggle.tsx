"use client"

import { useTheme } from "@/components/simple-theme-provider"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? "🌞" : "🌙"}
    </button>
  )
}