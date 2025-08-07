// components/mobile-responsive-wrapper.tsx
"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

export function MobileResponsiveWrapper({ 
  children, 
  className 
}: MobileResponsiveWrapperProps) {
  return (
    <div className={cn(
      "w-full min-h-screen",
      "px-4 py-4 sm:px-6 sm:py-6 lg:px-8",
      "space-y-4 sm:space-y-6",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileResponsiveHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function MobileResponsiveHeader({
  title,
  description,
  actions,
  className
}: MobileResponsiveHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col space-y-4",
      "sm:flex-row sm:items-center sm:justify-between sm:space-y-0",
      className
    )}>
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

interface MobileResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileResponsiveCard({ 
  children, 
  className 
}: MobileResponsiveCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      "overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileResponsiveTableWrapperProps {
  children: ReactNode;
  minWidth?: string;
}

export function MobileResponsiveTableWrapper({ 
  children, 
  minWidth = "600px" 
}: MobileResponsiveTableWrapperProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth }} className="w-full">
        {children}
      </div>
    </div>
  );
}

interface MobileResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export function MobileResponsiveGrid({
  children,
  cols = { default: 1, sm: 2, lg: 4 },
  gap = "gap-4",
  className
}: MobileResponsiveGridProps) {
  const gridCols = cn(
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  );

  return (
    <div className={cn("grid", gridCols, gap, className)}>
      {children}
    </div>
  );
}

interface MobileResponsiveButtonGroupProps {
  children: ReactNode;
  className?: string;
}

export function MobileResponsiveButtonGroup({ 
  children, 
  className 
}: MobileResponsiveButtonGroupProps) {
  return (
    <div className={cn(
      "flex flex-col space-y-2",
      "sm:flex-row sm:space-y-0 sm:space-x-2",
      className
    )}>
      {children}
    </div>
  );
}