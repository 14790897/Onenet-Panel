"use client"

import { useState } from "react"
import { RealtimeChart } from "@/components/realtime-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TestTimeRangePage() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['2457220437', '2454063050'])
  const [selectedDatastream, setSelectedDatastream] = useState('voc_ugm3')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>时间范围选择测试</CardTitle>
          <CardDescription>
            测试实时图表组件的时间范围选择功能是否正常工作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">测试说明</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>选择不同的时间范围（10分钟、30分钟、1小时等）</li>
                <li>观察图表是否正确更新显示对应时间范围的数据</li>
                <li>检查控制台日志中的时间范围计算是否正确</li>
                <li>验证数据清理逻辑是否正常工作</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">当前测试设备</h3>
              <div className="flex gap-2">
                {selectedDevices.map(device => (
                  <span key={device} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {device}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">数据流: {selectedDatastream}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <RealtimeChart
        devices={selectedDevices}
        datastream={selectedDatastream}
        autoRefresh={false}
        refreshInterval={10000}
      />

      <Card>
        <CardHeader>
          <CardTitle>测试步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border rounded">
              <h4 className="font-semibold">步骤 1: 基础功能测试</h4>
              <p className="text-sm text-gray-600">选择不同的时间范围，观察图表数据是否更新</p>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-semibold">步骤 2: 数据清理测试</h4>
              <p className="text-sm text-gray-600">切换时间范围时，旧数据应该被清除，新数据应该正确显示</p>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-semibold">步骤 3: 错误处理测试</h4>
              <p className="text-sm text-gray-600">如果数据获取失败，应该显示友好的错误信息和重试按钮</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
