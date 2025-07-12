"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loading } from "@/components/ui/loading"
import { RefreshCw, Trash2, Server, Database, MemoryStick, Clock } from "lucide-react"

interface CacheStats {
  cacheSize: number
  cachedKeys: string[]
  memoryUsage: string
  timestamp: string
}

export function AdminPanel() {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  const fetchCacheStats = async () => {
    try {
      const response = await fetch('/api/cache')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCacheStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to fetch cache stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      setClearing(true)
      const response = await fetch('/api/cache', { method: 'DELETE' })
      if (response.ok) {
        await fetchCacheStats() // 重新获取统计信息
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchCacheStats()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            <CardTitle>系统管理</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCacheStats}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
              disabled={clearing}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {clearing ? '清理中...' : '清空缓存'}
            </Button>
          </div>
        </div>
        <CardDescription>
          系统缓存和性能监控
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loading text="加载系统信息..." />
        ) : cacheStats ? (
          <div className="space-y-4">
            {/* 缓存统计 */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <MemoryStick className="w-4 h-4" />
                缓存统计
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between p-2 border rounded">
                  <span className="text-gray-600">缓存项数:</span>
                  <Badge variant="secondary">{cacheStats.cacheSize}</Badge>
                </div>
                <div className="flex justify-between p-2 border rounded">
                  <span className="text-gray-600">内存使用:</span>
                  <Badge variant="outline">{cacheStats.memoryUsage}</Badge>
                </div>
                <div className="flex justify-between p-2 border rounded col-span-2 md:col-span-1">
                  <span className="text-gray-600">更新时间:</span>
                  <span className="text-xs text-gray-500">
                    {new Date(cacheStats.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 缓存键列表 */}
            {cacheStats.cachedKeys.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">缓存键列表</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {cacheStats.cachedKeys.map((key, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-100 p-1 rounded">
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 系统提示 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Clock className="w-4 h-4" />
                <span>缓存会自动过期，数据统计缓存1分钟，设备列表缓存2分钟</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            无法获取系统信息
          </div>
        )}
      </CardContent>
    </Card>
  )
}
