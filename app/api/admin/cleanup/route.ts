import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "preview"
    const days = parseInt(searchParams.get("days") || "30")
    const maxRecords = parseInt(searchParams.get("max_records") || "10000")

    // 安全检查
    if (days < 1 || days > 365) {
      return NextResponse.json({ 
        success: false, 
        error: "天数必须在1-365之间" 
      }, { status: 400 })
    }

    switch (action) {
      case "preview":
        // 预览将要删除的数据
        const previewResult = await sql`
          SELECT 
            COUNT(*) as total_to_delete,
            MIN(created_at) as earliest_date,
            MAX(created_at) as latest_date
          FROM onenet_data 
          WHERE created_at < NOW() - INTERVAL '${days} days'
        `
        
        const totalRecords = await sql`SELECT COUNT(*) as total FROM onenet_data`
        
        return NextResponse.json({
          success: true,
          preview: {
            totalRecords: parseInt(totalRecords[0].total),
            recordsToDelete: parseInt(previewResult[0].total_to_delete),
            recordsToKeep: parseInt(totalRecords[0].total) - parseInt(previewResult[0].total_to_delete),
            earliestDeleteDate: previewResult[0].earliest_date,
            latestDeleteDate: previewResult[0].latest_date,
            cutoffDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
          }
        })

      case "cleanup_by_date":
        // 按日期删除数据
        const deleteResult = await sql`
          DELETE FROM onenet_data 
          WHERE created_at < NOW() - INTERVAL '${days} days'
        `
        
        return NextResponse.json({
          success: true,
          action: "cleanup_by_date",
          deletedRows: deleteResult.count || 0,
          message: `成功删除${days}天前的数据`
        })

      case "cleanup_by_count":
        // 只保留最新的N条记录
        const deleteByCountResult = await sql`
          DELETE FROM onenet_data 
          WHERE id NOT IN (
            SELECT id FROM onenet_data 
            ORDER BY created_at DESC 
            LIMIT ${maxRecords}
          )
        `
        
        return NextResponse.json({
          success: true,
          action: "cleanup_by_count",
          deletedRows: deleteByCountResult.count || 0,
          message: `成功保留最新${maxRecords}条记录，删除其余数据`
        })

      case "cleanup_duplicates":
        // 删除重复数据（相同设备、数据流、时间的记录）
        const deleteDuplicatesResult = await sql`
          DELETE FROM onenet_data 
          WHERE id NOT IN (
            SELECT DISTINCT ON (device_id, datastream_id, created_at) id
            FROM onenet_data 
            ORDER BY device_id, datastream_id, created_at, id DESC
          )
        `
        
        return NextResponse.json({
          success: true,
          action: "cleanup_duplicates",
          deletedRows: deleteDuplicatesResult.count || 0,
          message: "成功删除重复数据"
        })

      case "compress_old_data":
        // 压缩老数据 - 使用平均值
        const compressDays = parseInt(searchParams.get("compress_days") || "7")
        const intervalHours = parseInt(searchParams.get("interval_hours") || "1")

        // 创建临时压缩表（如果不存在）
        await sql`
          CREATE TABLE IF NOT EXISTS onenet_data_compressed (
            id SERIAL PRIMARY KEY,
            device_id VARCHAR(50),
            datastream_id VARCHAR(100),
            avg_value NUMERIC,
            min_value NUMERIC,
            max_value NUMERIC,
            sample_count INTEGER,
            time_bucket TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(device_id, datastream_id, time_bucket)
          )
        `

        // 压缩指定天数前的数据 - 使用简化的查询
        const compressResult = await sql`
          INSERT INTO onenet_data_compressed (
            device_id, datastream_id, avg_value, min_value, max_value,
            sample_count, time_bucket
          )
          SELECT
            device_id,
            datastream_id,
            AVG(CAST(value AS NUMERIC)) as avg_value,
            MIN(CAST(value AS NUMERIC)) as min_value,
            MAX(CAST(value AS NUMERIC)) as max_value,
            COUNT(*) as sample_count,
            date_trunc('hour', created_at) as time_bucket
          FROM onenet_data
          WHERE created_at < NOW() - INTERVAL '${sql.unsafe(compressDays.toString())} days'
          GROUP BY device_id, datastream_id, time_bucket
          ON CONFLICT (device_id, datastream_id, time_bucket)
          DO UPDATE SET
            avg_value = EXCLUDED.avg_value,
            min_value = EXCLUDED.min_value,
            max_value = EXCLUDED.max_value,
            sample_count = EXCLUDED.sample_count
        `

        // 删除已压缩的原始数据
        const deleteCompressedResult = await sql`
          DELETE FROM onenet_data
          WHERE created_at < NOW() - INTERVAL '${sql.unsafe(compressDays.toString())} days'
        `

        return NextResponse.json({
          success: true,
          action: "compress_old_data",
          compressedRows: compressResult.count || 0,
          deletedRows: deleteCompressedResult.count || 0,
          message: `成功压缩${compressDays}天前的数据，压缩间隔${intervalHours}小时`
        })

      case "vacuum":
        // 数据库清理和优化
        await sql`VACUUM ANALYZE onenet_data`

        return NextResponse.json({
          success: true,
          action: "vacuum",
          message: "数据库清理和优化完成"
        })

      default:
        return NextResponse.json({ 
          success: false, 
          error: "无效的操作类型" 
        }, { status: 400 })
    }

  } catch (error) {
    console.error("数据库清理失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "数据库清理失败",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // 获取数据库使用情况统计
    const stats = await sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT device_id) as device_count,
        COUNT(DISTINCT datastream_id) as datastream_count,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record,
        pg_size_pretty(pg_total_relation_size('onenet_data')) as table_size
      FROM onenet_data
    `

    // 按日期统计数据分布
    const dateDistribution = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM onenet_data 
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // 按设备统计数据量
    const deviceStats = await sql`
      SELECT 
        device_id,
        COUNT(*) as record_count,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM onenet_data
      GROUP BY device_id
      ORDER BY record_count DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      stats: stats[0],
      dateDistribution,
      topDevices: deviceStats
    })

  } catch (error) {
    console.error("获取数据库统计失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "获取统计信息失败" 
    }, { status: 500 })
  }
}
