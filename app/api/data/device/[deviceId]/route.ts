import { NextResponse } from "next/server"
import { getDataByDevice } from "@/lib/database"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    const { deviceId } = await params
    const data = await getDataByDevice(deviceId, 20)
    return NextResponse.json(data)
  } catch (error) {
    console.error("获取设备数据失败:", error)
    return NextResponse.json(
      { error: "Failed to fetch device data" },
      { status: 500 }
    )
  }
}
