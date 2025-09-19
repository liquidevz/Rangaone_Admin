// hooks/use-page-state.ts
"use client"

import { useCallback, useEffect, useState } from 'react'
import { useCache } from '@/components/cache-provider'
import { useRouter, useSearchParams } from 'next/navigation'

interface UsePageStateOptions {
  pageName: string
  defaultState?: Record<string, any>
  syncWithUrl?: boolean
}

interface PageStateHook<T = Record<string, any>> {
  state: T
  updateState: (updates: Partial<T>) => void
  resetState: () => void
  isLoading: boolean
}

export function usePageState<T extends Record<string, any> = Record<string, any>>({
  pageName,
  defaultState = {},
  syncWithUrl = false
}: UsePageStateOptions): PageStateHook<T> {
  const { savePageState, getPageState } = useCache()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [state, setState] = useState<T>(defaultState as T)

  // Initialize state from cache and URL
  useEffect(() => {
    const cachedState = getPageState(pageName)
    let initialState = { ...defaultState }

    // Merge cached state
    if (cachedState) {
      initialState = { ...initialState, ...cachedState }
    }

    // Merge URL params if enabled
    if (syncWithUrl && searchParams) {
      const urlParams: Record<string, any> = {}
      searchParams.forEach((value, key) => {
        // Try to parse as JSON, fallback to string
        try {
          urlParams[key] = JSON.parse(value)
        } catch {
          urlParams[key] = value
        }
      })
      initialState = { ...initialState, ...urlParams }
    }

    setState(initialState as T)
    setIsLoading(false)
  }, [pageName, syncWithUrl]) // Removed unstable dependencies

  const updateState = useCallback((updates: Partial<T>) => {
    setState(prevState => {
      const newState = { ...prevState, ...updates }
      
      // Save to cache
      savePageState(pageName, newState)
      
      // Update URL if enabled
      if (syncWithUrl) {
        const params = new URLSearchParams()
        Object.entries(newState).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.set(key, typeof value === 'string' ? value : JSON.stringify(value))
          }
        })
        
        const newUrl = `${window.location.pathname}?${params.toString()}`
        router.replace(newUrl, { scroll: false })
      }
      
      return newState
    })
  }, [pageName, savePageState, syncWithUrl, router])

  const resetState = useCallback(() => {
    setState(defaultState as T)
    savePageState(pageName, defaultState)
    
    if (syncWithUrl) {
      router.replace(window.location.pathname, { scroll: false })
    }
  }, [defaultState, pageName, savePageState, syncWithUrl, router])

  return {
    state,
    updateState,
    resetState,
    isLoading
  }
}