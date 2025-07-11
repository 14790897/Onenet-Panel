import { type NextRequest, NextResponse } from "next/server"
import { getLatestData, getDataByDevice, getDataStats } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("device_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const type = searchParams.get("type") || "latest"

    let data

    switch (type) {
      case "stats":
        data = await getDataStats()
        break
      case "device":
        if (!deviceId) {
          return NextResponse.json({ error: "device_id is required for device type" }, { status: 400 })
        }
        data = await getDataByDevice(deviceId, limit)
        break
      default:
        data = await getLatestData(limit)
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
