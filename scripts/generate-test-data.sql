-- 生成测试数据以验证时间范围选择功能
-- 这个脚本会在不同时间点插入测试数据

-- 插入过去24小时的测试数据
INSERT INTO onenet_data (device_id, datastream_id, value, created_at, raw_data) VALUES
-- 24小时前的数据
('2454063050', 'temperature', '20.5', NOW() - INTERVAL '24 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '20.8', NOW() - INTERVAL '23 hours 30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '21.2', NOW() - INTERVAL '23 hours', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 12小时前的数据
('2454063050', 'temperature', '22.1', NOW() - INTERVAL '12 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '22.5', NOW() - INTERVAL '11 hours 30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '22.8', NOW() - INTERVAL '11 hours', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 6小时前的数据
('2454063050', 'temperature', '23.2', NOW() - INTERVAL '6 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '23.5', NOW() - INTERVAL '5 hours 30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '23.8', NOW() - INTERVAL '5 hours', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 3小时前的数据
('2454063050', 'temperature', '24.1', NOW() - INTERVAL '3 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '24.3', NOW() - INTERVAL '2 hours 30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '24.5', NOW() - INTERVAL '2 hours', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 1小时前的数据
('2454063050', 'temperature', '24.8', NOW() - INTERVAL '1 hour', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '25.0', NOW() - INTERVAL '50 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '25.2', NOW() - INTERVAL '40 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 30分钟前的数据
('2454063050', 'temperature', '25.5', NOW() - INTERVAL '30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '25.7', NOW() - INTERVAL '25 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '25.9', NOW() - INTERVAL '20 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 10分钟前的数据
('2454063050', 'temperature', '26.1', NOW() - INTERVAL '10 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '26.3', NOW() - INTERVAL '8 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '26.5', NOW() - INTERVAL '5 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 最近的数据
('2454063050', 'temperature', '26.8', NOW() - INTERVAL '2 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'temperature', '27.0', NOW() - INTERVAL '1 minute', '{"deviceName": "测试设备1", "productId": "test"}'),

-- 为第二个设备也添加类似的数据
('2454895254', 'temperature', '19.5', NOW() - INTERVAL '24 hours', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '19.8', NOW() - INTERVAL '12 hours', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '20.2', NOW() - INTERVAL '6 hours', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '20.5', NOW() - INTERVAL '3 hours', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '20.8', NOW() - INTERVAL '1 hour', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '21.1', NOW() - INTERVAL '30 minutes', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '21.4', NOW() - INTERVAL '10 minutes', '{"deviceName": "测试设备2", "productId": "test"}'),
('2454895254', 'temperature', '21.7', NOW() - INTERVAL '2 minutes', '{"deviceName": "测试设备2", "productId": "test"}'),

-- 添加湿度数据
('2454063050', 'humidity', '45.2', NOW() - INTERVAL '24 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '46.5', NOW() - INTERVAL '12 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '47.8', NOW() - INTERVAL '6 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '48.1', NOW() - INTERVAL '3 hours', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '48.5', NOW() - INTERVAL '1 hour', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '49.0', NOW() - INTERVAL '30 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '49.5', NOW() - INTERVAL '10 minutes', '{"deviceName": "测试设备1", "productId": "test"}'),
('2454063050', 'humidity', '50.0', NOW() - INTERVAL '2 minutes', '{"deviceName": "测试设备1", "productId": "test"}');

-- 验证插入的数据
SELECT 
  COUNT(*) as total_count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600 as hours_span
FROM onenet_data 
WHERE device_id IN ('2454063050', '2454895254');
