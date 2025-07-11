import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 获取所有设备及其数据流信息
    const devices = await sql`
      SELECT 
        device_id,
        raw_data->>'deviceName' as device_name,
        array_agg(DISTINCT datastream_id) as datastreams,
        MAX(value) as latest_value,
        MAX(created_at) as latest_time
      FROM onenet_data 
      GROUP BY device_id, raw_data->>'deviceName'
      ORDER BY device_id
    `

    // 格式化结果
    const formattedDevices = devices.map(device => ({
      device_id: device.device_id,
      device_name: device.device_name || device.device_id,
      datastreams: device.datastreams || [],
      latest_value: device.latest_value,
      latest_time: device.latest_time
    }))

    return NextResponse.json(formattedDevices)
  } catch (error) {
    console.error("获取设备列表失败:", error)
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 500 }
    )
  }
}
