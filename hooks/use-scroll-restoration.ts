// hooks/use-scroll-restoration.ts
"use client"

import { useEffect, useRef } from 'react'
import { useCache } from '@/components/cache-provider'

interface UseScrollRestorationOptions {
  key: string
  enabled?: boolean
  debounceMs?: number
}

export function useScrollRestoration({
  key,
  enabled = true,
  debounceMs = 100
}: UseScrollRestorationOptions) {
  const { cacheData, getCachedData } = useCache()
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLElement | null>(null)

  // Save scroll position
  const saveScrollPosition = (element: HTMLElement) => {
    if (!enabled) return
    
    const scrollData = {
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft,
      timestamp: Date.now()
    }
    
    cacheData(`scroll_${key}`, scrollData, 60 * 60 * 1000) // Cache for 1 hour
  }

  // Restore scroll position
  const restoreScrollPosition = (element: HTMLElement) => {
    if (!enabled) return
    
    const scrollData = getCachedData<{
      scrollTop: number
      scrollLeft: number
      timestamp: number
    }>(`scroll_${key}`)
    
    if (scrollData) {
      // Only restore if the data is recent (within 1 hour)
      const isRecent = Date.now() - scrollData.timestamp < 60 * 60 * 1000
      if (isRecent) {
        element.scrollTop = scrollData.scrollTop
        element.scrollLeft = scrollData.scrollLeft
      }
    }
  }

  // Set up scroll listener with debouncing
  useEffect(() => {
    const element = containerRef.current
    if (!element || !enabled) return

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        saveScrollPosition(element)
      }, debounceMs)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    
    // Restore scroll position on mount
    const restoreTimeout = setTimeout(() => {
      restoreScrollPosition(element)
    }, 100) // Small delay to ensure content is loaded

    return () => {
      element.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      clearTimeout(restoreTimeout)
    }
  }, [key, enabled, debounceMs])

  return {
    containerRef,
    saveScrollPosition: () => {
      if (containerRef.current) {
        saveScrollPosition(containerRef.current)
      }
    },
    restoreScrollPosition: () => {
      if (containerRef.current) {
        restoreScrollPosition(containerRef.current)
      }
    }
  }
}