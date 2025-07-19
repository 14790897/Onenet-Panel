"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Trash2, Database, AlertTriangle, CheckCircle, Info } from "lucide-react"

interface DatabaseStats {
  total_records: number
  device_count: number
  datastream_count: number
  earliest_record: string
  latest_record: string
  table_size: string
}

interface AutoCompressionStats {
  originalRecords: number
  compressedRecords: number
  lastCompressionTime: string | null
  nextCompressionTime: string
  compressionInterval: string
  compressionDelay: string
  compressionGranularity: string
}

interface CleanupPreview {
  totalRecords: number
  recordsToDelete: number
  recordsToKeep: number
  earliestDeleteDate: string
  latestDeleteDate: string
  cutoffDate: string
}

export default function DatabaseCleanupPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [autoStats, setAutoStats] = useState<AutoCompressionStats | null>(null)
  const [preview, setPreview] = useState<CleanupPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)
  const [maxRecords, setMaxRecords] = useState(10000)
  const [compressDays, setCompressDays] = useState(7)
  const [intervalHours, setIntervalHours] = useState(1)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  useEffect(() => {
    fetchStats()
    fetchAutoCompressionStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/cleanup')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  const fetchAutoCompressionStats = async () => {
    try {
      const response = await fetch('/api/admin/auto-compression')
      const data = await response.json()
      if (data.success) {
        setAutoStats(data.stats)
      }
    } catch (error) {
      console.error('获取自动压缩统计失败:', error)
    }
  }

  const previewCleanup = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/cleanup?action=preview&days=${days}`)
      const data = await response.json()
      if (data.success) {
        setPreview(data.preview)
        setMessage({ type: 'info', text: '预览完成，请确认删除操作' })
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '预览失败' })
    }
    setLoading(false)
  }

  const executeCleanup = async (action: string) => {
    if (!confirm('确定要执行此清理操作吗？此操作不可撤销！')) {
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        action,
        days: days.toString(),
        max_records: maxRecords.toString(),
        compress_days: compressDays.toString(),
        interval_hours: intervalHours.toString()
      })
      
      const response = await fetch(`/api/admin/cleanup?${params}`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchStats() // 刷新统计
        setPreview(null) // 清除预览
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '清理操作失败' })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Database className="h-6 w-6" />
        <h1 className="text-2xl font-bold">数据库空间管理</h1>
      </div>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-500' : message.type === 'success' ? 'border-green-500' : 'border-blue-500'}>
          {message.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : 
           message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : 
           <Info className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* 数据库统计 */}
      <Card>
        <CardHeader>
          <CardTitle>数据库使用情况</CardTitle>
          <CardDescription>当前数据库的存储统计信息</CardDescription>
        </CardHeader>
        <CardContent>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.total_records.toLocaleString()}</div>
                <div className="text-sm text-gray-600">总记录数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.device_count}</div>
                <div className="text-sm text-gray-600">设备数量</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.datastream_count}</div>
                <div className="text-sm text-gray-600">数据流数量</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{stats.table_size}</div>
                <div className="text-sm text-gray-600">表大小</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{new Date(stats.earliest_record).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">最早记录</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium">{new Date(stats.latest_record).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">最新记录</div>
              </div>
            </div>
          ) : (
            <div>加载统计信息中...</div>
          )}
        </CardContent>
      </Card>

      {/* 自动压缩状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            自动压缩状态
          </CardTitle>
          <CardDescription>每30分钟自动压缩30分钟前的数据</CardDescription>
        </CardHeader>
        <CardContent>
          {autoStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{autoStats.originalRecords.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">原始记录</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{autoStats.compressedRecords.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">压缩记录</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {autoStats.lastCompressionTime
                      ? new Date(autoStats.lastCompressionTime).toLocaleString()
                      : '未执行'
                    }
                  </div>
                  <div className="text-sm text-gray-600">上次压缩</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {new Date(autoStats.nextCompressionTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">下次压缩</div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border">
                <div className="text-sm space-y-1">
                  <div><strong>压缩策略:</strong> {autoStats.compressionGranularity}聚合</div>
                  <div><strong>压缩延迟:</strong> {autoStats.compressionDelay}</div>
                  <div><strong>检查间隔:</strong> {autoStats.compressionInterval}</div>
                </div>
              </div>

              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/admin/auto-compression?action=manual_compress', {
                      method: 'POST'
                    })
                    const data = await response.json()
                    if (data.success) {
                      setMessage({ type: 'success', text: data.message })
                      fetchStats()
                      fetchAutoCompressionStats()
                    } else {
                      setMessage({ type: 'error', text: data.error })
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: '手动压缩失败' })
                  }
                  setLoading(false)
                }}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? '压缩中...' : '手动触发压缩'}
              </Button>
            </div>
          ) : (
            <div>加载自动压缩状态中...</div>
          )}
        </CardContent>
      </Card>

      {/* 清理选项 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 按时间清理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              按时间清理
            </CardTitle>
            <CardDescription>删除指定天数之前的历史数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="days">保留天数</Label>
              <Input
                id="days"
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
                className="mt-1"
              />
              <div className="text-sm text-gray-600 mt-1">
                将删除 {days} 天前的所有数据
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={previewCleanup} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                预览清理效果
              </Button>
              
              {preview && (
                <div className="bg-yellow-50 p-3 rounded border">
                  <div className="text-sm space-y-1">
                    <div>📊 总记录数: <Badge variant="outline">{preview.totalRecords.toLocaleString()}</Badge></div>
                    <div>🗑️ 将删除: <Badge variant="destructive">{preview.recordsToDelete.toLocaleString()}</Badge></div>
                    <div>✅ 将保留: <Badge variant="secondary">{preview.recordsToKeep.toLocaleString()}</Badge></div>
                    <div className="text-xs text-gray-600 mt-2">
                      删除截止时间: {new Date(preview.cutoffDate).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => executeCleanup('cleanup_by_date')} 
                disabled={loading || !preview}
                variant="destructive"
                className="w-full"
              >
                {loading ? '清理中...' : '执行时间清理'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 按数量清理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              按数量清理
            </CardTitle>
            <CardDescription>只保留最新的N条记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxRecords">保留记录数</Label>
              <Input
                id="maxRecords"
                type="number"
                value={maxRecords}
                onChange={(e) => setMaxRecords(parseInt(e.target.value) || 10000)}
                min="1000"
                max="100000"
                className="mt-1"
              />
              <div className="text-sm text-gray-600 mt-1">
                只保留最新的 {maxRecords.toLocaleString()} 条记录
              </div>
            </div>
            
            <Button 
              onClick={() => executeCleanup('cleanup_by_count')} 
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? '清理中...' : '执行数量清理'}
            </Button>
          </CardContent>
        </Card>

        {/* 数据压缩 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              数据压缩
            </CardTitle>
            <CardDescription>将老数据压缩为平均值，保留趋势减少空间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="compressDays">压缩天数前的数据</Label>
              <Input
                id="compressDays"
                type="number"
                value={compressDays}
                onChange={(e) => setCompressDays(parseInt(e.target.value) || 7)}
                min="1"
                max="90"
                className="mt-1"
              />
              <div className="text-sm text-gray-600 mt-1">
                压缩 {compressDays} 天前的数据
              </div>
            </div>

            <div>
              <Label htmlFor="intervalHours">压缩间隔（小时）</Label>
              <Input
                id="intervalHours"
                type="number"
                value={intervalHours}
                onChange={(e) => setIntervalHours(parseInt(e.target.value) || 1)}
                min="1"
                max="24"
                className="mt-1"
              />
              <div className="text-sm text-gray-600 mt-1">
                每 {intervalHours} 小时的数据压缩为一个平均值
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded border">
              <div className="text-sm space-y-1">
                <div className="font-medium text-blue-800">压缩效果预估：</div>
                <div className="text-blue-700">
                  • 保留数据趋势和统计信息
                </div>
                <div className="text-blue-700">
                  • 空间减少约 {Math.round((intervalHours * 60 - 1) / (intervalHours * 60) * 100)}%
                </div>
                <div className="text-blue-700">
                  • 包含平均值、最小值、最大值
                </div>
              </div>
            </div>

            <Button
              onClick={() => executeCleanup('compress_old_data')}
              disabled={loading}
              variant="secondary"
              className="w-full"
            >
              {loading ? '压缩中...' : '执行数据压缩'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 其他清理选项 */}
      <Card>
        <CardHeader>
          <CardTitle>其他清理选项</CardTitle>
          <CardDescription>额外的数据库优化操作</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => executeCleanup('cleanup_duplicates')} 
              disabled={loading}
              variant="outline"
            >
              删除重复数据
            </Button>
            <Button 
              onClick={() => executeCleanup('vacuum')} 
              disabled={loading}
              variant="outline"
            >
              数据库优化
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 警告信息 */}
      <Alert className="border-red-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>重要提醒：</strong>数据删除操作不可撤销！请在执行前确保已备份重要数据。
          建议先使用"预览清理效果"功能确认删除范围。
        </AlertDescription>
      </Alert>
    </div>
  )
}
