-- 更新SQL脚本，添加更多安全性和功能
-- 创建OneNet数据表
DROP TABLE IF EXISTS onenet_data;

CREATE TABLE onenet_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    datastream_id VARCHAR(100) NOT NULL,
    value DECIMAL(10,4) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_value CHECK (value IS NOT NULL)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_onenet_device_timestamp ON onenet_data(device_id, timestamp DESC);
CREATE INDEX idx_onenet_datastream ON onenet_data(datastream_id);
CREATE INDEX idx_onenet_timestamp ON onenet_data(timestamp DESC);
CREATE INDEX idx_onenet_device_id ON onenet_data(device_id);

-- 插入一些测试数据
INSERT INTO onenet_data (device_id, datastream_id, value, raw_data) VALUES
('device_001', 'temperature', 25.6, '{"unit": "celsius", "location": "room1"}'),
('device_001', 'humidity', 65.2, '{"unit": "percent", "location": "room1"}'),
('device_002', 'temperature', 23.8, '{"unit": "celsius", "location": "room2"}'),
('device_002', 'pressure', 1013.25, '{"unit": "hPa", "location": "room2"}');
