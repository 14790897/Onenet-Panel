"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Calendar, HardDrive, Filter, Download, RotateCcw } from "lucide-react"
import { DateRange } from "react-day-picker"
import { addDays } from "date-fns"
import { RealtimeChart } from "@/components/realtime-chart"
import { useAnalyticsPreferences } from "@/lib/analytics-preferences"

interface DeviceData {
  id: number
  device_id: string
  datastream_id: string
  value: number
  created_at: string
  raw_data: any
}

interface ChartDataPoint {
  timestamp: string
  time: string
  [key: string]: any // 动态设备数据
}

interface DeviceInfo {
  device_id: string
  device_name?: string
  datastreams: string[]
  latest_value?: number
  latest_time?: string
}

export default function AnalyticsPage() {
  const [devices, setDevices] = useState<DeviceInfo[]>([]) // 确保初始化为空数组
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]) // 确保初始化为空数组
  const [selectedDatastream, setSelectedDatastream] = useState<string>("")
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]) // 确保初始化为空数组
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })
  const [dataInterval, setDataInterval] = useState<string>("auto") // 数据间隔
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  
  const { savePreferences, loadPreferences, clearPreferences } = useAnalyticsPreferences()

  // 恢复用户偏好设置
  useEffect(() => {
    const preferences = loadPreferences()
    if (preferences) {
      if (preferences.selectedDevices && preferences.selectedDevices.length > 0) {
        setSelectedDevices(preferences.selectedDevices)
      }
      if (preferences.selectedDatastream) {
        setSelectedDatastream(preferences.selectedDatastream)
      }
      if (preferences.dateRange) {
        setDateRange({
          from: new Date(preferences.dateRange.from),
          to: new Date(preferences.dateRange.to)
        })
      }
    }
    setPreferencesLoaded(true)
  }, [])

  // 保存当前偏好设置
  const saveCurrentPreferences = () => {
    savePreferences({
      selectedDevices: selectedDevices.length > 0 ? selectedDevices : undefined,
      selectedDatastream: selectedDatastream || undefined,
      dateRange: dateRange ? {
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || ''
      } : undefined
    })
  }

  // 重置偏好设置
  const resetPreferences = () => {
    clearPreferences()
    setSelectedDevices([])
    setSelectedDatastream("")
    setDateRange({
      from: addDays(new Date(), -7),
      to: new Date(),
    })
    setChartData([])
  }

  // 安全的数值处理函数
  const safeNumber = (value: any): number => {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // 安全的数值格式化函数
  const safeToFixed = (value: any, digits: number = 2): string => {
    const num = safeNumber(value);
    return num.toFixed(digits);
  }

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/analytics/devices')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setDevices(data)
        } else {
          setDevices([]) // 确保始终为数组
          console.error('设备列表数据格式错误:', data)
        }
      } else {
        setDevices([]) // 确保始终为数组
        console.error('获取设备列表失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('获取设备列表失败:', error)
      setDevices([]) // 确保始终为数组
    }
  }

  // 获取对比数据
  const fetchComparisonData = async () => {
    if (selectedDevices.length === 0 || !selectedDatastream || !dateRange?.from || !dateRange?.to) {
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        devices: selectedDevices.join(','),
        datastream: selectedDatastream,
        start_date: dateRange.from.toISOString(),
        end_date: dateRange.to.toISOString(),
        interval: dataInterval, // 添加数据间隔参数
      })

      const response = await fetch(`/api/analytics/comparison?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setChartData(data)
        } else {
          setChartData([]) // 确保始终为数组
          console.error('对比数据格式错误:', data)
        }
      } else {
        setChartData([]) // 确保始终为数组
        console.error('获取对比数据失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('获取对比数据失败:', error)
      setChartData([]) // 确保始终为数组
    } finally {
      setLoading(false)
    }
  }

  // 处理设备选择
  const handleDeviceSelect = (deviceId: string, checked: boolean) => {
    let newSelectedDevices;
    if (checked) {
      newSelectedDevices = [...selectedDevices, deviceId];
    } else {
      newSelectedDevices = selectedDevices.filter(id => id !== deviceId);
    }
    setSelectedDevices(newSelectedDevices);
    
    // 保存偏好设置
    savePreferences({
      selectedDevices: newSelectedDevices.length > 0 ? newSelectedDevices : undefined,
      selectedDatastream: selectedDatastream || undefined,
      dateRange: dateRange ? {
        from: dateRange.from?.toISOString() || '',
        to: dateRange.to?.toISOString() || ''
      } : undefined
    });
  }

  // 获取所有可用的数据流
  const getAllDatastreams = () => {
    const datastreams = new Set<string>()
    if (Array.isArray(devices)) {
      devices.forEach(device => {
        if (device.datastreams && Array.isArray(device.datastreams)) {
          device.datastreams.forEach(ds => datastreams.add(ds))
        }
      })
    }
    return Array.from(datastreams)
  }

  // 生成图表颜色
  const getDeviceColor = (index: number) => {
    const colors = [
      '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', 
      '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'
    ]
    return colors[index % colors.length]
  }

  // 导出数据
  const exportData = () => {
    if (chartData.length === 0) return

    const csv = [
      ['时间', ...selectedDevices].join(','),
      ...chartData.map(item => [
        item.timestamp,
        ...selectedDevices.map(deviceId => item[deviceId] || '')
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `device_comparison_${selectedDatastream}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    if (selectedDevices.length > 0 && selectedDatastream && dateRange?.from && dateRange?.to) {
      fetchComparisonData()
    }
  }, [selectedDevices, selectedDatastream, dateRange, dataInterval])

  const allDatastreams = getAllDatastreams()

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">设备数据分析</h1>
            <p className="text-gray-600 mt-1">多设备数据对比和趋势分析</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/data">
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                数据查看
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                返回首页
              </Button>
            </Link>
            <Button 
              onClick={resetPreferences} 
              variant="outline" 
              size="sm"
              title="重置分析偏好"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
            <Button onClick={exportData} disabled={chartData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </Button>
          </div>
        </div>

        {/* 筛选控制 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
            <CardDescription>
              选择要对比的设备、数据流和时间范围
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 时间范围选择 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                时间范围
              </Label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>

            {/* 数据流选择 */}
            <div className="space-y-2">
              <Label>数据流类型</Label>
              <Select value={selectedDatastream} onValueChange={(value) => {
                setSelectedDatastream(value);
                savePreferences({
                  selectedDevices: selectedDevices.length > 0 ? selectedDevices : undefined,
                  selectedDatastream: value || undefined,
                  dateRange: dateRange ? {
                    from: dateRange.from?.toISOString() || '',
                    to: dateRange.to?.toISOString() || ''
                  } : undefined
                });
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择数据流类型" />
                </SelectTrigger>
                <SelectContent>
                  {allDatastreams.map((datastream) => (
                    <SelectItem key={datastream} value={datastream}>
                      {datastream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 数据间隔选择 */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                数据间隔
              </Label>
              <Select value={dataInterval} onValueChange={setDataInterval}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择数据间隔" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动 (智能采样)</SelectItem>
                  <SelectItem value="1m">1分钟</SelectItem>
                  <SelectItem value="5m">5分钟</SelectItem>
                  <SelectItem value="15m">15分钟</SelectItem>
                  <SelectItem value="30m">30分钟</SelectItem>
                  <SelectItem value="1h">1小时</SelectItem>
                  <SelectItem value="3h">3小时</SelectItem>
                  <SelectItem value="6h">6小时</SelectItem>
                  <SelectItem value="12h">12小时</SelectItem>
                  <SelectItem value="1d">1天</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                选择较大间隔可提高图表性能，减少数据点数量
              </div>
            </div>

            {/* 设备选择 */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                设备选择 ({selectedDevices.length} 个设备)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                {devices.map((device) => (
                  <div key={device.device_id} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <Checkbox
                      id={device.device_id}
                      checked={selectedDevices.includes(device.device_id)}
                      onCheckedChange={(checked) => 
                        handleDeviceSelect(device.device_id, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={device.device_id}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {device.device_name || device.device_id}
                      </label>
                      <div className="text-xs text-gray-500">
                        {device.device_id}
                      </div>
                      {device.latest_value !== undefined && (
                        <div className="text-xs text-blue-600">
                          最新: {device.latest_value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button 
                onClick={fetchComparisonData} 
                disabled={loading || selectedDevices.length === 0 || !selectedDatastream}
                className="flex-1"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {loading ? '分析中...' : '开始分析'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setSelectedDevices([])
                  setSelectedDatastream("")
                  setChartData([])
                }}
              >
                清空选择
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 图表展示 */}
        {selectedDevices.length > 0 && selectedDatastream && (
          <div className="grid grid-cols-1 gap-6">
            {/* 实时监控图表 */}
            <RealtimeChart
              devices={selectedDevices}
              datastream={selectedDatastream}
              autoRefresh={true}
              refreshInterval={5000}
              maxPoints={200}
            />

            {/* 历史数据分析 - 只有在有历史数据时显示 */}
            {chartData.length > 0 && (
              <>
                {/* 折线图 - 趋势对比 */}
                <Card>
                  <CardHeader>
                    <CardTitle>历史趋势对比图</CardTitle>
                    <CardDescription>
                      {selectedDatastream} - {selectedDevices.length} 个设备的历史数据趋势对比
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="time" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            labelFormatter={(value) => {
                              // 如果value是时间戳，格式化为本地时间
                              if (typeof value === 'string' && value.includes('T')) {
                                return `时间: ${new Date(value).toLocaleString('zh-CN', {
                                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}`
                              }
                              return `时间: ${value}`
                            }}
                            formatter={(value: any, name: string) => [
                              safeToFixed(value, 2),
                              devices.find(d => d.device_id === name)?.device_name || name
                            ]}
                          />
                          <Legend />
                          {selectedDevices.map((deviceId, index) => (
                            <Line
                              key={deviceId}
                              type="monotone"
                              dataKey={deviceId}
                              stroke={getDeviceColor(index)}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              name={devices.find(d => d.device_id === deviceId)?.device_name || deviceId}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 统计分析图表 */}
                <Card>
                  <CardHeader>
                    <CardTitle>统计分析</CardTitle>
                    <CardDescription>
                      选定时间范围内各设备的统计数据对比
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedDevices.map(deviceId => {
                          const deviceData = chartData.filter(item => item[deviceId] != null)
                          const numericValues = deviceData.map(item => safeNumber(item[deviceId]))
                          const average = numericValues.length > 0 
                            ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
                            : 0
                          const max = numericValues.length > 0 ? Math.max(...numericValues) : 0
                          const min = numericValues.length > 0 ? Math.min(...numericValues) : 0
                          
                          return {
                            device: devices.find(d => d.device_id === deviceId)?.device_name || deviceId,
                            deviceId,
                            average: safeNumber(average),
                            max: safeNumber(max),
                            min: safeNumber(min),
                            count: deviceData.length
                          }
                        })}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="device" 
                            tick={{ fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              safeToFixed(value, 2),
                              name === 'average' ? '平均值' : 
                              name === 'max' ? '最大值' : 
                              name === 'min' ? '最小值' : name
                            ]}
                            labelFormatter={(label) => `设备: ${label}`}
                          />
                          <Legend />
                          <Bar dataKey="average" fill="#8884d8" name="平均值" />
                          <Bar dataKey="max" fill="#82ca9d" name="最大值" />
                          <Bar dataKey="min" fill="#ffc658" name="最小值" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 数据统计表 */}
                <Card>
                  <CardHeader>
                    <CardTitle>详细统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">设备</th>
                            <th className="text-left p-2">设备ID</th>
                            <th className="text-left p-2">数据点数</th>
                            <th className="text-left p-2">平均值</th>
                            <th className="text-left p-2">最大值</th>
                            <th className="text-left p-2">最小值</th>
                            <th className="text-left p-2">变化范围</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDevices.map(deviceId => {
                            const deviceData = chartData.filter(item => item[deviceId] != null)
                            if (deviceData.length === 0) return null

                            const numericValues = deviceData.map(item => safeNumber(item[deviceId]))
                            const average = numericValues.length > 0 
                              ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length 
                              : 0
                            const max = numericValues.length > 0 ? Math.max(...numericValues) : 0
                            const min = numericValues.length > 0 ? Math.min(...numericValues) : 0
                            const range = max - min

                            return (
                              <tr key={deviceId} className="border-b hover:bg-gray-50">
                                <td className="p-2 font-medium">
                                  {devices.find(d => d.device_id === deviceId)?.device_name || deviceId}
                                </td>
                                <td className="p-2">
                                  <Badge variant="outline">{deviceId}</Badge>
                                </td>
                                <td className="p-2">{deviceData.length}</td>
                                <td className="p-2 font-mono">{safeToFixed(average)}</td>
                                <td className="p-2 font-mono text-red-600">{safeToFixed(max)}</td>
                                <td className="p-2 font-mono text-blue-600">{safeToFixed(min)}</td>
                                <td className="p-2 font-mono">{safeToFixed(range)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* 空状态 */}
        {selectedDevices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">开始数据分析</h3>
              <p className="text-gray-600">
                选择设备、数据流类型和时间范围，开始进行多设备数据对比分析
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
