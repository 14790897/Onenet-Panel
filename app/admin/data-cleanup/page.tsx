"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Trash2, Database, Clock, TrendingDown, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

interface DataStats {
  original: {
    lastHour: number
    lastDay: number
    lastWeek: number
    total: number
  }
  compressed: {
    lastHour: number
    lastDay: number
    lastWeek: number
    total: number
  }
  cleanupThreshold: string
}

interface CleanupResult {
  success: boolean
  deletedRows: number
  compressedRows: number
  stats: {
    originalRecordsBeforeCleanup: number
    originalRecordsAfterCleanup: number
    compressedRecords: number
    cleanupThreshold: string
  }
}

export default function DataCleanupPage() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [needsCleanup, setNeedsCleanup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [lastCleanupResult, setLastCleanupResult] = useState<CleanupResult | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/data-cleanup')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setNeedsCleanup(data.needsCleanup)
      }
    } catch (error) {
      console.error('获取数据清理状态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const performCleanup = async (force = false) => {
    try {
      setCleaning(true)
      const url = force ? '/api/admin/data-cleanup?force=true' : '/api/admin/data-cleanup'
      const response = await fetch(url, { method: 'POST' })
      
      if (response.ok) {
        const data = await response.json()
        if (data.result) {
          setLastCleanupResult(data.result)
        }
        // 重新获取统计信息
        await fetchStats()
      } else {
        console.error('数据清理失败')
      }
    } catch (error) {
      console.error('执行数据清理失败:', error)
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  const calculateCompressionRatio = () => {
    if (!stats) return 0
    const total = stats.original.total + stats.compressed.total
    return total > 0 ? (stats.compressed.total / total) * 100 : 0
  }

  const getOldDataCount = () => {
    if (!stats) return 0
    return stats.original.total - stats.original.lastHour
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">数据清理管理</h1>
            <p className="text-gray-600 mt-1">管理数据压缩和清理，优化存储性能</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => fetchStats()} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新状态
            </Button>
            <Link href="/admin">
              <Button variant="outline">
                返回管理
              </Button>
            </Link>
          </div>
        </div>

        {/* 状态概览 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">原始数据</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.original.total)}</div>
                <p className="text-xs text-muted-foreground">
                  最近1小时: {formatNumber(stats.original.lastHour)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">压缩数据</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.compressed.total)}</div>
                <p className="text-xs text-muted-foreground">
                  压缩比: {calculateCompressionRatio().toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待清理数据</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(getOldDataCount())}</div>
                <p className="text-xs text-muted-foreground">
                  超过1小时的原始数据
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">清理状态</CardTitle>
                {needsCleanup ? (
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {needsCleanup ? (
                    <Badge variant="destructive">需要清理</Badge>
                  ) : (
                    <Badge variant="default">状态良好</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  清理阈值: 1小时前
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 清理操作 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              数据清理操作
            </CardTitle>
            <CardDescription>
              清理超过1小时的原始数据，将其压缩存储以优化性能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsCleanup && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  检测到 {formatNumber(getOldDataCount())} 条旧数据需要清理。建议执行数据清理以优化性能。
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button 
                onClick={() => performCleanup(false)} 
                disabled={cleaning || !needsCleanup}
                className="flex-1"
              >
                {cleaning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    清理中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    智能清理
                  </>
                )}
              </Button>
              
              <Button 
                onClick={() => performCleanup(true)} 
                disabled={cleaning}
                variant="outline"
              >
                {cleaning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    强制清理中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    强制清理
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <p><strong>智能清理:</strong> 只在检测到旧数据时执行清理</p>
              <p><strong>强制清理:</strong> 无论是否需要都执行清理操作</p>
            </div>
          </CardContent>
        </Card>

        {/* 最近清理结果 */}
        {lastCleanupResult && (
          <Card>
            <CardHeader>
              <CardTitle>最近清理结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">压缩行数</div>
                  <div className="text-lg font-semibold">{formatNumber(lastCleanupResult.compressedRows)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">删除行数</div>
                  <div className="text-lg font-semibold">{formatNumber(lastCleanupResult.deletedRows)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">清理前原始数据</div>
                  <div className="text-lg font-semibold">{formatNumber(lastCleanupResult.stats.originalRecordsBeforeCleanup)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">清理后原始数据</div>
                  <div className="text-lg font-semibold">{formatNumber(lastCleanupResult.stats.originalRecordsAfterCleanup)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 数据分布详情 */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle>数据分布详情</CardTitle>
              <CardDescription>
                按时间范围查看数据分布情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">原始数据分布</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">最近1小时</div>
                      <div className="font-semibold">{formatNumber(stats.original.lastHour)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">最近1天</div>
                      <div className="font-semibold">{formatNumber(stats.original.lastDay)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">最近1周</div>
                      <div className="font-semibold">{formatNumber(stats.original.lastWeek)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">总计</div>
                      <div className="font-semibold">{formatNumber(stats.original.total)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">压缩数据分布</h4>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">最近1小时</div>
                      <div className="font-semibold">{formatNumber(stats.compressed.lastHour)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">最近1天</div>
                      <div className="font-semibold">{formatNumber(stats.compressed.lastDay)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">最近1周</div>
                      <div className="font-semibold">{formatNumber(stats.compressed.lastWeek)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">总计</div>
                      <div className="font-semibold">{formatNumber(stats.compressed.total)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
