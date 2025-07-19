# 无服务器环境下的自动数据压缩

## 🎯 问题解决

### 原问题
在无服务器函数环境中，全局变量不会在请求之间保持状态，导致压缩状态跟踪失效。

### 解决方案
使用数据库表来持久化压缩状态，确保在无服务器环境中正常工作。

## 🚀 技术实现

### 1. 压缩状态表
```sql
CREATE TABLE compression_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_check_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_compression_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
)
```

### 2. 状态检查逻辑
```typescript
async function shouldPerformCompression(): Promise<boolean> {
  const result = await sql`
    SELECT 
      last_check_time,
      EXTRACT(EPOCH FROM (NOW() - last_check_time)) * 1000 as time_diff_ms
    FROM compression_state 
    WHERE id = 1
  `
  
  const timeDiff = parseFloat(result[0].time_diff_ms || '0')
  return timeDiff >= COMPRESSION_INTERVAL // 30分钟
}
```

### 3. 状态更新
```typescript
async function updateCompressionState(): Promise<void> {
  await sql`
    UPDATE compression_state 
    SET 
      last_check_time = CURRENT_TIMESTAMP,
      last_compression_time = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `
}
```

## 🔄 工作流程

### 数据插入时的自动检查
```typescript
export async function insertOneNetData(data: OneNetData) {
  // 1. 插入数据
  const result = await sql`INSERT INTO onenet_data ...`
  
  // 2. 异步触发压缩检查（不阻塞）
  checkAndCompress().catch(error => {
    console.error('自动压缩检查失败:', error)
  })
  
  return result[0]
}
```

### 压缩检查流程
```typescript
export async function checkAndCompress(): Promise<CompressionResult> {
  // 1. 确保状态表存在
  await ensureCompressionStateTable()
  
  // 2. 检查是否到了压缩时间（从数据库读取）
  const shouldCompress = await shouldPerformCompression()
  if (!shouldCompress) {
    return { compressed: false, compressedRows: 0, deletedRows: 0 }
  }
  
  // 3. 执行压缩
  const result = await compressDataBefore(compressTime)
  
  // 4. 更新状态到数据库
  await updateCompressionState()
  
  return result
}
```

## 📊 压缩策略

### 时间配置
```typescript
const COMPRESSION_INTERVAL = 30 * 60 * 1000 // 30分钟检查间隔
const COMPRESSION_DELAY = 30 * 60 * 1000    // 压缩30分钟前的数据
```

### 压缩粒度
```sql
-- 按5分钟间隔聚合数据
date_trunc('minute', created_at) + 
INTERVAL '5 minutes' * 
FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket
```

### 数据保留
- **平均值**: 主要显示值
- **最小值**: 保留极值信息
- **最大值**: 保留极值信息  
- **样本数**: 原始数据点数量

## 🎛️ 管理功能

### 状态查询API
```bash
GET /api/admin/auto-compression
```

返回：
```json
{
  "success": true,
  "stats": {
    "originalRecords": 126886,
    "compressedRecords": 0,
    "lastCompressionTime": null,
    "nextCompressionTime": "2025-07-19T11:30:00Z",
    "compressionInterval": "30分钟",
    "compressionDelay": "30分钟前的数据",
    "compressionGranularity": "5分钟间隔"
  }
}
```

### 手动触发API
```bash
POST /api/admin/auto-compression?action=manual_compress
```

### 管理界面
访问 `http://localhost:3000/admin/cleanup` 查看：
- 自动压缩状态
- 压缩统计信息
- 手动触发按钮

## 🔍 监控和日志

### 成功日志
```
🗜️ 开始自动数据压缩...
✅ 自动压缩完成: 压缩156行，删除1248行
```

### 错误处理
```
❌ 自动压缩失败: [错误详情]
```

## ⚡ 性能优化

### 1. 异步执行
- 压缩检查不阻塞数据插入
- 使用 `.catch()` 处理错误，避免影响主流程

### 2. 智能检查
- 只在需要时执行压缩
- 避免频繁的数据库查询

### 3. 批量操作
- 一次性压缩多条数据
- 减少数据库事务次数

## 🎯 无服务器适配特性

### 1. 无状态设计
- ✅ 不依赖全局变量
- ✅ 状态存储在数据库中
- ✅ 每次请求独立执行

### 2. 冷启动优化
- ✅ 快速状态检查
- ✅ 延迟创建表结构
- ✅ 错误容错处理

### 3. 资源管理
- ✅ 自动清理连接
- ✅ 内存使用优化
- ✅ 执行时间控制

## 🧪 测试验证

### 1. 功能测试
```bash
# 检查状态
curl http://localhost:3000/api/admin/auto-compression

# 手动触发
curl -X POST "http://localhost:3000/api/admin/auto-compression?action=manual_compress"
```

### 2. 数据验证
```bash
# 查看压缩数据
curl "http://localhost:3000/api/data/compressed?limit=5"

# 检查原始数据
curl "http://localhost:3000/api/data?type=paginated&limit=5"
```

### 3. 状态验证
- 访问管理界面查看实时状态
- 检查数据库中的状态表
- 监控日志输出

## ✅ 部署就绪

现在的自动压缩功能完全适配无服务器环境：

- ✅ **状态持久化**: 使用数据库存储状态
- ✅ **无状态设计**: 不依赖全局变量
- ✅ **自动触发**: 每次数据插入时检查
- ✅ **智能压缩**: 30分钟间隔，5分钟粒度
- ✅ **错误容错**: 不影响主要数据流
- ✅ **管理界面**: 可视化监控和控制

无论在 Vercel、Netlify、AWS Lambda 还是其他无服务器平台上，都能正常工作！
