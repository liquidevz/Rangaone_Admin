// components\connection-status.tsx  
"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock, 
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  Radio,
} from "lucide-react"
import { useEffect, useState } from "react"
import { getConnectionStatus, checkApiHealth, type ConnectionStatus } from "@/lib/api-stock-symbols"

interface ConnectionStatusProps {
  className?: string
  compact?: boolean
  showDetails?: boolean
  onReconnect?: () => void
}

export function ConnectionStatusComponent({
  className = "",
  compact = false,
  showDetails = false,
  onReconnect,
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: true,
    lastPing: null,
    latency: 0,
    retryCount: 0,
  })
  const [apiHealth, setApiHealth] = useState<boolean>(true)
  const [isChecking, setIsChecking] = useState(false)
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected')
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  // Check connection status periodically
  useEffect(() => {
    const checkStatus = () => {
      const currentStatus = getConnectionStatus()
      setStatus(currentStatus)
      setLastUpdateTime(new Date())
    }

    // Initial check
    checkStatus()

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  // Check API health periodically
  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true)
      try {
        const health = await checkApiHealth()
        setApiHealth(health)
      } catch (error) {
        setApiHealth(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Initial health check
    checkHealth()

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  const getConnectionBadge = () => {
    if (!status.isConnected || !apiHealth) {
      return (
        <Badge variant="destructive" className="text-xs">
          <WifiOff className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      )
    }

    if (status.latency > 1000) {
      return (
        <Badge variant="outline" className="text-xs bg-yellow-900/20 border-yellow-700 text-yellow-400">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Slow
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs bg-green-900/20 border-green-700 text-green-400">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    )
  }

  const getLatencyColor = () => {
    if (status.latency < 200) return "text-green-400"
    if (status.latency < 500) return "text-yellow-400"
    if (status.latency < 1000) return "text-orange-400"
    return "text-red-400"
  }

  const getLatencyIcon = () => {
    if (status.latency < 200) return <Zap className="h-3 w-3" />
    if (status.latency < 1000) return <Clock className="h-3 w-3" />
    return <AlertTriangle className="h-3 w-3" />
  }

  const formatLastPing = () => {
    if (!status.lastPing) return "Never"
    
    const now = new Date()
    const diffMs = now.getTime() - status.lastPing.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    
    if (diffSecs < 60) return `${diffSecs}s ago`
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
    return status.lastPing.toLocaleTimeString()
  }

  const handleReconnect = async () => {
    setIsChecking(true)
    try {
      await checkApiHealth()
      if (onReconnect) {
        onReconnect()
      }
    } finally {
      setIsChecking(false)
    }
  }

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-2 ${className}`}>
              {status.isConnected && apiHealth ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              {showDetails && (
                <span className={`text-xs ${getLatencyColor()}`}>
                  {status.latency}ms
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-zinc-800 border-zinc-700">
            <div className="text-xs space-y-1">
              <div>Status: {status.isConnected && apiHealth ? "Connected" : "Disconnected"}</div>
              <div>Latency: {status.latency}ms</div>
              <div>Last ping: {formatLastPing()}</div>
              {status.retryCount > 0 && (
                <div>Retries: {status.retryCount}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card className={`border-zinc-800 bg-zinc-900/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-zinc-400" />
            Connection Status
          </div>
          <div className="flex items-center gap-2">
            {getConnectionBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReconnect}
              disabled={isChecking}
              className="h-6 px-2 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* API Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">API Health</span>
          </div>
          <div className="flex items-center gap-2">
            {apiHealth ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-xs ${apiHealth ? 'text-green-400' : 'text-red-400'}`}>
              {apiHealth ? 'Healthy' : 'Unhealthy'}
            </span>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Network Latency */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getLatencyIcon()}
            <span className="text-sm text-zinc-300">Latency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-mono ${getLatencyColor()}`}>
              {status.latency}ms
            </span>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                status.latency < 200 
                  ? 'bg-green-900/20 border-green-700 text-green-400'
                  : status.latency < 500
                  ? 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
                  : 'bg-red-900/20 border-red-700 text-red-400'
              }`}
            >
              {status.latency < 200 ? 'Fast' : status.latency < 500 ? 'Good' : status.latency < 1000 ? 'Slow' : 'Poor'}
            </Badge>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Database Connection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Database</span>
          </div>
          <div className="flex items-center gap-2">
            {status.isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-xs ${status.isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {status.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <Separator className="bg-zinc-800" />

        {/* WebSocket Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">Real-time Feed</span>
          </div>
          <div className="flex items-center gap-2">
            {wsStatus === 'connected' ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : wsStatus === 'connecting' ? (
              <RefreshCw className="h-4 w-4 text-yellow-400 animate-spin" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-xs ${
              wsStatus === 'connected' ? 'text-green-400' : 
              wsStatus === 'connecting' ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {wsStatus === 'connected' ? 'Live' : 
               wsStatus === 'connecting' ? 'Connecting' : 
               wsStatus === 'error' ? 'Error' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Additional Details */}
        {showDetails && (
          <>
            <Separator className="bg-zinc-800" />
            
            <div className="grid grid-cols-2 gap-4 text-xs text-zinc-400">
              <div>
                <div className="font-medium mb-1">Last Ping</div>
                <div className="font-mono">{formatLastPing()}</div>
              </div>
              <div>
                <div className="font-medium mb-1">Retry Count</div>
                <div className="font-mono">{status.retryCount}</div>
              </div>
            </div>

            {lastUpdateTime && (
              <div className="text-xs text-zinc-500 text-center pt-2 border-t border-zinc-800">
                Status updated: {lastUpdateTime.toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {/* Connection Issues Help */}
        {(!status.isConnected || !apiHealth) && (
          <>
            <Separator className="bg-zinc-800" />
            
            <div className="text-xs text-zinc-400 space-y-2">
              <div className="font-medium text-yellow-400">Connection Issues:</div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {!apiHealth && <li>API server is unreachable</li>}
                {!status.isConnected && <li>Database connection failed</li>}
                {status.retryCount > 3 && <li>Multiple retry attempts failed</li>}
              </ul>
              <div className="text-zinc-500 mt-2">
                Try refreshing the page or check your internet connection.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
