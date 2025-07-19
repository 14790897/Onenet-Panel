# 数据压缩功能指南

## 🎯 功能概述

数据压缩功能通过将老数据按时间间隔聚合为平均值，在保留数据趋势的同时大幅减少存储空间。

## 🚀 已实现的功能

### 1. 数据压缩API
- **路径**: `/api/admin/cleanup?action=compress_old_data`
- **方法**: POST
- **参数**:
  - `compress_days`: 压缩多少天前的数据（默认7天）
  - `interval_hours`: 压缩间隔小时数（默认1小时）

### 2. 压缩数据表结构
```sql
CREATE TABLE onenet_data_compressed (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50),
  datastream_id VARCHAR(100),
  avg_value NUMERIC,      -- 平均值
  min_value NUMERIC,      -- 最小值
  max_value NUMERIC,      -- 最大值
  sample_count INTEGER,   -- 样本数量
  time_bucket TIMESTAMP,  -- 时间桶
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(device_id, datastream_id, time_bucket)
)
```

### 3. 压缩数据查询API
- **路径**: `/api/data/compressed`
- **功能**: 查询压缩后的数据
- **返回格式**: 与原始数据兼容，包含额外的统计信息

### 4. 管理界面
- **路径**: `/admin/cleanup`
- **功能**: 
  - 可视化配置压缩参数
  - 预估压缩效果
  - 一键执行压缩

## 💡 压缩策略

### 按时间间隔压缩
```sql
-- 1小时间隔压缩示例
SELECT 
  device_id,
  datastream_id,
  AVG(CAST(value AS NUMERIC)) as avg_value,
  MIN(CAST(value AS NUMERIC)) as min_value,
  MAX(CAST(value AS NUMERIC)) as max_value,
  COUNT(*) as sample_count,
  date_trunc('hour', created_at) as time_bucket
FROM onenet_data 
WHERE created_at < NOW() - INTERVAL '7 days'
GROUP BY device_id, datastream_id, time_bucket
```

### 压缩效果预估
- **1小时间隔**: 减少约95-98%的数据量
- **6小时间隔**: 减少约99%的数据量
- **1天间隔**: 减少约99.5%的数据量

## 🛠️ 使用方法

### 1. 通过API压缩
```bash
# 压缩7天前的数据，按1小时间隔
curl -X POST "http://localhost:3000/api/admin/cleanup?action=compress_old_data&compress_days=7&interval_hours=1"

# 压缩3天前的数据，按6小时间隔
curl -X POST "http://localhost:3000/api/admin/cleanup?action=compress_old_data&compress_days=3&interval_hours=6"
```

### 2. 通过管理界面
1. 访问 `http://localhost:3000/admin/cleanup`
2. 在"数据压缩"卡片中设置参数
3. 点击"执行数据压缩"

### 3. 查询压缩数据
```javascript
// 查询压缩数据
const response = await fetch('/api/data/compressed?limit=50&device_id=2454063050')
const data = await response.json()

// 压缩数据包含额外信息
data.data.forEach(record => {
  console.log(`平均值: ${record.value}`)
  console.log(`最小值: ${record.raw_data.min_value}`)
  console.log(`最大值: ${record.raw_data.max_value}`)
  console.log(`样本数: ${record.raw_data.sample_count}`)
})
```

## 📊 数据保真度

### 保留的信息
- ✅ **平均值**: 保持数据趋势
- ✅ **最小值**: 保留极值信息
- ✅ **最大值**: 保留极值信息
- ✅ **样本数**: 了解数据密度
- ✅ **时间信息**: 保持时序特性

### 丢失的信息
- ❌ **瞬时值**: 具体时刻的精确数值
- ❌ **高频变化**: 短时间内的波动
- ❌ **异常点**: 可能被平均化

## 🔄 建议的压缩策略

### 分层压缩策略
```
原始数据 (0-7天)     → 保持原始精度
压缩数据 (7-30天)    → 1小时间隔压缩
归档数据 (30天以上)  → 6小时间隔压缩
历史数据 (1年以上)   → 1天间隔压缩
```

### 自动化压缩
```bash
# 每日自动压缩脚本
#!/bin/bash
# 压缩7天前的数据为1小时间隔
curl -X POST "http://localhost:3000/api/admin/cleanup?action=compress_old_data&compress_days=7&interval_hours=1"

# 压缩30天前的数据为6小时间隔
curl -X POST "http://localhost:3000/api/admin/cleanup?action=compress_old_data&compress_days=30&interval_hours=6"
```

## ⚠️ 注意事项

1. **不可逆操作**: 压缩后原始数据被删除，无法恢复
2. **备份重要**: 压缩前请确保重要数据已备份
3. **业务影响**: 确认压缩后的数据精度满足业务需求
4. **测试验证**: 建议先在测试环境验证压缩效果

## 🎯 最佳实践

1. **渐进式压缩**: 从较小的时间范围开始测试
2. **监控效果**: 压缩后监控查询性能和业务影响
3. **定期执行**: 设置定时任务自动执行压缩
4. **保留策略**: 制定明确的数据保留和压缩策略

通过合理使用数据压缩功能，可以在保持数据价值的同时，大幅减少存储成本和提高查询性能！
