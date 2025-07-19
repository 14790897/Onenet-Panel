import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("device_id")

    let query
    if (deviceId) {
      // 获取特定设备的数据流
      query = await sql`
        SELECT DISTINCT datastream_id
        FROM onenet_data
        WHERE device_id = ${deviceId}
        ORDER BY datastream_id
      `
    } else {
      // 获取所有数据流
      query = await sql`
        SELECT DISTINCT datastream_id
        FROM onenet_data
        ORDER BY datastream_id
      `
    }

    const datastreams = query.map(row => row.datastream_id)

    return NextResponse.json({ 
      success: true, 
      datastreams,
      count: datastreams.length
    })
  } catch (error) {
    console.error("Error fetching datastreams:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
