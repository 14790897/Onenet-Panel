import { NextRequest, NextResponse } from "next/server"
import { getDataStats } from "@/lib/database"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('device_id');
    const datastreamId = searchParams.get('datastream_id');

    // 如果有特定参数，返回数据流统计
    if (deviceId && datastreamId) {
      return getDatastreamStats(deviceId, datastreamId);
    }

    // 否则返回总体统计
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

async function getDatastreamStats(deviceId: string, datastreamId: string) {
  try {
    // 查询该数据流的统计信息
    const result = await sql`
      SELECT 
        MIN(CAST(value AS NUMERIC)) as min_value,
        MAX(CAST(value AS NUMERIC)) as max_value,
        AVG(CAST(value AS NUMERIC)) as avg_value,
        COUNT(*) as total_count,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM onenet_data 
      WHERE device_id = ${deviceId} 
        AND datastream_id = ${datastreamId}
        AND value ~ '^-?[0-9]+\.?[0-9]*$'
    `;

    if (result.length === 0 || result[0].total_count === 0) {
      return NextResponse.json({
        success: false,
        error: '未找到该数据流的数值数据'
      }, { status: 404 });
    }

    const stats = result[0];

    return NextResponse.json({
      success: true,
      stats: {
        min: parseFloat(stats.min_value),
        max: parseFloat(stats.max_value),
        avg: parseFloat(stats.avg_value),
        count: parseInt(stats.total_count),
        firstRecord: stats.first_record,
        lastRecord: stats.last_record,
        range: parseFloat(stats.max_value) - parseFloat(stats.min_value)
      },
      metadata: {
        deviceId,
        datastreamId,
        queryTime: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('获取数据流统计失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 });
  }
}
