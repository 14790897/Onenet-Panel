'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTimestamp, formatRelativeTime, getTimeZoneInfo, formatChartTimeLabel } from "@/lib/time-utils"

export default function TestTimePage() {
  // 测试时间戳
  const testTimestamps = [
    "2025-07-19T02:15:01.352Z", // UTC时间
    "2025-07-19T01:59:55.374Z", // UTC时间
    new Date().toISOString(),   // 当前UTC时间
    new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5分钟前
    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小时前
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">时间显示测试页面</h1>
        <p className="text-gray-600">验证时区转换和时间格式化</p>
      </div>

      {/* 时区信息 */}
      <Card>
        <CardHeader>
          <CardTitle>时区信息</CardTitle>
          <CardDescription>当前浏览器的时区设置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>时区:</strong> {getTimeZoneInfo()}</p>
            <p><strong>当前时间:</strong> {formatTimestamp(new Date())}</p>
            <p><strong>UTC时间:</strong> {new Date().toISOString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* 时间格式化测试 */}
      <Card>
        <CardHeader>
          <CardTitle>时间格式化测试</CardTitle>
          <CardDescription>不同格式的时间显示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">UTC时间戳</th>
                  <th className="border border-gray-300 p-2 text-left">完整格式</th>
                  <th className="border border-gray-300 p-2 text-left">日期时间</th>
                  <th className="border border-gray-300 p-2 text-left">仅日期</th>
                  <th className="border border-gray-300 p-2 text-left">仅时间</th>
                  <th className="border border-gray-300 p-2 text-left">简短格式</th>
                  <th className="border border-gray-300 p-2 text-left">相对时间</th>
                </tr>
              </thead>
              <tbody>
                {testTimestamps.map((timestamp, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      {timestamp}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTimestamp(timestamp)}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTimestamp(timestamp, { format: 'datetime' })}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTimestamp(timestamp, { format: 'date' })}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTimestamp(timestamp, { format: 'time' })}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatTimestamp(timestamp, { format: 'short' })}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {formatRelativeTime(timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 图表时间标签测试 */}
      <Card>
        <CardHeader>
          <CardTitle>图表时间标签测试</CardTitle>
          <CardDescription>不同粒度的时间标签格式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['second', 'minute', 'hour', 'day'].map((granularity) => (
              <div key={granularity} className="space-y-2">
                <h4 className="font-semibold capitalize">{granularity} 粒度</h4>
                {testTimestamps.slice(0, 3).map((timestamp, index) => (
                  <div key={index} className="text-sm">
                    {formatChartTimeLabel(timestamp, granularity as any)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 实际应用示例 */}
      <Card>
        <CardHeader>
          <CardTitle>实际应用示例</CardTitle>
          <CardDescription>模拟OneNet数据的时间显示</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 模拟主页面的数据项 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">主页面数据项样式</h4>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">设备: 2454063050</span>
                  <span className="ml-2 text-sm text-gray-600">温度: 29.5°C</span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatTimestamp("2025-07-19T02:15:01.352Z")}
                </span>
              </div>
            </div>

            {/* 模拟实时图表的tooltip */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">实时图表Tooltip样式</h4>
              <div className="bg-gray-800 text-white p-2 rounded text-sm">
                <div>时间: {formatTimestamp("2025-07-19T02:15:01.352Z", { format: 'short' })}</div>
                <div>2454063050: 29.5</div>
              </div>
            </div>

            {/* 模拟数据表格 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">数据表格样式</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">设备ID</th>
                    <th className="text-left p-2">数值</th>
                    <th className="text-left p-2">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">2454063050</td>
                    <td className="p-2">29.5</td>
                    <td className="p-2">{formatTimestamp("2025-07-19T02:15:01.352Z")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 所有时间都会自动转换为您浏览器设置的本地时区</p>
            <p>• UTC时间戳 "2025-07-19T02:15:01.352Z" 应该显示为您当地的时间</p>
            <p>• 如果您在UTC+8时区，上述时间应该显示为 "2025/07/19 10:15:01"</p>
            <p>• 相对时间会显示与当前时间的差值</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
