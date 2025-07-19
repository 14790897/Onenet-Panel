import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// 数据源类型
export type DataSource = 'original' | 'compressed' | 'mixed'

// 查询结果接口
export interface DataPoint {
  device_id: string
  datastream_id: string
  value: number
  created_at: string
  time_bucket?: string
  device_name?: string
  data_source?: DataSource
  sample_count?: number
  min_value?: number
  max_value?: number
}

// 查询参数接口
export interface QueryParams {
  devices: string[]
  datastream: string
  startDate: string
  endDate: string
  limit?: number
  interval?: string
}

/**
 * 智能数据读取器
 * 根据查询时间范围自动选择最优的数据源
 */
export class SmartDataReader {
  
  // 压缩数据的时间阈值（30分钟前的数据可能已被压缩）
  private static COMPRESSION_THRESHOLD = 30 * 60 * 1000 // 30分钟

  /**
   * 决定使用哪个数据源
   */
  static determineDataSource(startDate: string, endDate: string): DataSource {
    // 暂时禁用压缩数据，直到数据库连接问题解决
    // TODO: 重新启用压缩数据功能
    console.log('⚠️ 暂时使用原始数据源，跳过压缩数据')
    return 'original'

    /* 原始逻辑（暂时注释）
    const now = Date.now()
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()

    // 如果查询范围完全在压缩阈值之前，使用压缩数据
    if (end < now - this.COMPRESSION_THRESHOLD) {
      return 'compressed'
    }

    // 如果查询范围完全在压缩阈值之后，使用原始数据
    if (start >= now - this.COMPRESSION_THRESHOLD) {
      return 'original'
    }

    // 如果查询范围跨越压缩阈值，使用混合模式
    return 'mixed'
    */
  }

  /**
   * 智能查询数据
   */
  static async queryData(params: QueryParams): Promise<DataPoint[]> {
    const dataSource = this.determineDataSource(params.startDate, params.endDate)
    console.log('🎯 选择数据源:', dataSource)

    try {
      switch (dataSource) {
        case 'original':
          return await this.queryOriginalData(params)
        case 'compressed':
          // 尝试查询压缩数据，如果失败则回退到原始数据
          try {
            const compressedData = await this.queryCompressedData(params)
            if (compressedData.length === 0) {
              console.log('⚠️ 压缩数据为空，回退到原始数据')
              return await this.queryOriginalData(params)
            }
            return compressedData
          } catch (error) {
            console.warn('⚠️ 压缩数据查询失败，回退到原始数据:', error instanceof Error ? error.message : String(error))
            return await this.queryOriginalData(params)
          }
        case 'mixed':
          return await this.queryMixedData(params)
        default:
          console.warn(`⚠️ 未知数据源: ${dataSource}，使用原始数据`)
          return await this.queryOriginalData(params)
      }
    } catch (error) {
      console.error('❌ 智能查询失败，回退到原始数据:', error)
      return await this.queryOriginalData(params)
    }
  }

  /**
   * 查询原始数据
   */
  private static async queryOriginalData(params: QueryParams): Promise<DataPoint[]> {
    const { devices, datastream, startDate, endDate, limit = 1000, interval } = params

    try {
      console.log('📊 查询原始数据:', { devices, datastream, startDate, endDate, limit, interval })

      // 根据间隔选择不同的查询策略
      if (interval && interval !== 'auto') {
        return this.queryOriginalDataWithInterval(params)
      }

      // 简单查询
      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          CAST(value AS NUMERIC) as value,
          created_at,
          raw_data->>'deviceName' as device_name,
          'original' as data_source
        FROM onenet_data
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        ORDER BY created_at ASC
        LIMIT ${limit * devices.length}
      `

      console.log(`📊 原始数据查询结果: ${data.length} 条记录`)

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value || 0),
        created_at: row.created_at,
        device_name: row.device_name,
        data_source: 'original' as DataSource
      }))
    } catch (error) {
      console.error('❌ 原始数据查询失败:', error)
      // 如果原始数据查询失败，返回空数组
      return []
    }
  }

  /**
   * 确保压缩数据表存在
   */
  private static async ensureCompressedTableExists(): Promise<boolean> {
    try {
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

      return true
    } catch (error) {
      console.error('❌ 创建压缩数据表失败:', error)
      return false
    }
  }

  /**
   * 查询压缩数据
   */
  private static async queryCompressedData(params: QueryParams): Promise<DataPoint[]> {
    const { devices, datastream, startDate, endDate, limit = 1000 } = params

    try {
      console.log('🗜️ 查询压缩数据:', { devices, datastream, startDate, endDate, limit })

      // 确保压缩表存在
      const tableExists = await this.ensureCompressedTableExists()
      if (!tableExists) {
        console.warn('⚠️ 压缩数据表不存在且创建失败，跳过压缩数据查询')
        return []
      }

      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          avg_value as value,
          min_value,
          max_value,
          sample_count,
          time_bucket as created_at,
          'compressed' as data_source
        FROM onenet_data_compressed
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND time_bucket BETWEEN ${startDate} AND ${endDate}
        ORDER BY time_bucket ASC
        LIMIT ${limit * devices.length}
      `

      console.log(`🗜️ 压缩数据查询结果: ${data.length} 条记录`)

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value || 0),
        created_at: row.created_at,
        time_bucket: row.created_at,
        data_source: 'compressed' as DataSource,
        sample_count: row.sample_count || 0,
        min_value: parseFloat(row.min_value || 0),
        max_value: parseFloat(row.max_value || 0)
      }))
    } catch (error) {
      console.error('❌ 压缩数据查询失败:', error)
      // 如果压缩数据查询失败，返回空数组
      return []
    }
  }

  /**
   * 查询混合数据（压缩数据 + 原始数据）
   */
  private static async queryMixedData(params: QueryParams): Promise<DataPoint[]> {
    const now = Date.now()
    const compressionBoundary = new Date(now - this.COMPRESSION_THRESHOLD).toISOString()

    let compressedData: DataPoint[] = []
    let originalData: DataPoint[] = []

    // 查询压缩数据（较早的数据）
    try {
      const compressedParams = {
        ...params,
        endDate: compressionBoundary
      }
      compressedData = await this.queryCompressedData(compressedParams)
    } catch (error) {
      console.warn('⚠️ 混合查询中压缩数据失败:', error instanceof Error ? error.message : String(error))
    }

    // 查询原始数据（较新的数据）
    try {
      const originalParams = {
        ...params,
        startDate: compressionBoundary
      }
      originalData = await this.queryOriginalData(originalParams)
    } catch (error) {
      console.warn('⚠️ 混合查询中原始数据失败:', error instanceof Error ? error.message : String(error))
      // 如果原始数据也失败，尝试查询整个时间范围的原始数据
      try {
        console.log('🔄 尝试查询整个时间范围的原始数据作为回退')
        originalData = await this.queryOriginalData(params)
      } catch (fallbackError) {
        console.error('❌ 回退查询也失败:', fallbackError instanceof Error ? fallbackError.message : String(fallbackError))
      }
    }

    // 合并数据并排序
    const allData = [...compressedData, ...originalData]
    return allData.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  /**
   * 带间隔的原始数据查询
   */
  private static async queryOriginalDataWithInterval(params: QueryParams): Promise<DataPoint[]> {
    const { devices, datastream, startDate, endDate, limit = 1000, interval } = params

    if (interval === '1m') {
      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          AVG(CAST(value AS NUMERIC)) as value,
          date_trunc('minute', created_at) as time_bucket,
          raw_data->>'deviceName' as device_name,
          'original' as data_source
        FROM onenet_data
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY device_id, datastream_id, time_bucket, device_name
        ORDER BY time_bucket ASC
        LIMIT ${limit * devices.length}
      `

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value),
        created_at: row.time_bucket,
        time_bucket: row.time_bucket,
        device_name: row.device_name,
        data_source: 'original' as DataSource
      }))
    }

    if (interval && ['5m', '15m', '30m'].includes(interval)) {
      const minuteInterval = parseInt(interval.replace('m', ''))
      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          AVG(CAST(value AS NUMERIC)) as value,
          date_trunc('hour', created_at) +
          INTERVAL '${sql.unsafe(minuteInterval.toString())} minutes' *
          FLOOR(EXTRACT(minute FROM created_at) / ${minuteInterval}) as time_bucket,
          raw_data->>'deviceName' as device_name,
          'original' as data_source
        FROM onenet_data
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY device_id, datastream_id, time_bucket, device_name
        ORDER BY time_bucket ASC
        LIMIT ${limit * devices.length}
      `

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value),
        created_at: row.time_bucket,
        time_bucket: row.time_bucket,
        device_name: row.device_name,
        data_source: 'original' as DataSource
      }))
    }

    if (interval && ['1h', '3h', '6h', '12h'].includes(interval)) {
      const hourInterval = parseInt(interval.replace('h', ''))
      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          AVG(CAST(value AS NUMERIC)) as value,
          date_trunc('hour', created_at) +
          INTERVAL '${sql.unsafe(hourInterval.toString())} hours' *
          FLOOR(EXTRACT(hour FROM created_at) / ${hourInterval}) as time_bucket,
          raw_data->>'deviceName' as device_name,
          'original' as data_source
        FROM onenet_data
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY device_id, datastream_id, time_bucket, device_name
        ORDER BY time_bucket ASC
        LIMIT ${limit * devices.length}
      `

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value),
        created_at: row.time_bucket,
        time_bucket: row.time_bucket,
        device_name: row.device_name,
        data_source: 'original' as DataSource
      }))
    }

    if (interval === '1d') {
      const data = await sql`
        SELECT
          device_id,
          datastream_id,
          AVG(CAST(value AS NUMERIC)) as value,
          date_trunc('day', created_at) as time_bucket,
          raw_data->>'deviceName' as device_name,
          'original' as data_source
        FROM onenet_data
        WHERE device_id = ANY(${devices})
          AND datastream_id = ${datastream}
          AND created_at BETWEEN ${startDate} AND ${endDate}
        GROUP BY device_id, datastream_id, time_bucket, device_name
        ORDER BY time_bucket ASC
        LIMIT ${limit * devices.length}
      `

      return data.map(row => ({
        device_id: row.device_id,
        datastream_id: row.datastream_id,
        value: parseFloat(row.value),
        created_at: row.time_bucket,
        time_bucket: row.time_bucket,
        device_name: row.device_name,
        data_source: 'original' as DataSource
      }))
    }

    // 默认情况，使用简单查询
    return this.queryOriginalData(params)
  }

  /**
   * 获取数据源统计信息
   */
  static async getDataSourceStats(params: QueryParams) {
    const dataSource = this.determineDataSource(params.startDate, params.endDate)
    
    const stats = {
      dataSource,
      compressionThreshold: new Date(Date.now() - this.COMPRESSION_THRESHOLD).toISOString(),
      queryRange: {
        start: params.startDate,
        end: params.endDate
      }
    }
    
    return stats
  }
}

/**
 * 便捷函数：智能查询设备数据
 */
export async function smartQueryDeviceData(params: QueryParams): Promise<DataPoint[]> {
  return SmartDataReader.queryData(params)
}

/**
 * 便捷函数：获取数据源信息
 */
export async function getDataSourceInfo(startDate: string, endDate: string) {
  return SmartDataReader.getDataSourceStats({
    devices: [],
    datastream: '',
    startDate,
    endDate
  })
}
