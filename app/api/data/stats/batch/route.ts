import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { requests } = await request.json();

    console.log(`📊 批量统计请求: ${requests.length} 个统计查询`);

    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid requests format" },
        { status: 400 }
      );
    }

    // 限制批量请求数量
    if (requests.length > 50) {
      return NextResponse.json(
        { success: false, error: "Too many requests in batch (max 50)" },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      requests.map(async (req: { device_id: string; datastream_id: string }) => {
        try {
          const result = await sql`
            SELECT
              MIN(value) as min_value,
              MAX(value) as max_value,
              AVG(value) as avg_value,
              COUNT(*) as total_count,
              MIN(created_at) as first_record,
              MAX(created_at) as last_record
            FROM onenet_data
            WHERE device_id = ${req.device_id}
              AND datastream_id = ${req.datastream_id}
              AND value IS NOT NULL
              AND value != 'NaN'
          `;

          if (result.length === 0 || result[0].total_count === 0) {
            return {
              success: false,
              error: "未找到该数据流的数值数据"
            };
          }

          const stats = result[0];
          return {
            success: true,
            data: {
              min: parseFloat(stats.min_value),
              max: parseFloat(stats.max_value),
              avg: parseFloat(stats.avg_value),
              count: parseInt(stats.total_count),
              firstRecord: stats.first_record,
              lastRecord: stats.last_record,
            }
          };
        } catch (error) {
          console.error(`获取统计失败 ${req.device_id}:${req.datastream_id}:`, error);
          return {
            success: false,
            error: "数据库查询失败"
          };
        }
      })
    );

    // 处理结果
    const stats = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`批量统计请求失败 ${requests[index].device_id}:${requests[index].datastream_id}:`, result.reason);
        return {
          success: false,
          error: "请求处理失败"
        };
      }
    });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("批量获取统计失败:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
