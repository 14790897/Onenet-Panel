import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { smartQueryDeviceData, getDataSourceInfo } from "@/lib/smart-data-reader"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devices = searchParams.get('devices')?.split(',') || []
    const datastream = searchParams.get('datastream') || 'temperature'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000) // 限制最大1000条
    const timeRange = searchParams.get('timeRange') || '1h' // 默认1小时

    if (!devices.length) {
      return NextResponse.json([])
    }

    // 根据时间范围参数计算开始时间
    let startTime: Date
    const now = new Date()

    switch (timeRange) {
      case '10m':
        startTime = new Date(now.getTime() - 10 * 60 * 1000)
        break
      case '30m':
        startTime = new Date(now.getTime() - 30 * 60 * 1000)
        break
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
        break
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default:
        startTime = new Date(now.getTime() - 60 * 60 * 1000) // 默认1小时
    }

    // 使用智能数据读取器获取数据
    const data = await smartQueryDeviceData({
      devices,
      datastream,
      startDate: startTime.toISOString(),
      endDate: new Date().toISOString(),
      limit: limit * devices.length
    })

    // 获取数据源信息（用于调试）
    const dataSourceInfo = await getDataSourceInfo(startTime.toISOString(), new Date().toISOString())
    console.log('📊 实时数据源信息:', dataSourceInfo)

    // 按时间点组织数据
    const timeMap = new Map()

    data.forEach(row => {
      const timeKey = new Date(row.created_at).toISOString()

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          timestamp: timeKey,
          // 不在服务器端格式化时间，让客户端处理
          rawTimestamp: row.created_at,
          dataSource: row.data_source // 添加数据源信息
        })
      }

      const timePoint = timeMap.get(timeKey)
      timePoint[row.device_id] = row.value
    })

    // 转换为数组并排序，只返回最新的数据点
    const chartData = Array.from(timeMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
      .reverse() // 重新排序为时间正序

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("获取实时数据失败:", error)
    return NextResponse.json(
      { error: "Failed to fetch realtime data" },
      { status: 500 }
    )
  }
}
