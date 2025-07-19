"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Play, Pause, RotateCcw, Settings } from "lucide-react"

interface RealtimeData {
  timestamp: string
  time: string
  [deviceId: string]: any
}

interface RealtimeChartProps {
  devices?: string[]
  datastream?: string
  autoRefresh?: boolean
  refreshInterval?: number
  maxPoints?: number
}

export function RealtimeChart({
  devices = [],
  datastream = "temperature",
  autoRefresh = false,
  refreshInterval = 5000,
  maxPoints = 50
}: RealtimeChartProps) {
  const [data, setData] = useState<RealtimeData[]>([])
  const [isRunning, setIsRunning] = useState(autoRefresh)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [currentMaxPoints, setCurrentMaxPoints] = useState(maxPoints)
  const [fetchLimit, setFetchLimit] = useState(50)
  const [timeRange, setTimeRange] = useState('1h')
  const [dataTimeSpan, setDataTimeSpan] = useState<{ earliest: Date | null, latest: Date | null, count: number }>({
    earliest: null,
    latest: null,
    count: 0
  })

  const fetchLatestData = async () => {
    if (devices.length === 0) return

    try {
      const params = new URLSearchParams({
        devices: devices.join(','),
        datastream,
        limit: fetchLimit.toString(),
        timeRange: timeRange
      })

      const response = await fetch(`/api/analytics/realtime?${params}`)
      if (response.ok) {
        const newData = await response.json()

        setData(prevData => {
          // 在客户端格式化时间显示
          const processedNewData = newData.map((item: any) => ({
            ...item,
            time: new Date(item.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })
          }))

          // 合并新旧数据，保持时间顺序
          const combined = [...prevData, ...processedNewData]
          const unique = combined.filter((item, index, arr) =>
            arr.findIndex(t => t.timestamp === item.timestamp) === index
          )

          // 按时间排序并限制数据点数量
          const sorted = unique.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )

          const limited = sorted.slice(-currentMaxPoints)

          // 计算数据时间跨度
          if (limited.length > 0) {
            const timestamps = limited.map(item => new Date(item.timestamp))
            const earliest = new Date(Math.min(...timestamps.map(t => t.getTime())))
            const latest = new Date(Math.max(...timestamps.map(t => t.getTime())))
            setDataTimeSpan({
              earliest,
              latest,
              count: limited.length
            })
          } else {
            setDataTimeSpan({ earliest: null, latest: null, count: 0 })
          }

          return limited
        })

        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('获取实时数据失败:', error)
    }
  }

  const clearData = () => {
    setData([])
    setLastUpdate(null)
  }

  useEffect(() => {
    if (devices.length > 0) {
      // 清除旧数据，重新获取
      setData([])
      fetchLatestData()
    }
  }, [devices, datastream, timeRange, fetchLimit])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && devices.length > 0) {
      interval = setInterval(fetchLatestData, refreshInterval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, devices, datastream, refreshInterval])

  const getDeviceColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1']
    return colors[index % colors.length]
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>实时数据监控</CardTitle>
            <CardDescription>
              {datastream} - {devices.length} 个设备的实时数据流
              {lastUpdate && (
                <span className="block text-xs text-gray-500 mt-1">
                  最后更新: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 时间范围选择器 */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">时间范围:</Label>
              <Select
                value={timeRange}
                onValueChange={setTimeRange}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10m">10分钟</SelectItem>
                  <SelectItem value="30m">30分钟</SelectItem>
                  <SelectItem value="1h">1小时</SelectItem>
                  <SelectItem value="6h">6小时</SelectItem>
                  <SelectItem value="24h">24小时</SelectItem>
                  <SelectItem value="7d">7天</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 数据范围显示 */}
            {dataTimeSpan.count > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>实际范围:</span>
                <span>
                  {dataTimeSpan.earliest && dataTimeSpan.latest && (
                    <>
                      {Math.round((dataTimeSpan.latest.getTime() - dataTimeSpan.earliest.getTime()) / (1000 * 60))}分钟
                      ({dataTimeSpan.count}点)
                    </>
                  )}
                </span>
              </div>
            )}

            {/* 数据点数量选择器 */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">显示点数:</Label>
              <Select
                value={currentMaxPoints.toString()}
                onValueChange={(value) => setCurrentMaxPoints(Number(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                  <SelectItem value="1000">1000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 获取数量选择器 */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-gray-600">获取数量:</Label>
              <Select
                value={fetchLimit.toString()}
                onValueChange={(value) => setFetchLimit(Number(value))}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={clearData}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={isRunning}
                onCheckedChange={setIsRunning}
              />
              <Label htmlFor="auto-refresh" className="text-sm">
                {isRunning ? (
                  <div className="flex items-center gap-1">
                    <Pause className="w-3 h-3" />
                    自动刷新
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    暂停
                  </div>
                )}
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">无数据</div>
              <div className="text-sm">选择设备和数据流开始监控</div>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  labelFormatter={(value) => `时间: ${value}`}
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : value,
                    name
                  ]}
                />
                <Legend />
                {devices.map((deviceId, index) => (
                  <Line
                    key={deviceId}
                    type="monotone"
                    dataKey={deviceId}
                    stroke={getDeviceColor(index)}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name={deviceId}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 数据点计数 */}
        <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
          <span>数据点: {data.length}/{currentMaxPoints}</span>
          <div className="flex gap-4">
            <span>获取限制: {fetchLimit}</span>
            <span>刷新间隔: {refreshInterval/1000}秒</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
