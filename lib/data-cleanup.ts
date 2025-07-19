import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 数据清理配置
const CLEANUP_CONFIG = {
  // 保留原始数据的时间（1小时）
  KEEP_ORIGINAL_HOURS: 1,
  // 批量删除大小
  BATCH_SIZE: 1000,
  // 最大删除次数（防止无限循环）
  MAX_DELETE_BATCHES: 100
}

export interface CleanupResult {
  success: boolean
  deletedRows: number
  compressedRows: number
  error?: string
  stats: {
    originalRecordsBeforeCleanup: number
    originalRecordsAfterCleanup: number
    compressedRecords: number
    cleanupThreshold: string
  }
}

/**
 * 执行数据清理
 * 1. 压缩旧数据
 * 2. 删除已压缩的原始数据
 * 3. 只保留最近1小时的原始数据
 */
export async function performDataCleanup(): Promise<CleanupResult> {
  try {
    console.log('🧹 开始数据清理...')
    
    // 获取清理前的统计信息
    const statsBefore = await getDataStats()
    
    // 计算清理阈值（保留最近1小时的数据）
    const cleanupThreshold = new Date(Date.now() - CLEANUP_CONFIG.KEEP_ORIGINAL_HOURS * 60 * 60 * 1000)
    const cleanupThresholdISO = cleanupThreshold.toISOString()
    
    console.log(`📅 清理阈值: ${cleanupThresholdISO}`)
    
    // 1. 首先压缩旧数据
    const compressedRows = await compressOldData(cleanupThreshold)
    console.log(`🗜️ 压缩了 ${compressedRows} 行数据`)
    
    // 2. 删除已压缩的原始数据
    const deletedRows = await deleteOldOriginalData(cleanupThreshold)
    console.log(`🗑️ 删除了 ${deletedRows} 行原始数据`)
    
    // 获取清理后的统计信息
    const statsAfter = await getDataStats()
    
    const result: CleanupResult = {
      success: true,
      deletedRows,
      compressedRows,
      stats: {
        originalRecordsBeforeCleanup: statsBefore.originalRecords,
        originalRecordsAfterCleanup: statsAfter.originalRecords,
        compressedRecords: statsAfter.compressedRecords,
        cleanupThreshold: cleanupThresholdISO
      }
    }
    
    console.log('✅ 数据清理完成:', result)
    return result
    
  } catch (error) {
    console.error('❌ 数据清理失败:', error)
    return {
      success: false,
      deletedRows: 0,
      compressedRows: 0,
      error: String(error),
      stats: {
        originalRecordsBeforeCleanup: 0,
        originalRecordsAfterCleanup: 0,
        compressedRecords: 0,
        cleanupThreshold: ''
      }
    }
  }
}

/**
 * 压缩旧数据
 */
async function compressOldData(beforeTime: Date): Promise<number> {
  // 确保压缩表存在
  await ensureCompressionTableExists()
  
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
      -- 5分钟时间分桶
      date_trunc('hour', created_at) +
      INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket
    FROM onenet_data 
    WHERE created_at < ${beforeTime.toISOString()}
    GROUP BY device_id, datastream_id, time_bucket
    ON CONFLICT (device_id, datastream_id, time_bucket) 
    DO UPDATE SET
      avg_value = EXCLUDED.avg_value,
      min_value = EXCLUDED.min_value,
      max_value = EXCLUDED.max_value,
      sample_count = EXCLUDED.sample_count
  `
  
  return compressResult.length || 0
}

/**
 * 删除已压缩的原始数据
 */
async function deleteOldOriginalData(beforeTime: Date): Promise<number> {
  let totalDeleted = 0
  let batchCount = 0
  
  while (batchCount < CLEANUP_CONFIG.MAX_DELETE_BATCHES) {
    // 批量删除以避免长时间锁定
    const deleteResult = await sql`
      DELETE FROM onenet_data 
      WHERE id IN (
        SELECT id FROM onenet_data 
        WHERE created_at < ${beforeTime.toISOString()}
        LIMIT ${CLEANUP_CONFIG.BATCH_SIZE}
      )
    `
    
    const deletedInBatch = deleteResult.length || 0
    totalDeleted += deletedInBatch
    batchCount++
    
    console.log(`🗑️ 批次 ${batchCount}: 删除了 ${deletedInBatch} 行`)
    
    // 如果这一批删除的行数少于批量大小，说明已经删除完了
    if (deletedInBatch < CLEANUP_CONFIG.BATCH_SIZE) {
      break
    }
    
    // 短暂休息，避免过度占用数据库资源
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return totalDeleted
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
 * 获取数据统计信息
 */
async function getDataStats() {
  const originalCount = await sql`SELECT COUNT(*) as count FROM onenet_data`
  const compressedCount = await sql`SELECT COUNT(*) as count FROM onenet_data_compressed`
  
  return {
    originalRecords: parseInt(originalCount[0].count),
    compressedRecords: parseInt(compressedCount[0].count)
  }
}

/**
 * 获取数据分布统计
 */
export async function getDataDistributionStats() {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // 原始数据分布
    const originalStats = await sql`
      SELECT 
        COUNT(CASE WHEN created_at >= ${oneHourAgo.toISOString()} THEN 1 END) as last_hour,
        COUNT(CASE WHEN created_at >= ${oneDayAgo.toISOString()} THEN 1 END) as last_day,
        COUNT(CASE WHEN created_at >= ${oneWeekAgo.toISOString()} THEN 1 END) as last_week,
        COUNT(*) as total
      FROM onenet_data
    `
    
    // 压缩数据分布
    const compressedStats = await sql`
      SELECT 
        COUNT(CASE WHEN time_bucket >= ${oneHourAgo.toISOString()} THEN 1 END) as last_hour,
        COUNT(CASE WHEN time_bucket >= ${oneDayAgo.toISOString()} THEN 1 END) as last_day,
        COUNT(CASE WHEN time_bucket >= ${oneWeekAgo.toISOString()} THEN 1 END) as last_week,
        COUNT(*) as total
      FROM onenet_data_compressed
    `
    
    return {
      original: {
        lastHour: parseInt(originalStats[0].last_hour),
        lastDay: parseInt(originalStats[0].last_day),
        lastWeek: parseInt(originalStats[0].last_week),
        total: parseInt(originalStats[0].total)
      },
      compressed: {
        lastHour: parseInt(compressedStats[0].last_hour),
        lastDay: parseInt(compressedStats[0].last_day),
        lastWeek: parseInt(compressedStats[0].last_week),
        total: parseInt(compressedStats[0].total)
      },
      cleanupThreshold: oneHourAgo.toISOString()
    }
  } catch (error) {
    console.error('获取数据分布统计失败:', error)
    return null
  }
}

/**
 * 检查是否需要清理
 */
export async function shouldPerformCleanup(): Promise<boolean> {
  try {
    const stats = await getDataDistributionStats()
    if (!stats) return false
    
    // 如果原始数据表中有超过1小时的数据，就需要清理
    const oldDataCount = stats.original.total - stats.original.lastHour
    return oldDataCount > 0
  } catch (error) {
    console.error('检查清理需求失败:', error)
    return false
  }
}
