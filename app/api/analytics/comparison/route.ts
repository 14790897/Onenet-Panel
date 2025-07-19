import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 计算采样策略
function calculateSamplingStrategy(startDate: string, endDate: string, interval: string) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const durationMs = end.getTime() - start.getTime()
  const durationHours = durationMs / (1000 * 60 * 60)

  let samplingInterval: string
  let maxPoints = 1000 // 最大数据点数

  if (interval === 'auto') {
    // 自动选择合适的间隔
    if (durationHours <= 1) {
      samplingInterval = 'minute'
      maxPoints = 60
    } else if (durationHours <= 6) {
      samplingInterval = 'minute'
      maxPoints = 72
    } else if (durationHours <= 24) {
      samplingInterval = 'minute'
      maxPoints = 96
    } else if (durationHours <= 168) { // 1周
      samplingInterval = 'hour'
      maxPoints = 168
    } else if (durationHours <= 720) { // 1个月
      samplingInterval = 'hour'
      maxPoints = 120
    } else {
      samplingInterval = 'day'
      maxPoints = 365
    }
  } else {
    // 用户指定的间隔
    const intervalMap: { [key: string]: { interval: string, maxPoints: number } } = {
      '1m': { interval: 'minute', maxPoints: 60 },
      '5m': { interval: 'minute', maxPoints: 288 },
      '15m': { interval: 'minute', maxPoints: 96 },
      '30m': { interval: 'minute', maxPoints: 48 },
      '1h': { interval: 'hour', maxPoints: 24 },
      '3h': { interval: 'hour', maxPoints: 8 },
      '6h': { interval: 'hour', maxPoints: 4 },
      '12h': { interval: 'hour', maxPoints: 2 },
      '1d': { interval: 'day', maxPoints: 1 }
    }
    const config = intervalMap[interval] || { interval: 'hour', maxPoints: 100 }
    samplingInterval = config.interval
    maxPoints = config.maxPoints
  }

  return { samplingInterval, maxPoints }
}

// 应用层数据采样函数
function sampleData(data: any[], samplingInfo: { samplingInterval: string, maxPoints: number }) {
  if (data.length <= samplingInfo.maxPoints) {
    return data.map(row => ({
      ...row,
      time_bucket: row.created_at
    }))
  }

  // 计算采样间隔
  const step = Math.ceil(data.length / samplingInfo.maxPoints)
  const sampledData = []

  for (let i = 0; i < data.length; i += step) {
    // 取这个区间内的平均值
    const chunk = data.slice(i, i + step)
    const avgValue = chunk.reduce((sum, item) => sum + parseFloat(item.value), 0) / chunk.length

    sampledData.push({
      device_id: chunk[0].device_id,
      datastream_id: chunk[0].datastream_id,
      value: avgValue,
      time_bucket: chunk[Math.floor(chunk.length / 2)].created_at, // 使用中间时间点
      device_name: chunk[0].device_name
    })
  }

  return sampledData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devices = searchParams.get('devices')?.split(',') || []
    const datastream = searchParams.get('datastream')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const interval = searchParams.get('interval') || 'auto'

    if (!devices.length || !datastream || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // 根据间隔和时间范围计算采样策略
    const samplingInfo = calculateSamplingStrategy(startDate, endDate, interval)

    // 简化的采样查询 - 先获取所有数据，然后在应用层进行采样
    const allData = await sql`
      SELECT
        device_id,
        datastream_id,
        CAST(value AS NUMERIC) as value,
        created_at,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      ORDER BY created_at ASC
      LIMIT ${samplingInfo.maxPoints * 10}
    `

    // 在应用层进行采样
    const data = sampleData(allData, samplingInfo)

    // 按时间点组织数据
    const timeMap = new Map()

    data.forEach(row => {
      const timeKey = new Date(row.time_bucket).toISOString()
      const timeDisplay = new Date(row.time_bucket).toLocaleString('zh-CN', {
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
      // 使用平均值并保留小数点
      timePoint[row.device_id] = parseFloat(Number(row.value).toFixed(2))
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
