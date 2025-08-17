// components\dashboard-sidebar.tsx  
"use client"

import type React from "react"
import { useState, createContext, useContext, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart, FileText, Home, Menu, Settings, Users, X, Lightbulb, Briefcase, CreditCard, Package, ChevronLeft, Bot, TrendingUp, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { useCache } from "@/components/cache-provider"

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
    title: "Price History",
    href: "/dashboard/price-history",
    icon: TrendingUp,
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
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Mail,
  },
  {
    title: "Bot Manager",
    href: "/dashboard/bot",
    icon: Bot,
  },
  {
    title: "FAQs",
    href: "/dashboard/faqs",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { saveSidebarState, getSidebarState } = useCache()
  const [open, setOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load sidebar state from cache on mount
  useEffect(() => {
    const cachedState = getSidebarState()
    if (cachedState !== null) {
      setIsCollapsed(cachedState)
    }
  }, [getSidebarState])

  // Reflect sidebar width as a CSS variable for layouts to consume
  useEffect(() => {
    const width = isCollapsed ? '72px' : '240px'
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--sidebar-width', width)
    }
  }, [isCollapsed])

  // Save sidebar state when it changes
  const handleToggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    saveSidebarState(newState)
  }

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
            <div className="flex flex-col h-full bg-sidebar-background">
              <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 font-semibold text-sidebar-foreground"
                  onClick={() => setOpen(false)}
                >
                  <Logo width={120} height={32} showText={false} className="text-sidebar-foreground" />
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground" onClick={() => setOpen(false)}>
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
                            ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                        )}
                        onClick={() => setOpen(false)}
                      >
                        <item.icon className={cn(
                          "h-5 w-5",
                          pathname === item.href ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"
                        )} />
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                    <Users className="h-5 w-5 text-sidebar-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
                    <p className="text-xs text-sidebar-foreground/60">admin@rangaone.finance</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
          <Logo width={120} height={32} showText={false} />
        </Link>
      </header>

      {/* Desktop Sidebar - collapsible */}
      <aside className={cn("hidden md:block shrink-0 transition-all duration-300", isCollapsed ? "w-[72px]" : "w-[240px]")}>
        <div className={cn(
          "fixed inset-y-0 left-0 bg-sidebar-background border-r border-sidebar-border h-full z-20 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-[72px]" : "w-[240px]"
        )}>
          {/* Logo Section */}
          <div className="flex h-[60px] items-center px-4 border-b border-sidebar-border">
            <Link href="/dashboard" className={cn(
              "flex items-center gap-2 font-semibold transition-all",
              isCollapsed ? "justify-center" : "px-2"
            )}>
              <Logo 
                width={isCollapsed ? 32 : 120} 
                height={32} 
                showText={false} 
                collapsed={isCollapsed}
                className="text-sidebar-foreground" 
              />
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
                        ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      isCollapsed && "justify-center px-2"
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      pathname === item.href ? "text-sidebar-accent-foreground" : "text-sidebar-foreground"
                    )} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className={cn(
              "flex items-center gap-3 rounded-lg p-2 bg-sidebar-accent/50",
              isCollapsed && "justify-center"
            )}>
              <div className="h-9 w-9 shrink-0 rounded-full bg-sidebar-accent flex items-center justify-center">
                <Users className="h-5 w-5 text-sidebar-accent-foreground" />
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
                  <p className="text-xs text-sidebar-foreground/60">admin@rangaone.com</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="h-6 w-6 rounded hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <ChevronLeft className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}
