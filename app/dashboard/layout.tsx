// app\dashboard\layout.tsx  
import type { ReactNode } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Toaster } from "@/components/ui/toaster"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar component */}
      <DashboardSidebar />

      {/* Main content area - no left padding to avoid gap */}
      <main className="flex-1">
        <div className="p-4 md:p-6">{children}</div>
      </main>

      <Toaster />
    </div>
  )
}
