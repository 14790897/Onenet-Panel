import { NextResponse } from "next/server"
import { getDataStats } from "@/lib/database"

export async function GET() {
  try {
    const stats = await getDataStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("获取统计失败:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
