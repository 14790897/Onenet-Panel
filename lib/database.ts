import { neon } from "@neondatabase/serverless"

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
  return result[0]
}

export async function getLatestData(limit = 50) {
  const result = await sql`
    SELECT * FROM onenet_data 
    ORDER BY timestamp DESC 
    LIMIT ${limit}
  `
  return result
}

export async function getDataByDevice(deviceId: string, limit = 20) {
  const result = await sql`
    SELECT * FROM onenet_data 
    WHERE device_id = ${deviceId}
    ORDER BY timestamp DESC 
    LIMIT ${limit}
  `
  return result
}

export async function getDataStats() {
  const result = await sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT device_id) as unique_devices,
      COUNT(DISTINCT datastream_id) as unique_datastreams,
      MAX(timestamp) as latest_timestamp
    FROM onenet_data
  `
  return result[0]
}
