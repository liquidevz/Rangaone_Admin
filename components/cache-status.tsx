// components/cache-status.tsx
"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useCache } from '@/components/cache-provider'
import { Database, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CacheStats {
  totalItems: number
  totalSize: string
  oldestItem: string | null
  newestItem: string | null
}

export function CacheStatus() {
  const { clearAllCache } = useCache()
  const { toast } = useToast()
  const [stats, setStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: '0 KB',
    oldestItem: null,
    newestItem: null
  })

  const calculateCacheStats = () => {
    if (typeof window === 'undefined') return

    let totalItems = 0
    let totalSize = 0
    let oldestTimestamp = Date.now()
    let newestTimestamp = 0
    let oldestKey = null
    let newestKey = null

    const prefix = 'rangaone_cache_'
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        totalItems++
        const value = localStorage.getItem(key)
        if (value) {
          totalSize += value.length
          
          try {
            const parsed = JSON.parse(value)
            if (parsed.timestamp) {
              if (parsed.timestamp < oldestTimestamp) {
                oldestTimestamp = parsed.timestamp
                oldestKey = key.replace(prefix, '')
              }
              if (parsed.timestamp > newestTimestamp) {
                newestTimestamp = parsed.timestamp
                newestKey = key.replace(prefix, '')
              }
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    })

    setStats({
      totalItems,
      totalSize: `${Math.round(totalSize / 1024)} KB`,
      oldestItem: oldestKey,
      newestItem: newestKey
    })
  }

  useEffect(() => {
    calculateCacheStats()
    
    // Update stats every 30 seconds
    const interval = setInterval(calculateCacheStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleClearCache = () => {
    clearAllCache()
    calculateCacheStats()
    toast({
      title: "Cache cleared",
      description: "All cached data has been removed.",
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Database className="h-4 w-4 mr-1" />
          <Badge variant="secondary" className="text-xs">
            {stats.totalItems}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Cache Status</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={calculateCacheStats}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-medium">{stats.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Size:</span>
              <span className="font-medium">{stats.totalSize}</span>
            </div>
            {stats.oldestItem && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oldest:</span>
                <span className="font-medium text-xs truncate max-w-32" title={stats.oldestItem}>
                  {stats.oldestItem}
                </span>
              </div>
            )}
            {stats.newestItem && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Newest:</span>
                <span className="font-medium text-xs truncate max-w-32" title={stats.newestItem}>
                  {stats.newestItem}
                </span>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearCache}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}