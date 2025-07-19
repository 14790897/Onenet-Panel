import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

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

    // 根据时间范围参数设置查询条件
    let timeInterval = '1 hour'
    switch (timeRange) {
      case '10m':
        timeInterval = '10 minutes'
        break
      case '30m':
        timeInterval = '30 minutes'
        break
      case '1h':
        timeInterval = '1 hour'
        break
      case '6h':
        timeInterval = '6 hours'
        break
      case '24h':
        timeInterval = '24 hours'
        break
      case '7d':
        timeInterval = '7 days'
        break
      default:
        timeInterval = '1 hour'
    }

    // 获取指定时间范围内的数据
    const data = await sql`
      SELECT
        device_id,
        datastream_id,
        value,
        created_at,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at >= NOW() - INTERVAL '${sql.unsafe(timeInterval)}'
      ORDER BY created_at DESC
      LIMIT ${limit * devices.length}
    `

    // 按时间点组织数据
    const timeMap = new Map()
    
    data.forEach(row => {
      const timeKey = new Date(row.created_at).toISOString()

      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          timestamp: timeKey,
          // 不在服务器端格式化时间，让客户端处理
          rawTimestamp: row.created_at
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
