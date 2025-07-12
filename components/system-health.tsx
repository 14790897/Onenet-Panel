"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Server, Clock } from "lucide-react"

interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  timestamp: string
  database: {
    connected: boolean
    tableExists: boolean
  }
  stats?: {
    total_records: number
    unique_devices: number
    unique_datastreams: number
    latest_record?: string
    oldest_record?: string
  }
  environment: {
    nodeEnv: string
    hasDbUrl: boolean
  }
  error?: string
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (error) {
      console.error('Failed to fetch health status:', error)
      setHealth({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: { connected: false, tableExists: false },
        environment: { nodeEnv: 'unknown', hasDbUrl: false },
        error: 'Failed to fetch health status'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // 每30秒自动刷新一次
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status === 'healthy' ? '正常' : status === 'warning' ? '警告' : '错误'}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loading text="检查系统状态..." />
        </CardContent>
      </Card>
    )
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            系统状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            无法获取系统状态
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            <CardTitle>系统状态</CardTitle>
            {getStatusIcon(health.status)}
            {getStatusBadge(health.status)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
        <CardDescription>
          最后更新: {new Date(health.timestamp).toLocaleString('zh-CN')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 数据库状态 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">数据库连接</span>
            </div>
            {health.database.connected ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm">数据表状态</span>
            </div>
            {health.database.tableExists ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>

        {/* 统计信息 */}
        {health.stats && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">数据统计</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">总记录数:</span>
                <span className="font-medium">{health.stats.total_records.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">设备数:</span>
                <span className="font-medium">{health.stats.unique_devices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">数据流数:</span>
                <span className="font-medium">{health.stats.unique_datastreams}</span>
              </div>
            </div>
            {health.stats.latest_record && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                最新记录: {new Date(health.stats.latest_record).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {health.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{health.error}</p>
          </div>
        )}

        {/* 环境信息 */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>环境: {health.environment.nodeEnv}</span>
            <span>DB配置: {health.environment.hasDbUrl ? '已配置' : '未配置'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
