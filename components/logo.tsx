// components/logo.tsx
"use client"

import Image from "next/image"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  width?: number
  height?: number
  showText?: boolean
  collapsed?: boolean
}

export function Logo({ className = "", width = 32, height = 16, showText = true, collapsed = false }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
  }

  const isDark = resolvedTheme === "dark"
  let logoSrc
  
  if (collapsed) {
    logoSrc = isDark ? "/images/rlogodark.png" : "/images/rlogo.png"
  } else {
    logoSrc = isDark ? "/images/namelogo.png" : "/images/namelogodark.png"
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={logoSrc}
        alt="Ranga One Logo"
        width={collapsed ? 32 : width}
        height={height}
        className="object-contain max-w-none"
        style={{ width: collapsed ? 32 : width, height }}
        priority
      />
      {showText && !collapsed && <span className="font-semibold text-foreground">Ranga One</span>}
    </div>
  )
}