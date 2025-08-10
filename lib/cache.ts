// lib/cache.ts
"use client"

export interface CacheConfig {
  ttl?: number // Time to live in milliseconds
  version?: string // Cache version for invalidation
}

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  ttl?: number
  version?: string
}

class CacheManager {
  private prefix = 'rangaone_cache_'
  private defaultTTL = 30 * 60 * 1000 // 30 minutes

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  set<T>(key: string, data: T, config?: CacheConfig): void {
    if (typeof window === 'undefined') return

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: config?.ttl || this.defaultTTL,
      version: config?.version
    }

    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }

  get<T>(key: string, version?: string): T | null {
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(this.getKey(key))
      if (!cached) return null

      const item: CacheItem<T> = JSON.parse(cached)
      
      // Check version mismatch
      if (version && item.version !== version) {
        this.remove(key)
        return null
      }

      // Check TTL
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key)
        return null
      }

      return item.data
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error)
      this.remove(key)
      return null
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.getKey(key))
  }

  clear(): void {
    if (typeof window === 'undefined') return
    
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  // Clean expired items
  cleanup(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const cached = localStorage.getItem(key)
          if (cached) {
            const item: CacheItem = JSON.parse(cached)
            if (item.ttl && Date.now() - item.timestamp > item.ttl) {
              localStorage.removeItem(key)
            }
          }
        } catch (error) {
          localStorage.removeItem(key)
        }
      }
    })
  }
}

export const cache = new CacheManager()

// Specific cache keys
export const CACHE_KEYS = {
  // Page states
  USERS_PAGE_STATE: 'users_page_state',
  PORTFOLIOS_PAGE_STATE: 'portfolios_page_state',
  TIPS_PAGE_STATE: 'tips_page_state',
  BUNDLES_PAGE_STATE: 'bundles_page_state',
  
  // Form states
  USER_FORM_DRAFT: 'user_form_draft',
  PORTFOLIO_FORM_DRAFT: 'portfolio_form_draft',
  TIP_FORM_DRAFT: 'tip_form_draft',
  BUNDLE_FORM_DRAFT: 'bundle_form_draft',
  
  // Navigation state
  SIDEBAR_STATE: 'sidebar_state',
  ACTIVE_TAB: 'active_tab',
  
  // Data cache
  USERS_DATA: 'users_data',
  PORTFOLIOS_DATA: 'portfolios_data',
  TIPS_DATA: 'tips_data',
  BUNDLES_DATA: 'bundles_data',
  
  // Filters and search
  USERS_FILTERS: 'users_filters',
  PORTFOLIOS_FILTERS: 'portfolios_filters',
  TIPS_FILTERS: 'tips_filters',
  BUNDLES_FILTERS: 'bundles_filters',
} as const

// Cache version for invalidation
export const CACHE_VERSION = '1.0.0'