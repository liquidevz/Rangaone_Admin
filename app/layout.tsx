// app\layout.tsx  
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { CacheProvider } from "@/components/cache-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Rangaone Admin",
  description: "Admin panel for stock management system",
    generator: 'Liquidata'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <CacheProvider>
              {children}
            </CacheProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
