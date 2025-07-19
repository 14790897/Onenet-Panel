import { NextRequest, NextResponse } from "next/server"
import { performDataCleanup, getDataDistributionStats, shouldPerformCleanup } from "@/lib/data-cleanup"

export async function GET() {
  try {
    // 获取数据分布统计
    const stats = await getDataDistributionStats()
    const needsCleanup = await shouldPerformCleanup()
    
    return NextResponse.json({
      success: true,
      stats,
      needsCleanup,
      message: needsCleanup ? "检测到旧数据，建议执行清理" : "数据状态良好，无需清理"
    })
  } catch (error) {
    console.error("获取数据清理状态失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取状态失败" 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    // 检查是否需要清理
    if (!force) {
      const needsCleanup = await shouldPerformCleanup()
      if (!needsCleanup) {
        return NextResponse.json({
          success: true,
          message: "无需清理，数据状态良好",
          skipped: true
        })
      }
    }
    
    // 执行数据清理
    const result = await performDataCleanup()
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "数据清理完成",
        result
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "数据清理失败",
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("执行数据清理失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "清理执行失败" 
    }, { status: 500 })
  }
}
