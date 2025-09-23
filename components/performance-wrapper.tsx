'use client'

import { memo, Suspense } from 'react'

export const PerformanceWrapper = memo(({ children }: { children: React.ReactNode }) => {
  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
})

PerformanceWrapper.displayName = 'PerformanceWrapper'