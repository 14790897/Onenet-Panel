"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, Clock } from "lucide-react"

interface LongTermData {
  timestamp: string
  time: string
  [key: string]: any // 动态设备数据
}

interface LongTermTrendChartProps {
  devices: string[]
  datastream: string
}

export function LongTermTrendChart({ devices, datastream }: LongTermTrendChartProps) {
  const [data, setData] = useState<LongTermData[]>([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('30d') // 默认30天
  const [interval, setInterval] = useState('6h') // 默认6小时间隔
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // 时间范围选项
  const timeRangeOptions = [
    { value: '7d', label: '最近7天', interval: '2h' },
    { value: '15d', label: '最近15天', interval: '4h' },
    { value: '30d', label: '最近30天', interval: '6h' },
    { value: '60d', label: '最近60天', interval: '12h' },
    { value: '90d', label: '最近90天', interval: '1d' }
  ]

  // 间隔选项
  const intervalOptions = [
    { value: '1h', label: '1小时' },
    { value: '2h', label: '2小时' },
    { value: '4h', label: '4小时' },
    { value: '6h', label: '6小时' },
    { value: '12h', label: '12小时' },
    { value: '1d', label: '1天' }
  ]

  // 获取长期趋势数据
  const fetchLongTermData = async () => {
    if (devices.length === 0 || !datastream) return

    try {
      setLoading(true)
      
      // 计算时间范围
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '15d':
          startDate.setDate(endDate.getDate() - 15)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '60d':
          startDate.setDate(endDate.getDate() - 60)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        default:
          startDate.setDate(endDate.getDate() - 30)
      }

      const params = new URLSearchParams({
        devices: devices.join(','),
        datastream,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        interval: interval
      })

      console.log('🔄 获取长期趋势数据:', { 
        devices, 
        datastream, 
        timeRange, 
        interval,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      const response = await fetch(`/api/analytics/comparison?${params}`)
      if (response.ok) {
        const newData = await response.json()
        console.log('📊 长期趋势数据:', newData.length, '条记录')
        
        if (Array.isArray(newData)) {
          // 格式化时间显示
          const processedData = newData.map((item: any) => ({
            ...item,
            time: formatTimeForDisplay(new Date(item.timestamp), timeRange)
          }))
          
          setData(processedData)
          setLastUpdate(new Date())
        } else {
          setData([])
          console.error('长期趋势数据格式错误:', newData)
        }
      } else {
        console.error('获取长期趋势数据失败:', response.status, response.statusText)
        setData([])
      }
    } catch (error) {
      console.error('获取长期趋势数据失败:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // 根据时间范围格式化时间显示
  const formatTimeForDisplay = (date: Date, range: string): string => {
    if (range === '7d' || range === '15d') {
      // 短期：显示月日和小时
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } else if (range === '30d' || range === '60d') {
      // 中期：显示月日
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } else {
      // 长期：只显示月日
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    }
  }

  // 处理时间范围变化
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)
    
    // 自动调整推荐的间隔
    const option = timeRangeOptions.find(opt => opt.value === newTimeRange)
    if (option) {
      setInterval(option.interval)
    }
  }

  // 生成图表颜色
  const getDeviceColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
      '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'
    ]
    return colors[index % colors.length]
  }

  // 当设备或数据流变化时重新获取数据
  useEffect(() => {
    if (devices.length > 0 && datastream) {
      fetchLongTermData()
    }
  }, [devices, datastream, timeRange, interval])

  if (devices.length === 0 || !datastream) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              长期趋势分析
            </CardTitle>
            <CardDescription>
              {datastream} - 最近{timeRangeOptions.find(opt => opt.value === timeRange)?.label}的数据趋势 ({interval}间隔)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                更新于: {lastUpdate.toLocaleTimeString('zh-CN')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLongTermData}
              disabled={loading}
            >
              {loading ? '加载中...' : '刷新'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 控制面板 */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500">
            数据点: {data.length} 个
          </div>
        </div>

        {/* 图表 */}
        {loading ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">加载中...</div>
              <div className="text-sm">正在获取长期趋势数据</div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-lg mb-2">暂无数据</div>
              <div className="text-sm">选定时间范围内没有找到数据</div>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 10 }}
                  interval={Math.max(Math.floor(data.length / 8), 1)}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelFormatter={(value, payload) => {
                    if (payload && payload.length > 0 && payload[0].payload.timestamp) {
                      const fullDate = new Date(payload[0].payload.timestamp)
                      return `时间: ${fullDate.toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      })}`
                    }
                    return `时间: ${value}`
                  }}
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
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
