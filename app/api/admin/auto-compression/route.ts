import { NextRequest, NextResponse } from "next/server"
import { getCompressionStats, manualCompress } from "@/lib/auto-compression"

export async function GET() {
  try {
    const stats = await getCompressionStats()
    
    return NextResponse.json({
      success: true,
      stats: {
        originalRecords: stats.originalRecords,
        compressedRecords: stats.compressedRecords,
        lastCompressionTime: stats.lastCompressionTime,
        nextCompressionTime: stats.nextCompressionTime,
        compressionInterval: '30分钟',
        compressionDelay: '30分钟前的数据',
        compressionGranularity: '5分钟间隔'
      }
    })
  } catch (error) {
    console.error("获取自动压缩统计失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取统计信息失败" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    
    if (action === "manual_compress") {
      // 手动触发压缩
      const result = await manualCompress()
      
      return NextResponse.json({
        success: true,
        result: {
          compressed: result.compressed,
          compressedRows: result.compressedRows,
          deletedRows: result.deletedRows,
          error: result.error
        },
        message: result.compressed 
          ? `手动压缩完成：压缩${result.compressedRows}行，删除${result.deletedRows}行`
          : result.error || "没有需要压缩的数据"
      })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "无效的操作" 
    }, { status: 400 })
    
  } catch (error) {
    console.error("手动压缩失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "手动压缩失败",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
