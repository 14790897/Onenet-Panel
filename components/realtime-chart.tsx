"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Play, Pause, RotateCcw } from "lucide-react"

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

  const fetchLatestData = async () => {
    if (devices.length === 0) return

    try {
      const params = new URLSearchParams({
        devices: devices.join(','),
        datastream,
        limit: '20'
      })

      const response = await fetch(`/api/analytics/realtime?${params}`)
      if (response.ok) {
        const newData = await response.json()
        
        setData(prevData => {
          // 合并新旧数据，保持时间顺序
          const combined = [...prevData, ...newData]
          const unique = combined.filter((item, index, arr) => 
            arr.findIndex(t => t.timestamp === item.timestamp) === index
          )
          
          // 按时间排序并限制数据点数量
          const sorted = unique.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          
          return sorted.slice(-maxPoints)
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
      fetchLatestData()
    }
  }, [devices, datastream])

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
          <div className="flex items-center gap-2">
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
                    typeof value === 'number' ? value.toFixed(2) : value,
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
          <span>数据点: {data.length}/{maxPoints}</span>
          <span>刷新间隔: {refreshInterval/1000}秒</span>
        </div>
      </CardContent>
    </Card>
  )
}
