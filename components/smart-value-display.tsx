'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSmartValueColor, getColorDescription, getRelativePositionText } from '@/lib/value-color-utils';
import { getDatastreamStats, type DatastreamStats } from '@/lib/datastream-stats-cache';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';



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
    return getColorSync(value, datastreamId);
  }, [value, datastreamId, getColorSync]);

  useEffect(() => {
    // 设置初始颜色
    setColorClass(initialColor);

    // 避免重复加载
    if (hasAttemptedLoad) return;

    // 异步获取精确统计（使用数据流级别缓存）
    const fetchStats = async () => {
      setLoading(true);
      setHasAttemptedLoad(true);

      try {
        const statsData = await getDatastreamStats(datastreamId);
        setStats(statsData);
        // 使用新数据重新计算颜色
        const newColor = getColorSync(value, datastreamId);
        setColorClass(newColor);
      } catch (error) {
        // 静默失败，使用回退颜色
        console.debug('获取数据流统计失败，使用回退颜色:', error);
      } finally {
        setLoading(false);
      }
    };

    // 延迟执行，避免同时发起太多请求
    const timeoutId = setTimeout(fetchStats, Math.random() * 500);
    return () => clearTimeout(timeoutId);
  }, [datastreamId, getColorSync, initialColor, hasAttemptedLoad, value]);

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
  const colorClass = getColorSync(value, datastreamId);

  return (
    <span className={`font-semibold ${colorClass} ${className}`}>
      {typeof value === "number" && !isNaN(value) ? (
        Number.isInteger(value) ? value.toString() : parseFloat(value.toFixed(2)).toString()
      ) : value}
    </span>
  );
}
