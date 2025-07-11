"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, CheckCircle, XCircle, Globe } from "lucide-react"

export default function TestWebhook() {
  const [formData, setFormData] = useState({
    device_id: "device_001",
    datastream_id: "temperature",
    value: "25.6",
    customData: '{"unit": "celsius", "location": "test_room"}',
  })
  
  const [oneNetData, setOneNetData] = useState({
    msg: '{"deviceId": "2454063050", "deviceName": "bm280-bedroom", "messageType": "notify", "notifyType": "property", "productId": "11ijEEhVAe", "data": {"id": "734965", "version": "1.0", "params": {"temperature": {"value": 25.6, "time": 1752246936035}, "humidity": {"value": 60.2, "time": 1752246936035}, "pressure": {"value": 1013.25, "time": 1752246936035}}}}',
    nonce: "FZOKIRdC", 
    signature: "t1Z6pQZKUniiD573jtmuRQ==",
    time: Date.now(),
    id: "test_message_001"
  })
  
  const [urlVerifyData, setUrlVerifyData] = useState({
    msg: "test_validation_string",
    nonce: "xyz98765",
    signature: "verify_signature"
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

      const data = response.ok ? await response.text() : await response.json()
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

  const sendOneNetPush = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/onenet/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(oneNetData),
      })

      const data = response.ok ? await response.text() : await response.json()
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

  const testUrlVerify = async () => {
    try {
      setLoading(true)
      setResult(null)

      const params = new URLSearchParams(urlVerifyData)
      const response = await fetch(`/api/onenet/webhook?${params}`, {
        method: "GET",
      })

      const data = await response.text()
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

  const generateOneNetData = () => {
    const devices = [
      { id: "2454063050", name: "bm280-bedroom" },
      { id: "2454063051", name: "sensor-livingroom" },
      { id: "2454063052", name: "monitor-kitchen" }
    ]
    const randomDevice = devices[Math.floor(Math.random() * devices.length)]
    
    // 生成随机传感器数据
    const temperature = (15 + Math.random() * 20).toFixed(1) // 15-35度
    const humidity = (30 + Math.random() * 40).toFixed(1)    // 30-70%
    const pressure = (950 + Math.random() * 100).toFixed(2)  // 950-1050 hPa
    const currentTime = Date.now()
    
    const msgData = {
      deviceId: randomDevice.id,
      deviceName: randomDevice.name,
      messageType: "notify",
      notifyType: "property",
      productId: "11ijEEhVAe",
      data: {
        id: Math.floor(Math.random() * 999999).toString(),
        version: "1.0",
        params: {
          temperature: {
            value: Number.parseFloat(temperature),
            time: currentTime
          },
          humidity: {
            value: Number.parseFloat(humidity),
            time: currentTime
          },
          pressure: {
            value: Number.parseFloat(pressure),
            time: currentTime
          }
        }
      }
    }

    setOneNetData({
      ...oneNetData,
      msg: JSON.stringify(msgData),
      nonce: Math.random().toString(36).substring(2, 10),
      time: currentTime,
      id: `msg_${currentTime}`
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OneNET Webhook 测试工具</h1>
          <p className="text-gray-600 mt-1">测试OneNET推送服务的完整功能：URL验证和数据接收</p>
        </div>

        <Tabs defaultValue="url-verify" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url-verify">URL验证测试</TabsTrigger>
            <TabsTrigger value="onenet-push">OneNET推送测试</TabsTrigger>
            <TabsTrigger value="legacy-test">兼容性测试</TabsTrigger>
          </TabsList>

          {/* URL验证测试 */}
          <TabsContent value="url-verify" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    URL验证测试
                  </CardTitle>
                  <CardDescription>
                    模拟OneNET平台的URL验证请求 (GET请求)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="verify_msg">验证消息 (msg)</Label>
                    <Input
                      id="verify_msg"
                      value={urlVerifyData.msg}
                      onChange={(e) => setUrlVerifyData({ ...urlVerifyData, msg: e.target.value })}
                      placeholder="test_validation_string"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verify_nonce">随机字符串 (nonce)</Label>
                    <Input
                      id="verify_nonce"
                      value={urlVerifyData.nonce}
                      onChange={(e) => setUrlVerifyData({ ...urlVerifyData, nonce: e.target.value })}
                      placeholder="xyz98765"
                    />
                  </div>
                  <div>
                    <Label htmlFor="verify_signature">签名 (signature)</Label>
                    <Input
                      id="verify_signature"
                      value={urlVerifyData.signature}
                      onChange={(e) => setUrlVerifyData({ ...urlVerifyData, signature: e.target.value })}
                      placeholder="verify_signature"
                    />
                  </div>
                  <Button onClick={testUrlVerify} disabled={loading} className="w-full">
                    {loading ? "测试中..." : "测试URL验证"}
                  </Button>
                </CardContent>
              </Card>

              {/* 结果显示 */}
              <Card>
                <CardHeader>
                  <CardTitle>验证结果</CardTitle>
                  <CardDescription>URL验证的响应信息</CardDescription>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              验证成功 ({result.status})
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <Badge variant="destructive">验证失败 ({result.status})</Badge>
                          </>
                        )}
                      </div>
                      <div>
                        <Label>响应内容:</Label>
                        <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-auto">
                          {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>点击测试按钮验证URL</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* OneNET推送测试 */}
          <TabsContent value="onenet-push" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OneNET推送格式测试</CardTitle>
                  <CardDescription>
                    使用OneNET标准推送格式发送数据 (POST请求)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="onenet_msg">消息内容 (msg)</Label>
                    <Textarea
                      id="onenet_msg"
                      value={oneNetData.msg}
                      onChange={(e) => setOneNetData({ ...oneNetData, msg: e.target.value })}
                      placeholder='{"device_id": "device_001", "datastream_id": "temperature", "value": 25.6}'
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="onenet_nonce">随机字符串 (nonce)</Label>
                      <Input
                        id="onenet_nonce"
                        value={oneNetData.nonce}
                        onChange={(e) => setOneNetData({ ...oneNetData, nonce: e.target.value })}
                        placeholder="abc12345"
                      />
                    </div>
                    <div>
                      <Label htmlFor="onenet_signature">签名 (signature)</Label>
                      <Input
                        id="onenet_signature"
                        value={oneNetData.signature}
                        onChange={(e) => setOneNetData({ ...oneNetData, signature: e.target.value })}
                        placeholder="test_signature"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="onenet_time">时间戳 (time)</Label>
                      <Input
                        id="onenet_time"
                        type="number"
                        value={oneNetData.time}
                        onChange={(e) => setOneNetData({ ...oneNetData, time: Number(e.target.value) })}
                        placeholder={Date.now().toString()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="onenet_id">消息ID (id)</Label>
                      <Input
                        id="onenet_id"
                        value={oneNetData.id}
                        onChange={(e) => setOneNetData({ ...oneNetData, id: e.target.value })}
                        placeholder="test_message_001"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={sendOneNetPush} disabled={loading} className="flex-1">
                      {loading ? "发送中..." : "发送OneNET推送"}
                    </Button>
                    <Button variant="outline" onClick={generateOneNetData}>
                      随机生成
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 结果显示 */}
              <Card>
                <CardHeader>
                  <CardTitle>推送结果</CardTitle>
                  <CardDescription>OneNET推送的响应信息</CardDescription>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              推送成功 ({result.status})
                            </Badge>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <Badge variant="destructive">推送失败 ({result.status})</Badge>
                          </>
                        )}
                      </div>
                      <div>
                        <Label>响应内容:</Label>
                        <pre className="mt-2 p-3 bg-gray-100 rounded-md text-sm overflow-auto">
                          {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>点击发送按钮测试推送</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 兼容性测试 */}
          <TabsContent value="legacy-test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>兼容性测试</CardTitle>
                  <CardDescription>
                    使用旧格式测试数据接收功能
                  </CardDescription>
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
                      {loading ? "发送中..." : "发送测试数据"}
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
                  <CardTitle>测试结果</CardTitle>
                  <CardDescription>兼容性测试的响应信息</CardDescription>
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
                          {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>点击发送按钮测试接口</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* API信息 */}
        <Card>
          <CardHeader>
            <CardTitle>API 端点信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">URL验证 (GET)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">URL:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">/api/onenet/webhook?msg=xxx&nonce=xxx&signature=xxx</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">方法:</span>
                      <Badge variant="outline">GET</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">返回:</span>
                      <span className="text-gray-600">原样返回msg参数</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">数据推送 (POST)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">URL:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">/api/onenet/webhook</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">方法:</span>
                      <Badge variant="outline">POST</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Content-Type:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">application/json</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">返回:</span>
                      <span className="text-gray-600">HTTP 200 OK</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">配置说明</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 在OneNET平台配置推送URL时使用: <code>/api/onenet/webhook</code></li>
                  <li>• 设置环境变量 <code>ONENET_TOKEN</code> 来启用签名验证</li>
                  <li>• 设置环境变量 <code>ONENET_AES_KEY</code> (16位) 来启用消息解密</li>
                  <li>• 系统会自动处理重复消息过滤</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
