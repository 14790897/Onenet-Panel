"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestRealtimeDataPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/analytics/realtime?devices=2457220437,2454063050&datastream=voc_ugm3&limit=10&timeRange=1h')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🔍 实时数据API返回结果:', result)
      setData(result)
    } catch (err) {
      console.error('❌ 获取数据失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>实时数据API测试</CardTitle>
          <CardDescription>
            测试多设备实时数据API返回的数据结构
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={fetchData} disabled={loading}>
              {loading ? '加载中...' : '重新获取数据'}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-red-800 font-medium">错误</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {data.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-blue-800 font-medium">数据概览</h3>
                  <ul className="text-blue-600 text-sm mt-2 space-y-1">
                    <li>总数据点: {data.length}</li>
                    <li>时间范围: {data[0]?.timestamp} 到 {data[data.length - 1]?.timestamp}</li>
                    <li>设备字段: {Object.keys(data[0] || {}).filter(key => !['timestamp', 'rawTimestamp', 'dataSource'].includes(key)).join(', ')}</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">前3个数据点详情:</h3>
                  {data.slice(0, 3).map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 border rounded-md">
                      <div className="text-sm font-mono">
                        <div><strong>时间:</strong> {item.timestamp}</div>
                        <div><strong>数据源:</strong> {item.dataSource}</div>
                        <div><strong>设备数据:</strong></div>
                        <div className="ml-4">
                          {Object.entries(item)
                            .filter(([key]) => !['timestamp', 'rawTimestamp', 'dataSource'].includes(key))
                            .map(([deviceId, value]) => (
                              <div key={deviceId}>
                                {deviceId}: {typeof value === 'number' ? value.toFixed(2) : value}
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">完整JSON数据 (前2个数据点):</h3>
                  <pre className="p-3 bg-gray-900 text-green-400 text-xs rounded-md overflow-auto max-h-96">
                    {JSON.stringify(data.slice(0, 2), null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {!loading && !error && data.length === 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">暂无数据</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
