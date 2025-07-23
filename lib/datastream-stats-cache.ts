// 数据流统计数据类型
export interface DatastreamStats {
  min: number;
  max: number;
  avg: number;
  count: number;
  deviceCount: number;
  firstRecord?: string;
  lastRecord?: string;
  range?: number;
}

// 缓存项类型
interface CacheItem {
  stats: DatastreamStats;
  timestamp: number;
  promise?: Promise<DatastreamStats | null>;
}

// 全局数据流统计缓存
const datastreamStatsCache = new Map<string, CacheItem>();

// 缓存有效期：1小时（数据流统计相对稳定）
const CACHE_DURATION = 60 * 60 * 1000;

// 批量请求队列
let batchQueue: Array<{
  datastreamId: string;
  resolve: (data: DatastreamStats | null) => void;
  reject: (error: any) => void;
}> = [];

let batchTimeout: NodeJS.Timeout | null = null;

/**
 * 批量处理数据流统计请求
 */
const processBatch = async () => {
  if (batchQueue.length === 0) return;
  
  const currentBatch = [...batchQueue];
  batchQueue = [];
  
  console.log(`🔄 批量处理数据流统计请求: ${currentBatch.length} 个数据流`);
  
  try {
    const datastreams = currentBatch.map(item => item.datastreamId);
    
    const response = await fetch('/api/data/stats/datastream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ datastreams })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        const now = Date.now();
        
        // 处理批量响应
        currentBatch.forEach((item) => {
          const statsResult = result.stats[item.datastreamId];
          if (statsResult && statsResult.success) {
            // 更新缓存
            datastreamStatsCache.set(item.datastreamId, {
              stats: statsResult.stats,
              timestamp: now
            });
            item.resolve(statsResult.stats);
          } else {
            item.reject(new Error(statsResult?.error || 'Failed to fetch datastream stats'));
          }
        });
        return;
      }
    }
    
    // 批量请求失败，回退到单个请求
    console.warn('⚠️ 批量请求失败，回退到单个请求');
    currentBatch.forEach(item => {
      fetchSingleDatastreamStats(item.datastreamId)
        .then(item.resolve)
        .catch(item.reject);
    });
  } catch (error) {
    console.error('❌ 批量请求处理失败:', error);
    // 批量请求失败，回退到单个请求
    currentBatch.forEach(item => {
      fetchSingleDatastreamStats(item.datastreamId)
        .then(item.resolve)
        .catch(item.reject);
    });
  }
};

/**
 * 单个数据流统计请求（回退方案）
 */
const fetchSingleDatastreamStats = async (datastreamId: string): Promise<DatastreamStats | null> => {
  const response = await fetch(
    `/api/data/stats/datastream?datastream_id=${encodeURIComponent(datastreamId)}`
  );
  
  if (response.ok) {
    const result = await response.json();
    if (result.success) {
      return result.stats;
    }
  }
  throw new Error('Failed to fetch datastream stats');
};

/**
 * 获取数据流统计数据（主要接口）
 */
export const getDatastreamStats = async (datastreamId: string): Promise<DatastreamStats | null> => {
  const now = Date.now();
  
  // 检查缓存
  const cached = datastreamStatsCache.get(datastreamId);
  if (cached) {
    // 如果有正在进行的请求，等待它完成
    if (cached.promise) {
      return cached.promise;
    }
    
    // 如果缓存未过期，直接返回
    if (now - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 使用缓存的数据流统计: ${datastreamId}`);
      return cached.stats;
    }
  }
  
  // 创建新的请求Promise
  const promise = new Promise<DatastreamStats | null>((resolve, reject) => {
    // 添加到批量队列
    batchQueue.push({
      datastreamId,
      resolve,
      reject
    });
    
    // 设置批量处理定时器（200ms内的请求会被批量处理）
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(processBatch, 200);
  });
  
  // 缓存promise以避免重复请求
  datastreamStatsCache.set(datastreamId, {
    stats: cached?.stats || {} as DatastreamStats,
    timestamp: cached?.timestamp || 0,
    promise
  });
  
  return promise;
};

/**
 * 预加载多个数据流的统计数据
 */
export const preloadDatastreamStats = async (datastreamIds: string[]): Promise<Map<string, DatastreamStats | null>> => {
  console.log(`🔄 预加载数据流统计: ${datastreamIds.length} 个数据流`);
  
  const results = await Promise.allSettled(
    datastreamIds.map(id => getDatastreamStats(id))
  );
  
  const statsMap = new Map<string, DatastreamStats | null>();
  datastreamIds.forEach((id, index) => {
    const result = results[index];
    if (result.status === 'fulfilled') {
      statsMap.set(id, result.value);
    } else {
      console.error(`预加载数据流统计失败 ${id}:`, result.reason);
      statsMap.set(id, null);
    }
  });
  
  return statsMap;
};

/**
 * 清除缓存
 */
export const clearDatastreamStatsCache = () => {
  datastreamStatsCache.clear();
  console.log('🗑️ 数据流统计缓存已清除');
};

/**
 * 获取缓存状态
 */
export const getCacheStatus = () => {
  const now = Date.now();
  const cacheEntries = Array.from(datastreamStatsCache.entries()).map(([key, value]) => ({
    datastream: key,
    age: now - value.timestamp,
    expired: now - value.timestamp > CACHE_DURATION,
    hasPromise: !!value.promise
  }));
  
  return {
    totalEntries: datastreamStatsCache.size,
    validEntries: cacheEntries.filter(e => !e.expired).length,
    expiredEntries: cacheEntries.filter(e => e.expired).length,
    pendingRequests: cacheEntries.filter(e => e.hasPromise).length,
    entries: cacheEntries
  };
};

/**
 * 同步获取缓存的统计数据（用于立即显示）
 */
export const getCachedDatastreamStats = (datastreamId: string): DatastreamStats | null => {
  const cached = datastreamStatsCache.get(datastreamId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.stats;
  }
  return null;
};
