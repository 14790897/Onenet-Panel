import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datastreamId = searchParams.get('datastream_id');

    if (!datastreamId) {
      return NextResponse.json(
        { success: false, error: "datastream_id is required" },
        { status: 400 }
      );
    }

    console.log(`📊 获取数据流统计: ${datastreamId}`);

    // 获取该数据流在所有设备上的全局统计数据
    const result = await sql`
      SELECT
        MIN(value) as min_value,
        MAX(value) as max_value,
        AVG(value) as avg_value,
        COUNT(*) as total_count,
        COUNT(DISTINCT device_id) as device_count,
        MIN(created_at) as first_record,
        MAX(created_at) as last_record
      FROM onenet_data
      WHERE datastream_id = ${datastreamId}
        AND value IS NOT NULL
        AND value != 'NaN'
        AND value ~ '^-?[0-9]+\.?[0-9]*$'
    `;

    if (result.length === 0 || result[0].total_count === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `未找到数据流 ${datastreamId} 的数值数据`,
        },
        { status: 404 }
      );
    }

    const stats = result[0];

    // 安全地转换数值
    const minValue = stats.min_value !== null ? Number(stats.min_value) : 0;
    const maxValue = stats.max_value !== null ? Number(stats.max_value) : 0;
    const avgValue = stats.avg_value !== null ? Number(stats.avg_value) : 0;
    const totalCount = stats.total_count !== null ? Number(stats.total_count) : 0;
    const deviceCount = stats.device_count !== null ? Number(stats.device_count) : 0;

    console.log(`✅ 数据流 ${datastreamId} 统计: ${totalCount} 条记录, ${deviceCount} 个设备, 范围: ${minValue}-${maxValue}`);

    return NextResponse.json({
      success: true,
      datastream: datastreamId,
      stats: {
        min: minValue,
        max: maxValue,
        avg: avgValue,
        count: totalCount,
        deviceCount: deviceCount,
        firstRecord: stats.first_record,
        lastRecord: stats.last_record,
        range: maxValue - minValue,
      },
      metadata: {
        datastreamId,
        queryTime: new Date().toISOString(),
        scope: 'global' // 标识这是全局统计
      },
    });

  } catch (error) {
    console.error(`❌ 获取数据流统计失败 ${request.url}:`, error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 批量获取多个数据流的统计
export async function POST(request: NextRequest) {
  try {
    const { datastreams } = await request.json();
    
    if (!Array.isArray(datastreams) || datastreams.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid datastreams format" },
        { status: 400 }
      );
    }

    console.log(`📊 批量获取数据流统计: ${datastreams.length} 个数据流`);

    const results = await Promise.allSettled(
      datastreams.map(async (datastreamId: string) => {
        const result = await sql`
          SELECT
            MIN(value) as min_value,
            MAX(value) as max_value,
            AVG(value) as avg_value,
            COUNT(*) as total_count,
            COUNT(DISTINCT device_id) as device_count,
            MIN(created_at) as first_record,
            MAX(created_at) as last_record
          FROM onenet_data
          WHERE datastream_id = ${datastreamId}
            AND value IS NOT NULL
            AND value != 'NaN'
            AND value ~ '^-?[0-9]+\.?[0-9]*$'
        `;

        if (result.length === 0 || result[0].total_count === 0) {
          return {
            success: false,
            datastream: datastreamId,
            error: "未找到数值数据"
          };
        }

        const stats = result[0];
        return {
          success: true,
          datastream: datastreamId,
          stats: {
            min: parseFloat(stats.min_value),
            max: parseFloat(stats.max_value),
            avg: parseFloat(stats.avg_value),
            count: parseInt(stats.total_count),
            deviceCount: parseInt(stats.device_count),
            firstRecord: stats.first_record,
            lastRecord: stats.last_record,
          }
        };
      })
    );

    // 处理结果
    const statsMap = {};
    results.forEach((result, index) => {
      const datastreamId = datastreams[index];
      if (result.status === 'fulfilled') {
        statsMap[datastreamId] = result.value;
      } else {
        console.error(`批量统计失败 ${datastreamId}:`, result.reason);
        statsMap[datastreamId] = {
          success: false,
          datastream: datastreamId,
          error: "请求处理失败"
        };
      }
    });

    return NextResponse.json({
      success: true,
      stats: statsMap
    });

  } catch (error) {
    console.error("批量获取数据流统计失败:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
