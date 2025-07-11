import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devices = searchParams.get('devices')?.split(',') || []
    const datastream = searchParams.get('datastream')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    if (!devices.length || !datastream || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // 查询数据
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
        AND created_at BETWEEN ${startDate} AND ${endDate}
      ORDER BY created_at ASC
    `

    // 按时间点组织数据
    const timeMap = new Map()
    
    data.forEach(row => {
      const timeKey = new Date(row.created_at).toISOString()
      const timeDisplay = new Date(row.created_at).toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

    // 转换为数组并排序
    const chartData = Array.from(timeMap.values()).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("获取对比数据失败:", error)
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 500 }
    )
  }
}
