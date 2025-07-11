import { type NextRequest, NextResponse } from "next/server"
import { insertOneNetData } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received OneNet data:", body)

    // 解析OneNet数据格式
    // OneNet通常发送的数据格式可能包含设备ID、数据流ID、值等
    const { device_id, datastream_id, value, timestamp, ...rawData } = body

    if (!device_id || !datastream_id || value === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: device_id, datastream_id, or value" },
        { status: 400 },
      )
    }

    // 将数据插入数据库
    const insertedData = await insertOneNetData({
      device_id: String(device_id),
      datastream_id: String(datastream_id),
      value: Number(value),
      raw_data: rawData,
    })

    console.log("Data inserted successfully:", insertedData)

    return NextResponse.json({
      success: true,
      message: "Data received and stored successfully",
      id: insertedData.id,
    })
  } catch (error) {
    console.error("Error processing OneNet data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 支持GET请求用于测试
export async function GET() {
  return NextResponse.json({
    message: "OneNet webhook endpoint is ready",
    endpoint: "/api/onenet/webhook",
    method: "POST",
  })
}
