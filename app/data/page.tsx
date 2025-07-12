"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Database, TrendingUp, Activity, Settings, RotateCcw } from "lucide-react"
import { SmartValueDisplay } from "@/components/smart-value-display"
import { useDataViewPreferences } from "@/lib/data-view-preferences"

interface OneNetDataRecord {
  id: number
  device_id: string
  datastream_id: string
  value: number
  raw_data: any
  created_at: string
}

export default function DataView() {
  const [data, setData] = useState<OneNetDataRecord[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  
  const { savePreferences, loadPreferences, clearPreferences } = useDataViewPreferences()

  // 恢复用户偏好设置
  useEffect(() => {
    const preferences = loadPreferences()
    if (preferences) {
      if (preferences.selectedDevice) {
        setSelectedDevice(preferences.selectedDevice)
      }
      if (preferences.activeTab) {
        setActiveTab(preferences.activeTab)
      }
    }
    setPreferencesLoaded(true)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/data')
      if (response.ok) {
        const result = await response.json()
        if (result.success && Array.isArray(result.data)) {
          setData(result.data)
        } else {
          setData([]) // 确保始终为数组
          console.error('获取数据失败:', result.error || '数据格式错误')
        }
      } else {
        setData([]) // 确保始终为数组
        console.error('获取数据失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
      setData([]) // 确保始终为数组
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/data/stats')
      if (response.ok) {
        const result = await response.json()
        setStats(result)
      } else {
        console.error('获取统计失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('获取统计失败:', error)
    }
  }

  const fetchDeviceData = async (deviceId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/data/device/${deviceId}`)
      if (response.ok) {
        const result = await response.json()
        if (Array.isArray(result)) {
          setData(result)
        } else {
          setData([]) // 确保始终为数组
          console.error('获取设备数据失败: 数据格式错误')
        }
      } else {
        setData([]) // 确保始终为数组
        console.error('获取设备数据失败，状态码:', response.status)
      }
    } catch (error) {
      console.error('获取设备数据失败:', error)
      setData([]) // 确保始终为数组
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 等待偏好设置加载完成后再获取数据
    if (!preferencesLoaded) return
    
    if (selectedDevice && activeTab === "device") {
      fetchDeviceData(selectedDevice)
    } else {
      fetchData()
    }
    fetchStats()
  }, [preferencesLoaded, selectedDevice, activeTab])

  // 保存用户偏好设置
  const saveCurrentPreferences = () => {
    savePreferences({
      selectedDevice: selectedDevice || undefined,
      activeTab
    })
  }

  // 清除偏好设置
  const resetPreferences = () => {
    clearPreferences()
    setSelectedDevice("")
    setActiveTab("all")
    fetchData()
  }

  const uniqueDevices = Array.from(new Set((Array.isArray(data) ? data : []).map(item => item.device_id)))

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const formatRawData = (rawData: any) => {
    if (!rawData) return 'N/A'
    
    // 显示重要信息
    const info = []
    if (rawData.deviceName) info.push(`设备名: ${rawData.deviceName}`)
    if (rawData.messageType) info.push(`消息类型: ${rawData.messageType}`)
    if (rawData.originalValue !== undefined) info.push(`原始值: ${rawData.originalValue}`)
    
    return info.length > 0 ? info.join(', ') : JSON.stringify(rawData).substring(0, 100) + '...'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OneNET 数据监控</h1>
            <p className="text-gray-600 mt-1">实时查看接收到的OneNET推送数据</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/analytics">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                数据分析
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <Button 
              onClick={resetPreferences} 
              variant="outline" 
              size="sm"
              title="重置查看偏好"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
            <Button onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新数据
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">总记录数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_records}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">设备数量</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.unique_devices}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">数据流数量</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.unique_datastreams}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">最新数据</p>
                    <p className="text-sm font-bold text-gray-900">
                      {stats.latest_timestamp ? formatTimestamp(stats.latest_timestamp) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value)
          savePreferences({ activeTab: value, selectedDevice })
        }} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">所有数据</TabsTrigger>
              <TabsTrigger value="device">按设备查看</TabsTrigger>
            </TabsList>
            
            {/* 偏好设置状态指示 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {selectedDevice && (
                <Badge variant="secondary" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  已选设备: {selectedDevice}
                </Badge>
              )}
              <span className="text-xs">偏好已保存</span>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>最新数据记录</CardTitle>
                <CardDescription>
                  显示最近接收到的OneNET推送数据 (最多50条)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无数据记录</p>
                    <p className="text-sm">请确保OneNET推送服务已正确配置</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">设备ID</th>
                          <th className="text-left p-2">数据流ID</th>
                          <th className="text-left p-2">数值</th>
                          <th className="text-left p-2">额外信息</th>
                          <th className="text-left p-2">接收时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((record) => (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <Badge variant="outline">{record.device_id}</Badge>
                            </td>
                            <td className="p-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {record.datastream_id}
                              </code>
                            </td>
                            <td className="p-2">
                              <SmartValueDisplay
                                value={record.value}
                                deviceId={record.device_id}
                                datastreamId={record.datastream_id}
                                className="font-mono"
                                showTooltip={true}
                              />
                            </td>
                            <td className="p-2 text-sm text-gray-600 max-w-xs">
                              {formatRawData(record.raw_data)}
                            </td>
                            <td className="p-2 text-sm">
                              {formatTimestamp(record.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="device" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>按设备查看数据</CardTitle>
                <CardDescription>
                  选择特定设备查看其数据记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={selectedDevice === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedDevice("")
                      setActiveTab("all")
                      savePreferences({ selectedDevice: undefined, activeTab: "all" })
                      fetchData()
                    }}
                  >
                    所有设备
                  </Button>
                  {uniqueDevices.map((deviceId) => (
                    <Button
                      key={deviceId}
                      variant={selectedDevice === deviceId ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDevice(deviceId)
                        savePreferences({ selectedDevice: deviceId, activeTab: "device" })
                        fetchDeviceData(deviceId)
                      }}
                    >
                      {deviceId}
                    </Button>
                  ))}
                </div>

                {data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>该设备暂无数据记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge>{record.device_id}</Badge>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {record.datastream_id}
                            </code>
                            <SmartValueDisplay
                              value={record.value}
                              deviceId={record.device_id}
                              datastreamId={record.datastream_id}
                              className="font-mono text-lg"
                              showTooltip={true}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(record.created_at)}
                          </span>
                        </div>
                        {record.raw_data && (
                          <details className="text-sm">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                              查看原始数据
                            </summary>
                            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(record.raw_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
