import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 压缩配置常量
const COMPRESSION_INTERVAL = 30 * 60 * 1000 // 30分钟（毫秒）
const COMPRESSION_DELAY = 30 * 60 * 1000    // 压缩30分钟前的数据

interface CompressionResult {
  compressed: boolean
  compressedRows: number
  deletedRows: number
  error?: string
}

/**
 * 检查是否需要执行自动压缩
 * 每30分钟检查一次，压缩30分钟前的数据
 */
export async function checkAndCompress(): Promise<CompressionResult> {
  try {
    // 创建压缩状态表（如果不存在）
    await ensureCompressionStateTable()

    // 检查是否到了压缩时间
    const shouldCompress = await shouldPerformCompression()
    if (!shouldCompress) {
      return { compressed: false, compressedRows: 0, deletedRows: 0 }
    }

    console.log('🗜️ 开始自动数据压缩...')

    // 创建压缩表（如果不存在）
    await ensureCompressionTableExists()

    // 压缩30分钟前的数据
    const now = Date.now()
    const compressTime = new Date(now - COMPRESSION_DELAY)
    const result = await compressDataBefore(compressTime)

    // 更新压缩状态
    await updateCompressionState()

    console.log(`✅ 自动压缩完成: 压缩${result.compressedRows}行，删除${result.deletedRows}行`)

    return {
      compressed: true,
      compressedRows: result.compressedRows,
      deletedRows: result.deletedRows
    }

  } catch (error) {
    console.error('❌ 自动压缩失败:', error)
    return {
      compressed: false,
      compressedRows: 0,
      deletedRows: 0,
      error: String(error)
    }
  }
}

/**
 * 确保压缩状态表存在
 */
async function ensureCompressionStateTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS compression_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      last_check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_compression_time TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT single_row CHECK (id = 1)
    )
  `

  // 确保有一条记录
  await sql`
    INSERT INTO compression_state (id)
    VALUES (1)
    ON CONFLICT (id) DO NOTHING
  `
}

/**
 * 检查是否应该执行压缩
 */
async function shouldPerformCompression(): Promise<boolean> {
  const result = await sql`
    SELECT
      last_check_time,
      EXTRACT(EPOCH FROM (NOW() - last_check_time)) * 1000 as time_diff_ms
    FROM compression_state
    WHERE id = 1
  `

  if (result.length === 0) {
    return true // 如果没有记录，执行压缩
  }

  const timeDiff = parseFloat(result[0].time_diff_ms || '0')
  return timeDiff >= COMPRESSION_INTERVAL
}

/**
 * 更新压缩状态
 */
async function updateCompressionState(): Promise<void> {
  await sql`
    UPDATE compression_state
    SET
      last_check_time = CURRENT_TIMESTAMP,
      last_compression_time = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `
}

/**
 * 确保压缩表存在
 */
async function ensureCompressionTableExists(): Promise<void> {
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
  
  // 创建索引以提高查询性能
  await sql`
    CREATE INDEX IF NOT EXISTS idx_compressed_device_datastream_time 
    ON onenet_data_compressed (device_id, datastream_id, time_bucket)
  `
}

/**
 * 压缩指定时间之前的数据
 */
async function compressDataBefore(beforeTime: Date): Promise<{ compressedRows: number, deletedRows: number }> {
  // 按5分钟间隔压缩数据
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
      -- 修复时间分桶：正确的5分钟对齐
      date_trunc('hour', created_at) +
      INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket
    FROM onenet_data 
    WHERE created_at < ${beforeTime.toISOString()}
      AND created_at > ${new Date(beforeTime.getTime() - 60 * 60 * 1000).toISOString()} -- 只处理1小时内的数据
    GROUP BY device_id, datastream_id, time_bucket
    ON CONFLICT (device_id, datastream_id, time_bucket) 
    DO UPDATE SET
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      sample_count = EXCLUDED.sample_count
  `
  
  // 删除已压缩的原始数据
  const deleteResult = await sql`
    DELETE FROM onenet_data 
    WHERE created_at < ${beforeTime.toISOString()}
      AND created_at > ${new Date(beforeTime.getTime() - 60 * 60 * 1000).toISOString()}
  `
  
  return {
    compressedRows: compressResult.length || 0,
    deletedRows: deleteResult.length || 0
  }
}

/**
 * 获取压缩统计信息
 */
export async function getCompressionStats(): Promise<{
  originalRecords: number
  compressedRecords: number
  lastCompressionTime: Date | null
  nextCompressionTime: Date
}> {
  try {
    // 获取原始数据记录数
    const originalCount = await sql`SELECT COUNT(*) as count FROM onenet_data`
    
    // 获取压缩数据记录数
    const compressedCount = await sql`
      SELECT COUNT(*) as count FROM onenet_data_compressed 
      WHERE created_at IS NOT NULL
    `
    
    // 获取压缩状态
    const stateResult = await sql`
      SELECT last_check_time FROM compression_state WHERE id = 1
    `

    // 计算下次压缩时间
    const lastCheckTime = stateResult[0]?.last_check_time
      ? new Date(stateResult[0].last_check_time).getTime()
      : Date.now()
    const nextCompressionTime = new Date(lastCheckTime + COMPRESSION_INTERVAL)
    
    // 获取最后压缩时间
    const lastCompressed = await sql`
      SELECT MAX(created_at) as last_time FROM onenet_data_compressed
    `
    
    return {
      originalRecords: parseInt(originalCount[0].count),
      compressedRecords: parseInt(compressedCount[0].count),
      lastCompressionTime: lastCompressed[0].last_time ? new Date(lastCompressed[0].last_time) : null,
      nextCompressionTime
    }
  } catch (error) {
    console.error('获取压缩统计失败:', error)
    return {
      originalRecords: 0,
      compressedRecords: 0,
      lastCompressionTime: null,
      nextCompressionTime: new Date()
    }
  }
}

/**
 * 手动触发压缩（用于测试）
 */
export async function manualCompress(): Promise<CompressionResult> {
  // 重置检查时间，强制执行压缩
  await sql`
    UPDATE compression_state
    SET last_check_time = CURRENT_TIMESTAMP - INTERVAL '1 hour'
    WHERE id = 1
  `
  return await checkAndCompress()
}
