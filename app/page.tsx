"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Database, Wifi, Activity } from "lucide-react"

interface OneNetDataItem {
  id: number
  device_id: string
  datastream_id: string
  value: number
  timestamp: string
  raw_data: any
  created_at: string
}

interface DataStats {
  total_records: number
  unique_devices: number
  unique_datastreams: number
  latest_timestamp: string
}

export default function OneNetDashboard() {
  const [data, setData] = useState<OneNetDataItem[]>([])
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 在现有的状态变量后添加数据库初始化相关状态
  const [dbInitialized, setDbInitialized] = useState<boolean | null>(null)
  const [initLoading, setInitLoading] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)

      // 获取最新数据
      const dataResponse = await fetch("/api/data?type=latest&limit=20")
      const dataResult = await dataResponse.json()

      // 获取统计信息
      const statsResponse = await fetch("/api/data?type=stats")
      const statsResult = await statsResponse.json()

      if (dataResult.success) {
        setData(dataResult.data)
      }

      if (statsResult.success) {
        setStats(statsResult.data)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 在现有的 fetchData 函数后添加数据库初始化函数
  const initializeDatabase = async () => {
    try {
      setInitLoading(true)
      const response = await fetch("/api/init-db", { method: "POST" })
      const result = await response.json()

      if (result.success) {
        setDbInitialized(true)
        // 初始化成功后立即获取数据
        await fetchData()
      } else {
        console.error("数据库初始化失败:", result.error)
      }
    } catch (error) {
      console.error("初始化请求失败:", error)
    } finally {
      setInitLoading(false)
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch("/api/init-db")
      const result = await response.json()

      if (result.success) {
        setDbInitialized(result.tableExists)
        if (result.tableExists) {
          await fetchData()
        }
      }
    } catch (error) {
      console.error("检查数据库状态失败:", error)
      setDbInitialized(false)
    }
  }

  // 修改 useEffect，先检查数据库状态
  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("zh-CN")
  }

  const getValueColor = (value: number) => {
    if (value > 80) return "text-red-600"
    if (value > 50) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">OneNet 数据监控</h1>
            <p className="text-gray-600 mt-1">实时监控来自OneNet平台的设备数据</p>
          </div>
          <Button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>
        </div>

        {/* 在统计卡片前添加数据库初始化提示 */}
        {dbInitialized === false && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Database className="w-5 h-5" />
                数据库未初始化
              </CardTitle>
              <CardDescription className="text-yellow-700">
                需要先初始化数据库表结构才能开始接收OneNet数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={initializeDatabase} disabled={initLoading} className="flex items-center gap-2">
                {initLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    初始化中...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    初始化数据库
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总记录数</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_records}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">设备数量</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unique_devices}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">数据流数量</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unique_datastreams}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">最新数据时间</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {stats.latest_timestamp ? formatTimestamp(stats.latest_timestamp) : "暂无数据"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据列表 */}
        <Card>
          <CardHeader>
            <CardTitle>最新数据</CardTitle>
            <CardDescription>显示最近接收到的20条OneNet数据记录</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="ml-2">加载中...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无数据</p>
                <p className="text-sm mt-1">等待OneNet推送数据到 /api/onenet/webhook</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">设备: {item.device_id}</Badge>
                        <Badge variant="secondary">数据流: {item.datastream_id}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">{formatTimestamp(item.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">数值:</span>
                        <span className={`text-lg font-semibold ${getValueColor(item.value)}`}>{item.value}</span>
                      </div>
                      <div className="text-xs text-gray-400">ID: {item.id}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API信息 */}
        <Card>
          <CardHeader>
            <CardTitle>API 配置信息</CardTitle>
            <CardDescription>OneNet平台配置信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Webhook URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  https://your-domain.vercel.app/api/onenet/webhook
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">请求方法:</span>
                <Badge>POST</Badge>
              </div>
              <div className="text-sm text-gray-600 mt-4">
                <p>请在OneNet平台配置数据推送URL为上述地址，系统将自动接收并存储数据。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
