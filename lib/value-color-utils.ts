/**
 * 智能数值颜色工具
 * 根据每个数据流的历史数据范围动态计算颜色
 * 适配无服务器环境，使用本地存储和会话缓存
 */

// 数据流统计缓存
interface DatastreamStats {
  min: number;
  max: number;
  avg: number;
  lastUpdated: number;
}

// 使用浏览器的 sessionStorage 作为缓存（仅在客户端）
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
const CACHE_PREFIX = 'iot-stats-';

/**
 * 获取缓存键
 */
function getCacheKey(deviceId: string, datastreamId: string): string {
  return `${CACHE_PREFIX}${deviceId}-${datastreamId}`;
}

/**
 * 从缓存获取统计信息（仅客户端）
 */
function getFromCache(cacheKey: string): DatastreamStats | null {
  if (typeof window === 'undefined') return null; // 服务端不使用缓存
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data = JSON.parse(cached) as DatastreamStats;
    
    // 检查是否过期
    if (Date.now() - data.lastUpdated > CACHE_DURATION) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

/**
 * 保存到缓存（仅客户端）
 */
function saveToCache(cacheKey: string, stats: DatastreamStats): void {
  if (typeof window === 'undefined') return; // 服务端不使用缓存
  
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(stats));
  } catch {
    // 忽略存储错误
  }
}

/**
 * 获取数据流的统计信息
 */
async function getDatastreamStats(
  deviceId: string, 
  datastreamId: string
): Promise<DatastreamStats | null> {
  const cacheKey = getCacheKey(deviceId, datastreamId);
  
  // 检查缓存
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // 调用API获取该数据流的统计信息
    const response = await fetch(
      `/api/data/stats?device_id=${encodeURIComponent(deviceId)}&datastream_id=${encodeURIComponent(datastreamId)}`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.stats) {
      const stats: DatastreamStats = {
        min: parseFloat(data.stats.min),
        max: parseFloat(data.stats.max),
        avg: parseFloat(data.stats.avg),
        lastUpdated: Date.now()
      };
      
      // 缓存结果
      saveToCache(cacheKey, stats);
      return stats;
    }
  } catch (error) {
    console.error('获取数据流统计失败:', error);
  }
  
  return null;
}

/**
 * 根据值在数据范围中的相对位置计算颜色
 */
export function calculateValueColor(
  value: number,
  min: number,
  max: number,
  inverted: boolean = false
): string {
  // 处理边界情况
  if (min === max) {
    return "text-blue-600"; // 默认颜色
  }
  
  // 计算相对位置 (0-1)
  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // 根据是否反转来确定颜色逻辑
  // inverted=true: 高值为好（如电池电量），inverted=false: 低值为好（如温度异常）
  const colorPosition = inverted ? normalizedValue : 1 - normalizedValue;
  
  if (colorPosition >= 0.7) {
    return "text-green-600"; // 良好
  } else if (colorPosition >= 0.4) {
    return "text-yellow-600"; // 中等
  } else if (colorPosition >= 0.2) {
    return "text-orange-600"; // 警告
  } else {
    return "text-red-600"; // 异常
  }
}

/**
 * 智能判断数据流类型是否应该反转颜色逻辑
 */
function shouldInvertColorLogic(datastreamId: string): boolean {
  const datastreamLower = datastreamId.toLowerCase();
  
  // 这些数据流类型，值越高越好
  const invertedTypes = [
    'battery', 'voltage', 'signal', 'rssi', 'quality',
    '电池', '电压', '信号', '质量'
  ];
  
  return invertedTypes.some(type => datastreamLower.includes(type));
}

/**
 * 获取智能颜色（异步版本）
 */
export async function getSmartValueColor(
  value: number,
  deviceId: string,
  datastreamId: string
): Promise<string> {
  const stats = await getDatastreamStats(deviceId, datastreamId);
  
  if (!stats) {
    // 回退到固定阈值
    return getFixedThresholdColor(value, datastreamId);
  }
  
  const inverted = shouldInvertColorLogic(datastreamId);
  return calculateValueColor(value, stats.min, stats.max, inverted);
}

/**
 * 固定阈值颜色判断（作为回退方案）
 */
function getFixedThresholdColor(value: number, datastreamId: string): string {
  const datastreamLower = datastreamId.toLowerCase();
  
  // 温度类型
  if (datastreamLower.includes('temp') || datastreamLower.includes('温度')) {
    if (value > 35 || value < 5) return "text-red-600";
    if (value > 30 || value < 10) return "text-orange-600";
    if (value > 25 || value < 15) return "text-yellow-600";
    return "text-green-600";
  }
  
  // 湿度类型
  if (datastreamLower.includes('hum') || datastreamLower.includes('湿度')) {
    if (value > 80 || value < 20) return "text-red-600";
    if (value > 70 || value < 30) return "text-orange-600";
    if (value > 60 || value < 40) return "text-yellow-600";
    return "text-green-600";
  }
  
  // 压力类型
  if (datastreamLower.includes('press') || datastreamLower.includes('压力')) {
    if (value > 1050 || value < 950) return "text-red-600";
    if (value > 1030 || value < 970) return "text-orange-600";
    if (value > 1020 || value < 980) return "text-yellow-600";
    return "text-green-600";
  }
  
  // 默认数值判断
  if (value > 80) return "text-red-600";
  if (value > 60) return "text-orange-600";
  if (value > 40) return "text-yellow-600";
  return "text-green-600";
}

/**
 * 获取颜色描述文本
 */
export function getColorDescription(colorClass: string): string {
  switch (colorClass) {
    case "text-green-600": return "正常";
    case "text-yellow-600": return "中等";
    case "text-orange-600": return "警告";
    case "text-red-600": return "异常";
    default: return "未知";
  }
}

/**
 * 获取相对位置百分比文本
 */
export function getRelativePositionText(
  value: number,
  min: number,
  max: number
): string {
  if (min === max) return "50%";
  
  const percentage = Math.round(((value - min) / (max - min)) * 100);
  return `${percentage}%`;
}

/**
 * React Hook: 使用智能颜色
 */
export function useSmartValueColor() {
  // 同步版本，使用缓存数据
  const getColorSync = (
    value: number,
    deviceId: string,
    datastreamId: string
  ): string => {
    const cacheKey = getCacheKey(deviceId, datastreamId);
    const cached = getFromCache(cacheKey);
    
    if (cached) {
      const inverted = shouldInvertColorLogic(datastreamId);
      return calculateValueColor(value, cached.min, cached.max, inverted);
    }
    
    // 使用固定阈值作为回退
    return getFixedThresholdColor(value, datastreamId);
  };
  
  return { getColorSync, getSmartValueColor };
}
