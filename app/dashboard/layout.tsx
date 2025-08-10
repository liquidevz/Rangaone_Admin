// app\dashboard\layout.tsx  
import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"
import { CacheStatus } from "@/components/cache-status"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar component */}
      <DashboardSidebar />

      {/* Main content area - responsive to sidebar state */}
      <main className="flex-1 min-w-0 overflow-x-hidden bg-background">
        {/* Mobile: Top padding for fixed header, responsive container with better mobile spacing */}
        <div className="pt-16 md:pt-0">
          {/* Theme toggle and cache status in top right */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <CacheStatus />
            <ThemeToggle />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px]">
            {children}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
