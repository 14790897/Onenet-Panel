import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devices = searchParams.get('devices')?.split(',') || []
    const datastream = searchParams.get('datastream') || 'temperature'
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!devices.length) {
      return NextResponse.json([])
    }

    // 获取最近的数据
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
        AND created_at >= NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
      LIMIT ${limit * devices.length}
    `

    // 按时间点组织数据
    const timeMap = new Map()
    
    data.forEach(row => {
      const timeKey = new Date(row.created_at).toISOString()
      const timeDisplay = new Date(row.created_at).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          timestamp: timeKey,
          time: timeDisplay
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
