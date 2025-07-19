import { type NextRequest, NextResponse } from "next/server"
import { getLatestData, getDataByDevice, getDataStats } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("device_id")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 1000) // 限制最大1000条
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") || "latest"
    const datastream = searchParams.get("datastream")

    let data

    switch (type) {
      case "stats":
        data = await getDataStats()
        break
      case "device":
        if (!deviceId) {
          return NextResponse.json({ 
            success: false, 
            error: "device_id is required for device type" 
          }, { status: 400 })
        }
        data = await getDataByDevice(deviceId, limit, offset)
        break
      case "paginated":
        // 支持分页的通用查询
        data = await getLatestData(limit, offset, deviceId || undefined, datastream || undefined)

        // 获取总数（仅在第一页时查询以提高性能）
        let totalCount = undefined
        if (offset === 0) {
          try {
            const { sql } = await import('@vercel/postgres')
            let countQuery
            if (deviceId && datastream) {
              countQuery = await sql`SELECT COUNT(*) as total FROM onenet_data WHERE device_id = ${deviceId} AND datastream_id = ${datastream}`
            } else if (deviceId) {
              countQuery = await sql`SELECT COUNT(*) as total FROM onenet_data WHERE device_id = ${deviceId}`
            } else if (datastream) {
              countQuery = await sql`SELECT COUNT(*) as total FROM onenet_data WHERE datastream_id = ${datastream}`
            } else {
              countQuery = await sql`SELECT COUNT(*) as total FROM onenet_data`
            }
            totalCount = parseInt(countQuery.rows[0].total)
          } catch (error) {
            console.error('获取总数失败:', error)
          }
        }

        return NextResponse.json({
          success: true,
          data,
          pagination: {
            limit,
            offset,
            hasMore: data.length === limit,
            totalCount
          }
        })
      default:
        data = await getLatestData(limit)
    }

    return NextResponse.json({ 
      success: true, 
      data,
      pagination: type === "paginated" ? { 
        limit, 
        offset, 
        hasMore: data.length === limit 
      } : undefined
    })
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
