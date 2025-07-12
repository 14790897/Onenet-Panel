import { NextResponse } from "next/server"
import { dataCache } from "@/lib/cache"

export async function GET() {
  try {
    const stats = dataCache.getStats()
    
    return NextResponse.json({
      success: true,
      stats: {
        cacheSize: stats.size,
        cachedKeys: stats.keys,
        memoryUsage: `${(stats.memoryUsage / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Error getting cache stats:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    dataCache.clear()
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully"
    })
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error"
    }, { status: 500 })
  }
}
