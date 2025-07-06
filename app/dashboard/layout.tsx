// app\dashboard\layout.tsx  
import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Sidebar component */}
      <DashboardSidebar />

      {/* Main content area - responsive to sidebar state */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="container mx-auto px-6 py-6 max-w-[1600px]">
          {children}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
