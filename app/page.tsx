"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getAdminAccessToken } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    setMounted(true);
    const token = getAdminAccessToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);
  
  if (!mounted) return null;
  
  const isDark = theme === 'dark';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Image  
            src={isDark ? "/images/namelogo.png" : "/images/namelogodark.png"}
            alt="Ranga One Wealth"
            width={200}
            height={50}
            className="h-8 w-auto"
            priority
          />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            The Admin Platform for
            <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Wealth Management</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Build and manage investment portfolios, distribute expert tips, and handle user subscriptions with our comprehensive admin dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Start Managing
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything you need to manage wealth</h2>
          <p className="text-muted-foreground text-lg">Powerful tools for portfolio management and client engagement</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-blue-600 rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Portfolio Management</h3>
            <p className="text-muted-foreground">
              Create, track, and optimize investment portfolios with real-time market data and performance analytics.
            </p>
          </div>
          <div className="p-8 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-green-600 rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Investment Tips</h3>
            <p className="text-muted-foreground">
              Distribute expert investment recommendations and market insights to your clients with rich formatting.
            </p>
          </div>
          <div className="p-8 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-purple-600 rounded" />
            </div>
            <h3 className="text-xl font-semibold mb-2">User Management</h3>
            <p className="text-muted-foreground">
              Handle client subscriptions, access control, and user engagement with comprehensive admin tools.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 Ranga One Wealth. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
