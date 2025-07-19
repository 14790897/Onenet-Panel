import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("device_id")
    const datastream = searchParams.get("datastream")
    const limit = Math.min(Number.parseInt(searchParams.get("limit") || "50"), 1000)
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let whereConditions = []
    let params: any[] = []

    if (deviceId) {
      whereConditions.push(`device_id = $${params.length + 1}`)
      params.push(deviceId)
    }

    if (datastream) {
      whereConditions.push(`datastream_id = $${params.length + 1}`)
      params.push(datastream)
    }

    if (startDate) {
      whereConditions.push(`time_bucket >= $${params.length + 1}`)
      params.push(startDate)
    }

    if (endDate) {
      whereConditions.push(`time_bucket <= $${params.length + 1}`)
      params.push(endDate)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // 查询压缩数据
    const compressedData = await sql`
      SELECT 
        id,
        device_id,
        datastream_id,
        avg_value as value,
        min_value,
        max_value,
        sample_count,
        time_bucket as created_at,
        'compressed' as data_type
      FROM onenet_data_compressed 
      ${sql.unsafe(whereClause)}
      ORDER BY time_bucket DESC 
      LIMIT ${limit} OFFSET ${offset}
    `

    // 获取总数
    let totalCount = undefined
    if (offset === 0) {
      const countResult = await sql`
        SELECT COUNT(*) as total 
        FROM onenet_data_compressed 
        ${sql.unsafe(whereClause)}
      `
      totalCount = parseInt(countResult[0].total)
    }

    // 转换数据格式以兼容前端
    const formattedData = compressedData.map(row => ({
      id: row.id,
      device_id: row.device_id,
      datastream_id: row.datastream_id,
      value: row.value.toString(),
      created_at: row.created_at,
      timestamp: row.created_at,
      raw_data: {
        compressed: true,
        avg_value: parseFloat(row.value),
        min_value: parseFloat(row.min_value),
        max_value: parseFloat(row.max_value),
        sample_count: row.sample_count,
        data_type: 'compressed_average'
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        limit,
        offset,
        hasMore: compressedData.length === limit,
        totalCount
      },
      meta: {
        dataType: 'compressed',
        description: '压缩数据（平均值）'
      }
    })

  } catch (error) {
    console.error("查询压缩数据失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "查询压缩数据失败",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
