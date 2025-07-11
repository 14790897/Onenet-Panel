"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Send, CheckCircle, XCircle } from "lucide-react"

export default function TestWebhook() {
  const [formData, setFormData] = useState({
    device_id: "device_001",
    datastream_id: "temperature",
    value: "25.6",
    customData: '{"unit": "celsius", "location": "test_room"}',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const sendTestData = async () => {
    try {
      setLoading(true)
      setResult(null)

      const payload = {
        device_id: formData.device_id,
        datastream_id: formData.datastream_id,
        value: Number.parseFloat(formData.value),
        timestamp: new Date().toISOString(),
        ...JSON.parse(formData.customData || "{}"),
      }

      const response = await fetch("/api/onenet/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResult({ success: response.ok, data, status: response.status })
    } catch (error) {
      setResult({
        success: false,
        data: { error: error instanceof Error ? error.message : "未知错误" },
        status: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const generateRandomData = () => {
    const devices = ["device_001", "device_002", "device_003"]
    const datastreams = ["temperature", "humidity", "pressure", "light"]
    const randomDevice = devices[Math.floor(Math.random() * devices.length)]
    const randomDatastream = datastreams[Math.floor(Math.random() * datastreams.length)]
    const randomValue = (Math.random() * 100).toFixed(2)

    setFormData({
      ...formData,
      device_id: randomDevice,
      datastream_id: randomDatastream,
      value: randomValue,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Webhook 测试工具</h1>
          <p className="text-gray-600 mt-1">测试OneNet数据接收接口</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 测试表单 */}
          <Card>
            <CardHeader>
              <CardTitle>发送测试数据</CardTitle>
              <CardDescription>模拟OneNet平台发送数据到webhook接口</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device_id">设备ID</Label>
                  <Input
                    id="device_id"
                    value={formData.device_id}
                    onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                    placeholder="device_001"
                  />
                </div>
                <div>
                  <Label htmlFor="datastream_id">数据流ID</Label>
                  <Input
                    id="datastream_id"
                    value={formData.datastream_id}
                    onChange={(e) => setFormData({ ...formData, datastream_id: e.target.value })}
                    placeholder="temperature"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="value">数值</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="25.6"
                />
              </div>

              <div>
                <Label htmlFor="customData">自定义数据 (JSON)</Label>
                <Textarea
                  id="customData"
                  value={formData.customData}
                  onChange={(e) => setFormData({ ...formData, customData: e.target.value })}
                  placeholder='{"unit": "celsius", "location": "room1"}'
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={sendTestData} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Send className="w-4 h-4 mr-2 animate-pulse" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      发送测试数据
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={generateRandomData}>
                  随机生成
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 结果显示 */}
          <Card>
            <CardHeader>
              <CardTitle>响应结果</CardTitle>
              <CardDescription>webhook接口的响应信息</CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          成功 ({result.status})
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <Badge variant="destructive">失败 ({result.status})</Badge>
                      </>
                    )}
                  </div>

                  <div>
                    <Label>响应数据:</Label>
                    <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>点击发送按钮测试webhook接口</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* API信息 */}
        <Card>
          <CardHeader>
            <CardTitle>API 端点信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">Webhook URL:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">/api/onenet/webhook</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">方法:</span>
                <Badge>POST</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Content-Type:</span>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">application/json</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
