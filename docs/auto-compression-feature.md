# 自动数据压缩功能

## 🎯 功能概述

自动数据压缩功能已成功集成到数据接收流程中，每次接收OneNet数据时都会检查是否需要压缩半小时前的数据，实现数据库空间的自动管理。

## 🚀 核心特性

### 1. 自动触发机制
- ✅ **集成到数据插入**: 每次调用`insertOneNetData`时自动检查
- ✅ **非阻塞执行**: 压缩检查异步执行，不影响数据插入性能
- ✅ **智能间隔**: 每30分钟检查一次，避免频繁压缩

### 2. 压缩策略
- ✅ **时间延迟**: 压缩30分钟前的数据，确保数据稳定
- ✅ **精细粒度**: 按5分钟间隔聚合数据
- ✅ **保留统计**: 平均值、最小值、最大值、样本数

### 3. 数据保真度
```sql
-- 压缩后的数据结构
onenet_data_compressed:
- avg_value: 平均值（主要显示值）
- min_value: 最小值（保留极值信息）
- max_value: 最大值（保留极值信息）
- sample_count: 样本数量（数据密度指标）
- time_bucket: 时间桶（5分钟间隔）
```

## 🔧 技术实现

### 1. 自动压缩服务 (`lib/auto-compression.ts`)
```typescript
// 核心函数
export async function checkAndCompress(): Promise<CompressionResult>

// 压缩策略
const COMPRESSION_INTERVAL = 30 * 60 * 1000 // 30分钟检查间隔
const COMPRESSION_DELAY = 30 * 60 * 1000    // 压缩30分钟前数据
```

### 2. 数据库集成 (`lib/database.ts`)
```typescript
export async function insertOneNetData(data: OneNetData) {
  // 插入数据
  const result = await sql`INSERT INTO onenet_data ...`
  
  // 异步触发自动压缩检查
  checkAndCompress().catch(error => {
    console.error('自动压缩检查失败:', error)
  })
  
  return result[0]
}
```

### 3. 管理API (`app/api/admin/auto-compression/route.ts`)
- **GET**: 获取压缩状态统计
- **POST**: 手动触发压缩（用于测试）

## 📊 压缩效果

### 空间节省
- **5分钟聚合**: 减少约92%存储空间
- **原始数据**: 每分钟可能有多条记录
- **压缩数据**: 每5分钟只有1条聚合记录

### 性能优化
- **查询速度**: 压缩数据查询更快
- **存储成本**: 大幅降低数据库存储需求
- **传输效率**: 减少网络传输数据量

## 🎛️ 管理界面

### 访问路径
```
http://localhost:3000/admin/cleanup
```

### 功能特性
- ✅ **状态监控**: 实时显示压缩统计信息
- ✅ **手动触发**: 可以手动执行压缩进行测试
- ✅ **时间显示**: 显示上次和下次压缩时间
- ✅ **策略说明**: 清晰展示压缩策略参数

### 界面信息
```
自动压缩状态:
- 原始记录数: 显示当前未压缩的记录数
- 压缩记录数: 显示已压缩的记录数
- 上次压缩: 最后一次执行压缩的时间
- 下次压缩: 预计下次检查压缩的时间
- 压缩策略: 5分钟间隔聚合
- 压缩延迟: 30分钟前的数据
- 检查间隔: 30分钟
```

## 🔍 数据查询

### 压缩数据API
```
GET /api/data/compressed?limit=50&device_id=xxx&datastream=xxx
```

### 返回格式
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": "2454063050",
      "datastream_id": "temperature",
      "value": "23.5",  // 平均值
      "created_at": "2025-07-19T10:30:00Z",
      "raw_data": {
        "compressed": true,
        "avg_value": 23.5,
        "min_value": 22.1,
        "max_value": 24.8,
        "sample_count": 12,
        "data_type": "compressed_average"
      }
    }
  ],
  "meta": {
    "dataType": "compressed",
    "description": "压缩数据（平均值）"
  }
}
```

## 📈 监控和日志

### 控制台日志
```
🗜️ 开始自动数据压缩...
✅ 自动压缩完成: 压缩156行，删除1248行
```

### 错误处理
```
❌ 自动压缩失败: [错误详情]
```

## ⚙️ 配置参数

### 可调整参数
```typescript
// lib/auto-compression.ts
const COMPRESSION_INTERVAL = 30 * 60 * 1000 // 检查间隔
const COMPRESSION_DELAY = 30 * 60 * 1000    // 压缩延迟
```

### 压缩粒度
```sql
-- 当前: 5分钟间隔
date_trunc('minute', created_at) + 
INTERVAL '5 minutes' * 
FLOOR(EXTRACT(minute FROM created_at) / 5)

-- 可调整为其他间隔: 1分钟、10分钟、15分钟等
```

## 🎯 使用场景

### 1. 实时数据监控
- 原始数据: 用于实时监控和告警
- 压缩数据: 用于历史趋势分析

### 2. 数据分析
- 短期分析: 使用原始数据（精确）
- 长期分析: 使用压缩数据（趋势）

### 3. 存储优化
- 自动管理: 无需手动干预
- 空间节省: 大幅减少存储成本
- 性能提升: 查询速度更快

## ✅ 验证方法

### 1. 检查自动压缩状态
```bash
curl http://localhost:3000/api/admin/auto-compression
```

### 2. 手动触发压缩
```bash
curl -X POST "http://localhost:3000/api/admin/auto-compression?action=manual_compress"
```

### 3. 查询压缩数据
```bash
curl "http://localhost:3000/api/data/compressed?limit=5"
```

### 4. 访问管理界面
```
http://localhost:3000/admin/cleanup
```

## 🎉 总结

自动数据压缩功能已成功实现并集成到系统中：

- ✅ **自动触发**: 每次数据插入时检查压缩需求
- ✅ **智能策略**: 30分钟间隔检查，压缩30分钟前数据
- ✅ **高效压缩**: 5分钟间隔聚合，减少92%存储空间
- ✅ **数据保真**: 保留平均值、极值和统计信息
- ✅ **管理界面**: 可视化监控和手动控制
- ✅ **API支持**: 完整的查询和管理接口

现在系统会自动管理数据库空间，无需手动干预，同时保持数据的核心价值！
