import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // 检查表是否已存在
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'onenet_data'
      );
    `

    if (tableExists[0].exists) {
      return NextResponse.json({
        success: true,
        message: "数据库表已存在，无需重复创建",
        tableExists: true,
      })
    }

    // 创建表
    await sql`
      CREATE TABLE onenet_data (
        id SERIAL PRIMARY KEY,
        device_id VARCHAR(100) NOT NULL,
        datastream_id VARCHAR(100) NOT NULL,
        value DECIMAL(10,4) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_value CHECK (value IS NOT NULL)
      )
    `

    // 创建索引
    await sql`CREATE INDEX idx_onenet_device_timestamp ON onenet_data(device_id, timestamp DESC)`
    await sql`CREATE INDEX idx_onenet_datastream ON onenet_data(datastream_id)`
    await sql`CREATE INDEX idx_onenet_timestamp ON onenet_data(timestamp DESC)`
    await sql`CREATE INDEX idx_onenet_device_id ON onenet_data(device_id)`

    // 插入测试数据
    await sql`
      INSERT INTO onenet_data (device_id, datastream_id, value, raw_data) VALUES
      ('device_001', 'temperature', 25.6, '{"unit": "celsius", "location": "room1"}'),
      ('device_001', 'humidity', 65.2, '{"unit": "percent", "location": "room1"}'),
      ('device_002', 'temperature', 23.8, '{"unit": "celsius", "location": "room2"}'),
      ('device_002', 'pressure', 1013.25, '{"unit": "hPa", "location": "room2"}')
    `

    return NextResponse.json({
      success: true,
      message: "数据库初始化成功，已创建表和测试数据",
      tableExists: false,
    })
  } catch (error) {
    console.error("数据库初始化错误:", error)
    return NextResponse.json(
      {
        success: false,
        error: "数据库初始化失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // 检查数据库连接和表状态
    const tableInfo = await sql`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'onenet_data'
      ORDER BY ordinal_position
    `

    const recordCount = await sql`SELECT COUNT(*) as count FROM onenet_data`

    return NextResponse.json({
      success: true,
      tableExists: tableInfo.length > 0,
      columns: tableInfo,
      recordCount: recordCount[0]?.count || 0,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "无法连接数据库",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    )
  }
}
