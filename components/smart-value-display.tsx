'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSmartValueColor, getColorDescription, getRelativePositionText } from '@/lib/value-color-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// 全局统计数据缓存
const statsCache = new Map<string, {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}>();

// 缓存有效期：5分钟
const CACHE_DURATION = 5 * 60 * 1000;

// 获取缓存键
const getCacheKey = (deviceId: string, datastreamId: string) =>
  `${deviceId}:${datastreamId}`;

// 批量请求队列
let batchQueue: Array<{
  deviceId: string;
  datastreamId: string;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}> = [];

let batchTimeout: NodeJS.Timeout | null = null;

// 批量处理统计请求
const processBatch = async () => {
  if (batchQueue.length === 0) return;

  const currentBatch = [...batchQueue];
  batchQueue = [];

  try {
    // 构建批量请求参数
    const requests = currentBatch.map(item => ({
      device_id: item.deviceId,
      datastream_id: item.datastreamId
    }));

    const response = await fetch('/api/data/stats/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        // 处理批量响应
        currentBatch.forEach((item, index) => {
          const stats = result.stats[index];
          if (stats && stats.success) {
            // 更新缓存
            const cacheKey = getCacheKey(item.deviceId, item.datastreamId);
            statsCache.set(cacheKey, {
              data: stats.data,
              timestamp: Date.now()
            });
            item.resolve(stats.data);
          } else {
            item.reject(new Error(stats?.error || 'Failed to fetch stats'));
          }
        });
        return;
      }
    }

    // 批量请求失败，回退到单个请求
    currentBatch.forEach(item => {
      fetchSingleStats(item.deviceId, item.datastreamId)
        .then(item.resolve)
        .catch(item.reject);
    });
  } catch (error) {
    // 批量请求失败，回退到单个请求
    currentBatch.forEach(item => {
      fetchSingleStats(item.deviceId, item.datastreamId)
        .then(item.resolve)
        .catch(item.reject);
    });
  }
};

// 单个统计请求（回退方案）
const fetchSingleStats = async (deviceId: string, datastreamId: string): Promise<any> => {
  const response = await fetch(
    `/api/data/stats?device_id=${encodeURIComponent(deviceId)}&datastream_id=${encodeURIComponent(datastreamId)}`
  );

  if (response.ok) {
    const result = await response.json();
    if (result.success) {
      return result.stats;
    }
  }
  throw new Error('Failed to fetch stats');
};

// 全局统计数据获取函数
const getDatastreamStats = async (deviceId: string, datastreamId: string): Promise<any> => {
  const cacheKey = getCacheKey(deviceId, datastreamId);
  const now = Date.now();

  // 检查缓存
  const cached = statsCache.get(cacheKey);
  if (cached) {
    // 如果有正在进行的请求，等待它完成
    if (cached.promise) {
      return cached.promise;
    }

    // 如果缓存未过期，直接返回
    if (now - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  // 创建新的请求Promise
  const promise = new Promise<any>((resolve, reject) => {
    // 添加到批量队列
    batchQueue.push({
      deviceId,
      datastreamId,
      resolve,
      reject
    });

    // 设置批量处理定时器（100ms内的请求会被批量处理）
    if (batchTimeout) {
      clearTimeout(batchTimeout);
    }
    batchTimeout = setTimeout(processBatch, 100);
  });

  // 缓存promise以避免重复请求
  statsCache.set(cacheKey, {
    data: cached?.data,
    timestamp: cached?.timestamp || 0,
    promise
  });

  return promise;
};

interface SmartValueDisplayProps {
  value: number;
  deviceId: string;
  datastreamId: string;
  showTooltip?: boolean;
  showPosition?: boolean;
  className?: string;
}

export function SmartValueDisplay({
  value,
  deviceId,
  datastreamId,
  showTooltip = true,
  showPosition = false,
  className = ""
}: SmartValueDisplayProps) {
  const [colorClass, setColorClass] = useState<string>("text-blue-600");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const { getColorSync } = useSmartValueColor();

  // 立即使用缓存或回退颜色
  const initialColor = useMemo(() => {
    return getColorSync(value, deviceId, datastreamId);
  }, [value, deviceId, datastreamId, getColorSync]);

  useEffect(() => {
    // 设置初始颜色
    setColorClass(initialColor);

    // 避免重复加载
    if (hasAttemptedLoad) return;

    // 异步获取精确统计（使用全局缓存）
    const fetchStats = async () => {
      setLoading(true);
      setHasAttemptedLoad(true);

      try {
        const statsData = await getDatastreamStats(deviceId, datastreamId);
        setStats(statsData);
        // 使用新数据重新计算颜色
        const newColor = getColorSync(value, deviceId, datastreamId);
        setColorClass(newColor);
      } catch (error) {
        // 静默失败，使用回退颜色
        console.debug('获取数据流统计失败，使用回退颜色:', error);
      } finally {
        setLoading(false);
      }
    };

    // 延迟执行，避免同时发起太多请求
    const timeoutId = setTimeout(fetchStats, Math.random() * 500); // 减少延迟时间
    return () => clearTimeout(timeoutId);
  }, [deviceId, datastreamId, getColorSync, initialColor, hasAttemptedLoad, value]);

  const formatValue = (val: number): string => {
    // 安全的数值格式化
    const numVal = typeof val === 'number' && !isNaN(val) ? val : 0;
    
    // 保留2位小数
    if (Number.isInteger(numVal)) {
      return numVal.toString();
    }
    return parseFloat(numVal.toFixed(2)).toString();
  };

  const getTooltipContent = () => {
    if (!stats) {
      return (
        <div className="space-y-1">
          <div>数值: {formatValue(value)}</div>
          <div>状态: {getColorDescription(colorClass)}</div>
          <div className="text-xs text-gray-400">使用预设阈值判断</div>
        </div>
      );
    }

    const position = getRelativePositionText(value, stats.min, stats.max);
    const description = getColorDescription(colorClass);
    
    return (
      <div className="space-y-1">
        <div>数值: {formatValue(value)}</div>
        <div>状态: {description}</div>
        <div>位置: {position}</div>
        <div className="text-xs text-gray-400 border-t pt-1">
          <div>范围: {formatValue(stats.min)} - {formatValue(stats.max)}</div>
          <div>平均: {formatValue(stats.avg)}</div>
          <div>样本: {stats.count || 0} 条</div>
        </div>
      </div>
    );
  };

  const valueElement = (
    <span 
      className={`font-semibold transition-colors duration-300 ${colorClass} ${className}`}
      title={!showTooltip ? `${formatValue(value)} (${getColorDescription(colorClass)})` : undefined}
    >
      {formatValue(value)}
      {showPosition && stats && (
        <span className="text-xs text-gray-500 ml-1">
          ({getRelativePositionText(value, stats.min, stats.max)})
        </span>
      )}
      {loading && (
        <span className="text-xs text-gray-400 ml-1 animate-spin">⟳</span>
      )}
    </span>
  );

  if (!showTooltip) {
    return valueElement;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {valueElement}
        </TooltipTrigger>
        <TooltipContent>
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// 简化版本，仅显示颜色不带tooltip和API调用
export function SimpleValueDisplay({
  value,
  deviceId,
  datastreamId,
  className = ""
}: Omit<SmartValueDisplayProps, 'showTooltip' | 'showPosition'>) {
  const { getColorSync } = useSmartValueColor();
  const colorClass = getColorSync(value, deviceId, datastreamId);
  
  return (
    <span className={`font-semibold ${colorClass} ${className}`}>
      {typeof value === "number" && !isNaN(value) ? (
        Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString()
      ) : value}
    </span>
  );
}
