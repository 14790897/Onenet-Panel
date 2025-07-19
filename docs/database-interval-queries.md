# 数据库按间隔查询指南

本文档详细介绍如何在PostgreSQL中实现基于时间间隔的数据查询，以优化大数据集的分析性能。

## 🎯 核心概念

### 问题背景
- 原始数据可能每秒/每分钟都有记录
- 直接查询大时间范围会返回数万条记录
- 前端图表渲染性能差，用户体验不佳
- 网络传输数据量大，响应慢

### 解决方案
通过数据库层面的时间间隔聚合，将原始数据按指定时间窗口进行分组和平均化。

## 📚 SQL查询方法

### 1. 使用 `date_trunc()` 函数

最常用的方法，将时间戳截断到指定精度：

```sql
-- 按分钟聚合
SELECT 
  device_id,
  datastream_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('minute', created_at) as time_bucket
FROM onenet_data 
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-02'
GROUP BY device_id, datastream_id, time_bucket
ORDER BY time_bucket ASC;

-- 按小时聚合
SELECT 
  device_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('hour', created_at) as time_bucket
FROM onenet_data 
GROUP BY device_id, time_bucket;

-- 按天聚合
SELECT 
  device_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('day', created_at) as time_bucket
FROM onenet_data 
GROUP BY device_id, time_bucket;
```

### 2. 自定义时间间隔

对于5分钟、15分钟、30分钟等自定义间隔：

```sql
-- 5分钟间隔
SELECT 
  device_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('hour', created_at) + 
  INTERVAL '5 minutes' * 
  FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket
FROM onenet_data 
GROUP BY device_id, time_bucket
ORDER BY time_bucket;

-- 15分钟间隔
SELECT 
  device_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('hour', created_at) + 
  INTERVAL '15 minutes' * 
  FLOOR(EXTRACT(minute FROM created_at) / 15) as time_bucket
FROM onenet_data 
GROUP BY device_id, time_bucket;
```

### 3. 小时级自定义间隔

对于3小时、6小时、12小时间隔：

```sql
-- 6小时间隔
SELECT 
  device_id,
  AVG(CAST(value AS NUMERIC)) as value,
  date_trunc('day', created_at) + 
  INTERVAL '6 hours' * 
  FLOOR(EXTRACT(hour FROM created_at) / 6) as time_bucket
FROM onenet_data 
GROUP BY device_id, time_bucket
ORDER BY time_bucket;
```

## 🚀 实际应用示例

### Node.js + Neon 实现

```typescript
// 数据库层面的时间间隔查询函数
async function executeIntervalQuery(
  devices: string[], 
  datastream: string, 
  startDate: string, 
  endDate: string, 
  interval: string
) {
  const sql = neon(process.env.DATABASE_URL!)
  
  if (interval === '1m') {
    // 1分钟间隔
    return await sql`
      SELECT 
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('minute', created_at) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data 
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
    `
  } else if (interval === '5m') {
    // 5分钟间隔
    return await sql`
      SELECT 
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('hour', created_at) + 
        INTERVAL '5 minutes' * 
        FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data 
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
    `
  } else if (interval === '1h') {
    // 1小时间隔
    return await sql`
      SELECT 
        device_id,
        datastream_id,
        AVG(CAST(value AS NUMERIC)) as value,
        date_trunc('hour', created_at) as time_bucket,
        raw_data->>'deviceName' as device_name
      FROM onenet_data 
      WHERE device_id = ANY(${devices})
        AND datastream_id = ${datastream}
        AND created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY device_id, datastream_id, time_bucket, device_name
      ORDER BY time_bucket ASC
    `
  }
  // ... 其他间隔类似实现
}
```

## 📈 性能对比

### 测试结果（24小时数据）

| 间隔 | 数据点数 | 响应时间 | 数据减少率 |
|------|----------|----------|------------|
| 原始数据 | ~50,000 | >5000ms | 0% |
| 1分钟 | 961 | 2290ms | 98% |
| 5分钟 | 193 | 255ms | 99.6% |
| 15分钟 | 65 | 239ms | 99.9% |
| 1小时 | 13 | 232ms | 99.97% |
| 6小时 | 4 | 223ms | 99.99% |
| 1天 | 1 | 231ms | 99.998% |

## 💡 最佳实践

### 1. 间隔选择策略

```typescript
function getOptimalInterval(durationHours: number): string {
  if (durationHours <= 1) return '1m'      // 1小时内用1分钟
  if (durationHours <= 6) return '5m'      // 6小时内用5分钟
  if (durationHours <= 24) return '15m'    // 1天内用15分钟
  if (durationHours <= 168) return '1h'    // 1周内用1小时
  if (durationHours <= 720) return '6h'    // 1月内用6小时
  return '1d'                               // 更长时间用1天
}
```

### 2. 索引优化

```sql
-- 为时间查询创建索引
CREATE INDEX idx_onenet_data_time_device 
ON onenet_data (created_at, device_id, datastream_id);

-- 为聚合查询创建复合索引
CREATE INDEX idx_onenet_data_analysis 
ON onenet_data (device_id, datastream_id, created_at);
```

### 3. 查询优化

- 使用 `LIMIT` 限制返回数据量
- 合理设置时间范围
- 预先过滤不需要的设备和数据流
- 使用适当的数据类型转换

## 🔧 实现要点

1. **时间对齐**: 确保时间桶边界对齐
2. **数据类型**: 正确处理数值类型转换
3. **空值处理**: 处理缺失数据点
4. **时区处理**: 考虑时区转换需求
5. **性能监控**: 监控查询执行时间

## 📊 应用场景

- **实时监控**: 1分钟-5分钟间隔
- **趋势分析**: 15分钟-1小时间隔  
- **历史报告**: 1小时-1天间隔
- **长期统计**: 1天-1周间隔

通过合理使用数据库间隔查询，可以在保持数据准确性的同时，大幅提升查询性能和用户体验。
