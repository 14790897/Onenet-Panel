interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>()

  set<T>(key: string, data: T, ttlMs = 300000): void { // 默认5分钟TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // 清理过期的缓存项
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length
    }
  }
}

// 全局缓存实例
export const dataCache = new DataCache()

// 定期清理过期缓存（每10分钟）
setInterval(() => {
  dataCache.cleanup()
}, 10 * 60 * 1000)

// 缓存键生成函数
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  return `${prefix}:${sortedParams}`
}

// 包装函数，自动处理缓存
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 300000
): Promise<T> {
  // 尝试从缓存获取
  const cached = dataCache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // 缓存未命中，执行fetcher
  const data = await fetcher()
  dataCache.set(key, data, ttlMs)
  return data
}
