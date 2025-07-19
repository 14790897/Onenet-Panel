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
    // 用户指定的间隔 - 直接使用用户选择的间隔
    samplingInterval = interval

    // 根据间隔计算合理的最大数据点数
    const durationMinutes = durationMs / (1000 * 60)
    const intervalMinutes = getIntervalMinutes(interval)
    maxPoints = Math.min(Math.ceil(durationMinutes / intervalMinutes), 1000) // 最多1000个点
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

// 数据库层面的时间间隔查询函数
async function executeIntervalQuery(
  devices: string[],
  datastream: string,
  startDate: string,
  endDate: string,
  samplingInfo: { samplingInterval: string, maxPoints: number }
) {
  const sql = neon(process.env.DATABASE_URL!)

  // 根据间隔类型选择不同的查询策略
  const interval = samplingInfo.samplingInterval

  if (interval === '1m') {
    // 1分钟间隔 - 使用date_trunc
    return await sql`
      SELECT
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('minute', created_at) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
      LIMIT ${samplingInfo.maxPoints * devices.length}
    `
  } else if (['1h', '3h', '6h', '12h'].includes(interval)) {
    // 小时级间隔 - 使用date_trunc到小时，然后按间隔分组
    const hourInterval = parseInt(interval.replace('h', ''))
    return await sql`
      SELECT
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('hour', created_at) +
        INTERVAL '${sql.unsafe(hourInterval.toString())} hours' *
        FLOOR(EXTRACT(hour FROM created_at) / ${hourInterval}) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
      LIMIT ${samplingInfo.maxPoints * devices.length}
    `
  } else if (interval === '1d') {
    // 1天间隔 - 使用date_trunc
    return await sql`
      SELECT
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('day', created_at) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
      LIMIT ${samplingInfo.maxPoints * devices.length}
    `
  } else if (['5m', '15m', '30m'].includes(interval)) {
    // 分钟级自定义间隔
    const minuteInterval = parseInt(interval.replace('m', ''))
    return await sql`
      SELECT
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('hour', created_at) +
        INTERVAL '${sql.unsafe(minuteInterval.toString())} minutes' *
        FLOOR(EXTRACT(minute FROM created_at) / ${minuteInterval}) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
      LIMIT ${samplingInfo.maxPoints * devices.length}
    `
  } else {
    // 自动模式或其他 - 使用小时级采样
    return await sql`
      SELECT
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('hour', created_at) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
      LIMIT ${samplingInfo.maxPoints * devices.length}
    `
  }
}

// 获取间隔对应的分钟数（用于计算最大数据点数）
function getIntervalMinutes(interval: string): number {
  const intervalMap: { [key: string]: number } = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '3h': 180,
    '6h': 360,
    '12h': 720,
    '1d': 1440
  }
  return intervalMap[interval] || 60
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

    // 数据库层面的时间间隔查询
    const data = await executeIntervalQuery(devices, datastream, startDate, endDate, samplingInfo)

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
