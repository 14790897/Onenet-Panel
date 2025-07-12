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
        data = await getLatestData(limit, offset, deviceId, datastream)
        break
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
