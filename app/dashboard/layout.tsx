// app\dashboard\layout.tsx  
import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar component */}
      <DashboardSidebar />

      {/* Main content area - responsive to sidebar state */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>

      <Toaster />
    </div>
  )
}
