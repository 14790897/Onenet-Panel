# 实时数据监控时间范围选择修复

## 🚨 问题描述

实时数据监控页面的时间范围选择功能不生效，用户选择不同的时间范围（10分钟、30分钟、1小时等）时，图表显示的数据没有相应变化。

## 🔍 问题根因

### 1. SQL查询问题
**原问题**：
```typescript
// 使用 sql.unsafe() 可能导致SQL注入和解析问题
WHERE created_at >= NOW() - INTERVAL '${sql.unsafe(timeInterval)}'
```

**问题分析**：
- `sql.unsafe()` 在某些情况下可能不会正确解析时间间隔
- 字符串拼接的SQL可能存在安全风险
- 时间间隔参数可能没有正确传递到数据库

### 2. 前端数据清理问题
**原问题**：
```typescript
// 切换时间范围时，旧数据没有清除
useEffect(() => {
  if (devices.length > 0) {
    fetchLatestData()
  }
}, [devices, datastream, timeRange, fetchLimit])
```

**问题分析**：
- 切换时间范围时，图表中的旧数据没有清除
- 新数据和旧数据混合显示，造成时间范围选择无效的假象

## ✅ 解决方案

### 1. 修复SQL查询逻辑

**修复前**：
```typescript
let timeInterval = '1 hour'
switch (timeRange) {
  case '10m': timeInterval = '10 minutes'; break
  case '30m': timeInterval = '30 minutes'; break
  // ...
}

const data = await sql`
  WHERE created_at >= NOW() - INTERVAL '${sql.unsafe(timeInterval)}'
`
```

**修复后**：
```typescript
// 计算具体的开始时间
let startTime: Date
const now = new Date()

switch (timeRange) {
  case '10m':
    startTime = new Date(now.getTime() - 10 * 60 * 1000)
    break
  case '30m':
    startTime = new Date(now.getTime() - 30 * 60 * 1000)
    break
  case '1h':
    startTime = new Date(now.getTime() - 60 * 60 * 1000)
    break
  // ...
}

const data = await sql`
  WHERE created_at >= ${startTime.toISOString()}
`
```

**优势**：
- ✅ 避免SQL注入风险
- ✅ 时间计算更精确
- ✅ 参数化查询更安全
- ✅ 跨数据库兼容性更好

### 2. 修复前端数据清理

**修复前**：
```typescript
useEffect(() => {
  if (devices.length > 0) {
    fetchLatestData()
  }
}, [devices, datastream, timeRange, fetchLimit])
```

**修复后**：
```typescript
useEffect(() => {
  if (devices.length > 0) {
    // 清除旧数据，重新获取
    setData([])
    fetchLatestData()
  }
}, [devices, datastream, timeRange, fetchLimit])
```

**优势**：
- ✅ 切换时间范围时清除旧数据
- ✅ 避免新旧数据混合显示
- ✅ 用户体验更清晰

## 🎯 支持的时间范围

### API参数映射
```typescript
timeRange参数 → 实际时间范围
'10m'  → 10分钟前到现在
'30m'  → 30分钟前到现在
'1h'   → 1小时前到现在
'6h'   → 6小时前到现在
'24h'  → 24小时前到现在
'7d'   → 7天前到现在
```

### 前端选择器
```tsx
<Select value={timeRange} onValueChange={setTimeRange}>
  <SelectItem value="10m">最近10分钟</SelectItem>
  <SelectItem value="30m">最近30分钟</SelectItem>
  <SelectItem value="1h">最近1小时</SelectItem>
  <SelectItem value="6h">最近6小时</SelectItem>
  <SelectItem value="24h">最近24小时</SelectItem>
  <SelectItem value="7d">最近7天</SelectItem>
</Select>
```

## 🧪 测试验证

### 1. API测试
```bash
# 测试10分钟范围
curl "http://localhost:3000/api/analytics/realtime?devices=2454063050&datastream=temperature&timeRange=10m&limit=20"

# 测试1小时范围
curl "http://localhost:3000/api/analytics/realtime?devices=2454063050&datastream=temperature&timeRange=1h&limit=50"

# 测试6小时范围
curl "http://localhost:3000/api/analytics/realtime?devices=2454063050&datastream=temperature&timeRange=6h&limit=100"
```

### 2. 前端测试
1. 访问 `http://localhost:3000/analytics`
2. 选择设备和数据流
3. 切换不同的时间范围选项
4. 观察图表数据是否相应变化

### 3. 数据验证
- ✅ **10分钟范围**：只显示最近10分钟的数据点
- ✅ **1小时范围**：显示最近1小时的数据点
- ✅ **6小时范围**：显示最近6小时的数据点
- ✅ **切换流畅**：选择不同范围时图表立即更新

## 📊 预期效果

### 修复前的问题
- ❌ 选择不同时间范围，图表数据不变
- ❌ 新旧数据混合显示
- ❌ 用户体验混乱

### 修复后的效果
- ✅ 选择10分钟：只显示最近10分钟数据
- ✅ 选择1小时：显示最近1小时数据
- ✅ 选择6小时：显示最近6小时数据
- ✅ 切换时间范围：图表立即清空并重新加载
- ✅ 数据时间轴：准确反映选择的时间范围

## 🔧 技术细节

### 时间计算逻辑
```typescript
// 精确的毫秒级时间计算
const timeRangeMap = {
  '10m': 10 * 60 * 1000,      // 10分钟
  '30m': 30 * 60 * 1000,      // 30分钟
  '1h': 60 * 60 * 1000,       // 1小时
  '6h': 6 * 60 * 60 * 1000,   // 6小时
  '24h': 24 * 60 * 60 * 1000, // 24小时
  '7d': 7 * 24 * 60 * 60 * 1000 // 7天
}

const startTime = new Date(Date.now() - timeRangeMap[timeRange])
```

### SQL查询优化
```sql
-- 使用参数化查询，避免SQL注入
SELECT device_id, datastream_id, value, created_at
FROM onenet_data
WHERE device_id = ANY($1)
  AND datastream_id = $2
  AND created_at >= $3  -- 使用计算好的时间戳
ORDER BY created_at DESC
LIMIT $4
```

## 🎉 修复完成

现在实时数据监控的时间范围选择功能已完全正常：

- ✅ **API层面**：正确处理时间范围参数
- ✅ **数据库层面**：精确的时间范围查询
- ✅ **前端层面**：清除旧数据，流畅切换
- ✅ **用户体验**：选择即时生效，数据准确

用户现在可以自由选择不同的时间范围来查看实时数据趋势！
