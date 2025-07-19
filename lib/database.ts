import { neon } from "@neondatabase/serverless"
import { withCache, generateCacheKey } from "./cache"
import { checkAndCompress } from "./auto-compression"

const sql = neon(process.env.DATABASE_URL!)

export interface OneNetData {
  id?: number
  device_id: string
  datastream_id: string
  value: number
  timestamp?: Date
  raw_data?: any
  created_at?: Date
}

export async function insertOneNetData(data: OneNetData) {
  const result = await sql`
    INSERT INTO onenet_data (device_id, datastream_id, value, raw_data)
    VALUES (${data.device_id}, ${data.datastream_id}, ${data.value}, ${JSON.stringify(data.raw_data)})
    RETURNING *
  `

  // 异步触发自动压缩检查（不阻塞数据插入）
  checkAndCompress().catch(error => {
    console.error('自动压缩检查失败:', error)
  })

  return result[0]
}

export async function getLatestData(
  limit = 50, 
  offset = 0, 
  deviceId?: string, 
  datastream?: string
) {
  if (deviceId && datastream) {
    const result = await sql`
      SELECT * FROM onenet_data
      WHERE device_id = ${deviceId} AND datastream_id = ${datastream}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  } else if (deviceId) {
    const result = await sql`
      SELECT * FROM onenet_data
      WHERE device_id = ${deviceId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  } else if (datastream) {
    const result = await sql`
      SELECT * FROM onenet_data
      WHERE datastream_id = ${datastream}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  } else {
    const result = await sql`
      SELECT * FROM onenet_data
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return result
  }
}

export async function getDataByDevice(deviceId: string, limit = 20, offset = 0) {
  const result = await sql`
    SELECT * FROM onenet_data 
    WHERE device_id = ${deviceId}
    ORDER BY timestamp DESC 
    LIMIT ${limit}
    OFFSET ${offset}
  `
  return result
}

export async function getDataStats() {
  return withCache(
    'data_stats',
    async () => {
      const result = await sql`
        SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT device_id) as unique_devices,
          COUNT(DISTINCT datastream_id) as unique_datastreams,
          MAX(timestamp) as latest_timestamp
        FROM onenet_data
      `
      return result[0]
    },
    60000 // 1分钟缓存
  )
}

export async function getDataByTimeRange(
  startDate: string,
  endDate: string,
  limit = 1000
) {
  const result = await sql`
    SELECT * FROM onenet_data 
    WHERE created_at BETWEEN ${startDate} AND ${endDate}
    ORDER BY created_at DESC 
    LIMIT ${limit}
  `
  return result
}

export async function getDataByDeviceAndTimeRange(
  deviceId: string,
  datastream: string,
  startDate: string,
  endDate: string,
  limit = 500
) {
  const result = await sql`
    SELECT * FROM onenet_data 
    WHERE device_id = ${deviceId}
      AND datastream_id = ${datastream}
      AND created_at BETWEEN ${startDate} AND ${endDate}
    ORDER BY created_at ASC 
    LIMIT ${limit}
  `
  return result
}

export async function getDevicesWithDatastreams() {
  return withCache(
    'devices_with_datastreams',
    async () => {
      const result = await sql`
        SELECT 
          device_id,
          raw_data->>'deviceName' as device_name,
          array_agg(DISTINCT datastream_id) as datastreams,
          COUNT(*) as total_records,
          MAX(created_at) as latest_timestamp
        FROM onenet_data 
        GROUP BY device_id, raw_data->>'deviceName'
        ORDER BY latest_timestamp DESC
      `
      return result
    },
    120000 // 2分钟缓存
  )
}
