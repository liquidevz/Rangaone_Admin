// app\dashboard\layout.tsx  
import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeToggle } from "@/components/theme-toggle"
import { CacheStatus } from "@/components/cache-status"
import { Logo } from "@/components/logo"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar component */}
      <DashboardSidebar />

      {/* Main content area - responsive to sidebar state */}
      <main className="flex-1 min-w-0 overflow-x-hidden bg-background">
        {/* Global fixed header */}
        <header className="fixed top-0 left-[var(--sidebar-width,240px)] right-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div>
            <div className="flex items-center justify-between gap-2 py-3 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8">
              <div className="flex items-center">
                <Logo width={140} height={28} showText={false} className="min-w-0" />
              </div>
              <div className="flex items-center gap-2">
                <CacheStatus />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
        {/* Content with header offset */}
        <div className="pt-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1600px]">
            {children}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  )
}
