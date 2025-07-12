import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // 检查数据库连接
    const dbHealthy = await checkDatabaseHealth()
    
    // 检查表是否存在
    const tableExists = await checkTableExists()
    
    // 获取基本统计信息
    const stats = tableExists ? await getBasicStats() : null
    
    const health = {
      status: dbHealthy && tableExists ? 'healthy' : 'warning',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbHealthy,
        tableExists,
      },
      stats,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
      }
    }
    
    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: String(error),
      database: { connected: false, tableExists: false },
      stats: null,
    }, { status: 503 })
  }
}

async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await sql`SELECT 1`
    return true
  } catch {
    return false
  }
}

async function checkTableExists(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'onenet_data'
      )
    `
    return result[0]?.exists || false
  } catch {
    return false
  }
}

async function getBasicStats() {
  try {
    const result = await sql`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(DISTINCT datastream_id) as unique_datastreams,
        MAX(created_at) as latest_record,
        MIN(created_at) as oldest_record
      FROM onenet_data
    `
    return result[0]
  } catch {
    return null
  }
}
