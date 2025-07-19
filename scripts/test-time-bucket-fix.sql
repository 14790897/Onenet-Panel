-- 测试修复后的时间分桶逻辑
-- 这个脚本验证5分钟时间分桶是否正确对齐

-- 创建测试数据，包含不同分钟的时间戳
WITH test_data AS (
  SELECT 
    '2025-07-19 10:07:23'::timestamp as created_at,
    'test_device' as device_id,
    'temperature' as datastream_id,
    '25.5' as value
  UNION ALL
  SELECT '2025-07-19 10:08:45'::timestamp, 'test_device', 'temperature', '25.7'
  UNION ALL
  SELECT '2025-07-19 10:09:12'::timestamp, 'test_device', 'temperature', '25.9'
  UNION ALL
  SELECT '2025-07-19 10:12:34'::timestamp, 'test_device', 'temperature', '26.1'
  UNION ALL
  SELECT '2025-07-19 10:13:56'::timestamp, 'test_device', 'temperature', '26.3'
  UNION ALL
  SELECT '2025-07-19 10:17:18'::timestamp, 'test_device', 'temperature', '26.5'
)

-- 测试原始错误的分桶逻辑
SELECT 
  created_at,
  EXTRACT(minute FROM created_at) as minute_part,
  FLOOR(EXTRACT(minute FROM created_at) / 5) as floor_result,
  
  -- ❌ 错误的分桶逻辑（原始代码）
  date_trunc('minute', created_at) + 
  INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as wrong_bucket,
  
  -- ✅ 正确的分桶逻辑（修复后）
  date_trunc('hour', created_at) + 
  INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as correct_bucket,
  
  value
FROM test_data
ORDER BY created_at;

-- 预期结果说明：
-- 
-- 时间: 10:07:23
-- - minute_part: 7
-- - floor_result: 1 (7/5 = 1.4, floor = 1)
-- - wrong_bucket: 10:07:00 + 5分钟 = 10:12:00 ❌ 错误！
-- - correct_bucket: 10:00:00 + 5分钟 = 10:05:00 ✅ 正确！
--
-- 时间: 10:08:45
-- - minute_part: 8
-- - floor_result: 1 (8/5 = 1.6, floor = 1)  
-- - wrong_bucket: 10:08:00 + 5分钟 = 10:13:00 ❌ 错误！
-- - correct_bucket: 10:00:00 + 5分钟 = 10:05:00 ✅ 正确！
--
-- 时间: 10:12:34
-- - minute_part: 12
-- - floor_result: 2 (12/5 = 2.4, floor = 2)
-- - wrong_bucket: 10:12:00 + 10分钟 = 10:22:00 ❌ 错误！
-- - correct_bucket: 10:00:00 + 10分钟 = 10:10:00 ✅ 正确！

-- 验证分组聚合结果
SELECT 
  '=== 分组聚合测试 ===' as test_section;

WITH test_data AS (
  SELECT 
    '2025-07-19 10:07:23'::timestamp as created_at,
    'test_device' as device_id,
    'temperature' as datastream_id,
    25.5 as value
  UNION ALL
  SELECT '2025-07-19 10:08:45'::timestamp, 'test_device', 'temperature', 25.7
  UNION ALL
  SELECT '2025-07-19 10:09:12'::timestamp, 'test_device', 'temperature', 25.9
  UNION ALL
  SELECT '2025-07-19 10:12:34'::timestamp, 'test_device', 'temperature', 26.1
  UNION ALL
  SELECT '2025-07-19 10:13:56'::timestamp, 'test_device', 'temperature', 26.3
  UNION ALL
  SELECT '2025-07-19 10:17:18'::timestamp, 'test_device', 'temperature', 26.5
)

-- 使用修复后的正确分桶逻辑进行聚合
SELECT 
  date_trunc('hour', created_at) + 
  INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket,
  
  COUNT(*) as sample_count,
  AVG(value) as avg_value,
  MIN(value) as min_value,
  MAX(value) as max_value,
  
  -- 显示这个分桶包含的原始时间点
  string_agg(created_at::text, ', ' ORDER BY created_at) as original_times
  
FROM test_data
GROUP BY time_bucket
ORDER BY time_bucket;

-- 预期聚合结果：
-- time_bucket: 2025-07-19 10:05:00 (包含 10:07, 10:08, 10:09)
-- time_bucket: 2025-07-19 10:10:00 (包含 10:12, 10:13) 
-- time_bucket: 2025-07-19 10:15:00 (包含 10:17)
