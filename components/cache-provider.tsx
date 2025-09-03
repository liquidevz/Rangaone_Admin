// components/cache-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { cache, CACHE_KEYS, CACHE_VERSION } from '@/lib/cache'

interface PageState {
  scrollPosition?: number
  selectedItems?: string[]
  searchQuery?: string
  filters?: Record<string, any>
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  currentPage?: number
  pageSize?: number
}

interface FormDraft {
  formData: Record<string, any>
  timestamp: number
}

interface CacheContextType {
  // Page state management
  savePageState: (page: string, state: PageState) => void
  getPageState: (page: string) => PageState | null
  
  // Form draft management
  saveFormDraft: (formType: string, data: Record<string, any>) => void
  getFormDraft: (formType: string) => Record<string, any> | null
  clearFormDraft: (formType: string) => void
  
  // Data caching
  cacheData: <T>(key: string, data: T, ttl?: number) => void
  getCachedData: <T>(key: string) => T | null
  invalidateCache: (key: string) => void
  
  // Navigation state
  saveSidebarState: (isCollapsed: boolean) => void
  getSidebarState: () => boolean | null
  saveActiveTab: (page: string, tab: string) => void
  getActiveTab: (page: string) => string | null
  
  // Cleanup
  clearAllCache: () => void
}

const CacheContext = createContext<CacheContextType | null>(null)

export function CacheProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Cleanup expired cache on initialization
    cache.cleanup()
    setIsInitialized(true)

    // Set up periodic cleanup
    const cleanupInterval = setInterval(() => {
      cache.cleanup()
    }, 5 * 60 * 1000) // Every 5 minutes

    return () => clearInterval(cleanupInterval)
  }, [mounted])

  const savePageState = (page: string, state: PageState) => {
    cache.set(`${CACHE_KEYS.USERS_PAGE_STATE}_${page}`, state, {
      ttl: 60 * 60 * 1000, // 1 hour
      version: CACHE_VERSION
    })
  }

  const getPageState = (page: string): PageState | null => {
    return cache.get(`${CACHE_KEYS.USERS_PAGE_STATE}_${page}`, CACHE_VERSION)
  }

  const saveFormDraft = (formType: string, data: Record<string, any>) => {
    const draft: FormDraft = {
      formData: data,
      timestamp: Date.now()
    }
    cache.set(`${CACHE_KEYS.USER_FORM_DRAFT}_${formType}`, draft, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      version: CACHE_VERSION
    })
  }

  const getFormDraft = (formType: string): Record<string, any> | null => {
    const draft = cache.get<FormDraft>(`${CACHE_KEYS.USER_FORM_DRAFT}_${formType}`, CACHE_VERSION)
    return draft?.formData || null
  }

  const clearFormDraft = (formType: string) => {
    cache.remove(`${CACHE_KEYS.USER_FORM_DRAFT}_${formType}`)
  }

  const cacheData = <T,>(key: string, data: T, ttl?: number) => {
    cache.set(key, data, {
      ttl: ttl || 15 * 60 * 1000, // Default 15 minutes
      version: CACHE_VERSION
    })
  }

  const getCachedData = <T,>(key: string): T | null => {
    return cache.get<T>(key, CACHE_VERSION)
  }

  const invalidateCache = (key: string) => {
    cache.remove(key)
  }

  const saveSidebarState = (isCollapsed: boolean) => {
    cache.set(CACHE_KEYS.SIDEBAR_STATE, { isCollapsed }, {
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
      version: CACHE_VERSION
    })
  }

  const getSidebarState = (): boolean | null => {
    const state = cache.get<{ isCollapsed: boolean }>(CACHE_KEYS.SIDEBAR_STATE, CACHE_VERSION)
    return state?.isCollapsed ?? null
  }

  const saveActiveTab = (page: string, tab: string) => {
    cache.set(`${CACHE_KEYS.ACTIVE_TAB}_${page}`, { tab }, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      version: CACHE_VERSION
    })
  }

  const getActiveTab = (page: string): string | null => {
    const state = cache.get<{ tab: string }>(`${CACHE_KEYS.ACTIVE_TAB}_${page}`, CACHE_VERSION)
    return state?.tab || null
  }

  const clearAllCache = () => {
    cache.clear()
  }

  const contextValue: CacheContextType = {
    savePageState,
    getPageState,
    saveFormDraft,
    getFormDraft,
    clearFormDraft,
    cacheData,
    getCachedData,
    invalidateCache,
    saveSidebarState,
    getSidebarState,
    saveActiveTab,
    getActiveTab,
    clearAllCache
  }

  if (!mounted || !isInitialized) {
    return null // or a loading spinner
  }

  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}