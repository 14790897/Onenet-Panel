/**
 * 时间格式化工具函数
 * 确保所有时间显示都使用用户的本地时区
 */

/**
 * 获取用户的本地时区
 */
export function getUserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * 格式化时间戳为本地时间字符串
 * @param timestamp - ISO时间戳字符串或Date对象
 * @param options - 格式化选项
 */
export function formatTimestamp(
  timestamp: string | Date,
  options?: {
    showDate?: boolean
    showTime?: boolean
    showSeconds?: boolean
    format?: 'full' | 'date' | 'time' | 'datetime' | 'short'
  }
): string {
  const {
    showDate = true,
    showTime = true,
    showSeconds = true,
    format = 'full'
  } = options || {}

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const timeZone = getUserTimeZone()

  // 预设格式
  switch (format) {
    case 'date':
      return date.toLocaleDateString('zh-CN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    
    case 'time':
      return date.toLocaleTimeString('zh-CN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined
      })
    
    case 'datetime':
      return date.toLocaleString('zh-CN', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined
      })
    
    case 'short':
      return date.toLocaleString('zh-CN', {
        timeZone,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    
    case 'full':
    default:
      // 自定义格式
      const formatOptions: Intl.DateTimeFormatOptions = {
        timeZone
      }

      if (showDate) {
        formatOptions.year = 'numeric'
        formatOptions.month = '2-digit'
        formatOptions.day = '2-digit'
      }

      if (showTime) {
        formatOptions.hour = '2-digit'
        formatOptions.minute = '2-digit'
        if (showSeconds) {
          formatOptions.second = '2-digit'
        }
      }

      return date.toLocaleString('zh-CN', formatOptions)
  }
}

/**
 * 格式化相对时间（如"5分钟前"）
 * @param timestamp - 时间戳
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return `${diffSeconds}秒前`
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    // 超过一周显示具体日期
    return formatTimestamp(date, { format: 'datetime', showSeconds: false })
  }
}

/**
 * 格式化时间范围
 * @param startTime - 开始时间
 * @param endTime - 结束时间
 */
export function formatTimeRange(
  startTime: string | Date,
  endTime: string | Date
): string {
  const start = formatTimestamp(startTime, { format: 'short' })
  const end = formatTimestamp(endTime, { format: 'short' })
  return `${start} - ${end}`
}

/**
 * 检查时间戳是否为今天
 * @param timestamp - 时间戳
 */
export function isToday(timestamp: string | Date): boolean {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const today = new Date()
  
  return date.toDateString() === today.toDateString()
}

/**
 * 获取时区信息显示
 */
export function getTimeZoneInfo(): string {
  const timeZone = getUserTimeZone()
  const offset = new Date().getTimezoneOffset()
  const offsetHours = Math.floor(Math.abs(offset) / 60)
  const offsetMinutes = Math.abs(offset) % 60
  const sign = offset <= 0 ? '+' : '-'
  
  return `${timeZone} (UTC${sign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')})`
}

/**
 * 为图表格式化时间标签
 * @param timestamp - 时间戳
 * @param granularity - 时间粒度
 */
export function formatChartTimeLabel(
  timestamp: string | Date,
  granularity: 'second' | 'minute' | 'hour' | 'day' = 'minute'
): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const timeZone = getUserTimeZone()

  switch (granularity) {
    case 'second':
      return date.toLocaleTimeString('zh-CN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    
    case 'minute':
      return date.toLocaleTimeString('zh-CN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit'
      })
    
    case 'hour':
      return date.toLocaleString('zh-CN', {
        timeZone,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit'
      })
    
    case 'day':
      return date.toLocaleDateString('zh-CN', {
        timeZone,
        month: '2-digit',
        day: '2-digit'
      })
    
    default:
      return formatTimestamp(date, { format: 'short' })
  }
}
