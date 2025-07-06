// components\dashboard-sidebar.tsx  
"use client"

import type React from "react"
import { useState, createContext, useContext } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, FileText, Home, Menu, Settings, Users, X, Lightbulb, Briefcase, CreditCard, Package, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Context for sidebar state
const SidebarContext = createContext<{
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

interface SidebarItem {
  title: string
  href: string
  icon: React.ElementType
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Portfolios",
    href: "/dashboard/portfolios",
    icon: Briefcase,
  },
  {
    title: "Bundles",
    href: "/dashboard/bundles",
    icon: Package,
  },
  {
    title: "Tips",
    href: "/dashboard/tips",
    icon: Lightbulb,
  },
  {
    title: "Stock Symbols",
    href: "/dashboard/stock-symbols",
    icon: BarChart,
  },
  {
    title: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {/* Mobile header - full width */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background z-40 flex items-center px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
            <div className="flex flex-col h-full">
              <div className="flex h-16 items-center px-6 border-b">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold"
                  onClick={() => setOpen(false)}
                >
                  <FileText className="h-6 w-6" />
                  <span>Ranga One Wealth</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 overflow-auto py-4">
                <ul className="grid gap-1 px-2">
                  {sidebarItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                          pathname === item.href ? "bg-accent text-accent-foreground" : "transparent",
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@rangaonewealth.com</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <FileText className="h-6 w-6" />
          <span>Ranga One Wealth</span>
        </Link>
      </header>

      {/* Desktop Sidebar - collapsible */}
      <aside className={cn("hidden md:block shrink-0 transition-all duration-300", isCollapsed ? "w-[72px]" : "w-[240px]")}>
        <div className={cn(
          "fixed inset-y-0 left-0 bg-zinc-950 h-full z-20 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-[72px]" : "w-[240px]"
        )}>
          {/* Collapse Button */}
          <div className="h-[48px] flex items-center justify-center bg-zinc-900">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
          </div>

          {/* Logo Section */}
          <div className="flex h-[60px] items-center px-4">
            <Link href="/dashboard" className={cn("flex items-center gap-2 font-semibold transition-opacity", isCollapsed && "opacity-0")}>
              <FileText className="h-6 w-6 shrink-0 text-white" />
              {!isCollapsed && <span className="text-white">Ranga One Wealth</span>}
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <ul className="grid gap-1 px-2">
              {sidebarItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      pathname === item.href 
                        ? "bg-zinc-900 text-white" 
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/50",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      pathname === item.href ? "text-white" : "text-zinc-400"
                    )} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="p-4">
            <div className={cn(
              "flex items-center gap-3 transition-all rounded-lg p-2 bg-zinc-900/50",
              isCollapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-zinc-400" />
              </div>
              {!isCollapsed && (
                <div>
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-zinc-400">admin@rangaonewealth.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-0 bg-zinc-950 border-zinc-800">
          <div className="flex flex-col h-full">
            <div className="flex h-[60px] items-center px-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                <FileText className="h-6 w-6" />
                <span>Ranga One Wealth</span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-zinc-400 hover:text-white hover:bg-zinc-900" 
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 overflow-auto py-4">
              <ul className="grid gap-1 px-2">
                {sidebarItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        pathname === item.href 
                          ? "bg-zinc-900 text-white" 
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <item.icon className={cn(
                        "h-5 w-5",
                        pathname === item.href ? "text-white" : "text-zinc-400"
                      )} />
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4">
              <div className="flex items-center gap-3 rounded-lg p-2 bg-zinc-900/50">
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Users className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Admin User</p>
                  <p className="text-xs text-zinc-400">admin@rangaonewealth.com</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile padding for header */}
      <div className="h-[60px] md:hidden" />
    </SidebarContext.Provider>
  )
}
