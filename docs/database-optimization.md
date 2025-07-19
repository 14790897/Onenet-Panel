# 数据库空间优化方案

## 🚨 当前问题分析

根据测试结果，数据库中有 **126,510条记录**，这确实会消耗大量存储空间：

- **总记录数**: ~126,510条
- **估算大小**: 每条记录约500-1000字节
- **总空间**: 约60-120MB（仅数据，不包括索引）
- **增长速度**: 如果设备持续推送，每天可能增加数千条记录

## 💡 优化策略

### 1. 数据清理策略

#### A. 按时间清理历史数据
```sql
-- 删除30天前的数据
DELETE FROM onenet_data 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 删除7天前的数据（更激进）
DELETE FROM onenet_data 
WHERE created_at < NOW() - INTERVAL '7 days';
```

#### B. 按数据量清理
```sql
-- 只保留最新的10000条记录
DELETE FROM onenet_data 
WHERE id NOT IN (
  SELECT id FROM onenet_data 
  ORDER BY created_at DESC 
  LIMIT 10000
);
```

### 2. 数据归档策略

#### A. 创建归档表
```sql
-- 创建归档表（简化结构）
CREATE TABLE onenet_data_archive (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50),
  datastream_id VARCHAR(100),
  value NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 将旧数据移动到归档表
INSERT INTO onenet_data_archive (device_id, datastream_id, value, created_at)
SELECT device_id, datastream_id, CAST(value AS NUMERIC), created_at
FROM onenet_data 
WHERE created_at < NOW() - INTERVAL '7 days';

-- 删除已归档的数据
DELETE FROM onenet_data 
WHERE created_at < NOW() - INTERVAL '7 days';
```

### 3. 数据压缩策略

#### A. 移除冗余字段
```sql
-- 如果不需要完整的raw_data，可以删除该字段
ALTER TABLE onenet_data DROP COLUMN raw_data;

-- 或者只保留必要的raw_data字段
UPDATE onenet_data 
SET raw_data = jsonb_build_object(
  'deviceName', raw_data->>'deviceName',
  'productId', raw_data->>'productId'
)
WHERE raw_data IS NOT NULL;
```

#### B. 数据类型优化
```sql
-- 优化数据类型以减少存储空间
ALTER TABLE onenet_data 
ALTER COLUMN device_id TYPE VARCHAR(20),
ALTER COLUMN datastream_id TYPE VARCHAR(50);
```

### 4. 定期清理任务

#### A. 创建清理API
```typescript
// app/api/admin/cleanup/route.ts
export async function POST() {
  const sql = neon(process.env.DATABASE_URL!)
  
  // 删除30天前的数据
  const result = await sql`
    DELETE FROM onenet_data 
    WHERE created_at < NOW() - INTERVAL '30 days'
  `
  
  return NextResponse.json({ 
    success: true, 
    deletedRows: result.count 
  })
}
```

#### B. 定期执行清理
```bash
# 使用cron job定期清理（每天凌晨2点）
0 2 * * * curl -X POST http://localhost:3000/api/admin/cleanup
```

### 5. 智能采样存储

#### A. 只存储关键数据点
```typescript
// 智能过滤，只存储有意义的数据变化
function shouldStoreData(newValue: number, lastValue: number): boolean {
  const threshold = 0.1 // 变化阈值
  return Math.abs(newValue - lastValue) > threshold
}
```

#### B. 数据聚合存储
```sql
-- 创建小时级聚合表
CREATE TABLE onenet_data_hourly (
  device_id VARCHAR(50),
  datastream_id VARCHAR(100),
  hour_bucket TIMESTAMP,
  avg_value NUMERIC,
  min_value NUMERIC,
  max_value NUMERIC,
  count INTEGER,
  PRIMARY KEY (device_id, datastream_id, hour_bucket)
);

-- 聚合数据到小时表
INSERT INTO onenet_data_hourly
SELECT 
  device_id,
  datastream_id,
  date_trunc('hour', created_at) as hour_bucket,
  AVG(CAST(value AS NUMERIC)) as avg_value,
  MIN(CAST(value AS NUMERIC)) as min_value,
  MAX(CAST(value AS NUMERIC)) as max_value,
  COUNT(*) as count
FROM onenet_data
GROUP BY device_id, datastream_id, date_trunc('hour', created_at);
```

## 🛠️ 实施建议

### 立即行动（紧急）
1. **删除历史数据**: 删除7天前的数据
2. **设置数据保留策略**: 只保留最近1-2周的数据
3. **监控数据增长**: 设置告警机制

### 中期优化（1-2周内）
1. **实施数据归档**: 将历史数据移到归档表
2. **优化数据结构**: 移除不必要的字段
3. **创建清理任务**: 自动化数据清理

### 长期策略（1个月内）
1. **数据分层存储**: 热数据、温数据、冷数据分离
2. **智能采样**: 只存储有价值的数据点
3. **数据压缩**: 使用更高效的存储格式

## 📊 预期效果

实施这些优化后，预期可以：
- **减少90%的存储空间**（从120MB降到12MB）
- **提高查询性能**（数据量减少）
- **降低数据库成本**
- **保持核心功能不变**

## ⚠️ 注意事项

1. **备份数据**: 在删除前务必备份重要数据
2. **测试环境**: 先在测试环境验证清理脚本
3. **业务影响**: 确认哪些历史数据是必需的
4. **监控告警**: 设置数据库空间使用告警

选择适合您需求的优化策略，建议从最简单的时间清理开始！
