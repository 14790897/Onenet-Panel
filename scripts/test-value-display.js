/**
 * 测试数值显示修复
 */

// 模拟从API返回的数据格式
const testData = [
  {
    id: 1469,
    device_id: "2454895254",
    datastream_id: "pressure",
    value: "1000.0000", // 字符串格式的数值
    timestamp: "2025-07-12T11:55:31.000Z",
    raw_data: {
      originalValue: 1000,
      deviceName: "living-room"
    },
    created_at: "2025-07-12T11:55:31.000Z"
  },
  {
    id: 1470,
    device_id: "2454895254", 
    datastream_id: "temperature",
    value: "29.0000", // 字符串格式的数值
    timestamp: "2025-07-12T11:55:32.000Z",
    raw_data: {
      originalValue: 29,
      deviceName: "living-room"
    },
    created_at: "2025-07-12T11:55:32.000Z"
  },
  {
    id: 1471,
    device_id: "2454063050",
    datastream_id: "temperature", 
    value: "29.76", // 字符串格式的小数
    timestamp: "2025-07-12T11:55:33.000Z",
    raw_data: {
      originalValue: 29.76,
      deviceName: "bm280-bedroom"
    },
    created_at: "2025-07-12T11:55:33.000Z"
  }
];

// 模拟getDisplayValue函数
function getDisplayValue(record) {
  // 首先尝试转换数据库中的值
  let dbValue = 0;
  if (typeof record.value === 'number') {
    dbValue = record.value;
  } else if (typeof record.value === 'string') {
    const parsed = parseFloat(record.value);
    dbValue = isNaN(parsed) ? 0 : parsed;
  }

  // 如果数据库中的值是0，但原始值存在且不是0，则使用原始值
  if (dbValue === 0 && record.raw_data?.originalValue !== undefined && record.raw_data.originalValue !== 0) {
    const originalValue = record.raw_data.originalValue;
    // 尝试转换原始值为数字
    if (typeof originalValue === 'number') {
      return originalValue;
    } else if (typeof originalValue === 'string') {
      const parsed = parseFloat(originalValue);
      return isNaN(parsed) ? dbValue : parsed;
    }
  }
  
  return dbValue;
}

// 测试函数
function testValueConversion() {
  console.log('=== 测试数值显示修复 ===\n');
  
  testData.forEach((record, index) => {
    const displayValue = getDisplayValue(record);
    
    console.log(`测试 ${index + 1}:`);
    console.log(`  设备: ${record.device_id}`);
    console.log(`  数据流: ${record.datastream_id}`);
    console.log(`  原始value: ${record.value} (类型: ${typeof record.value})`);
    console.log(`  原始值: ${record.raw_data.originalValue} (类型: ${typeof record.raw_data.originalValue})`);
    console.log(`  显示值: ${displayValue} (类型: ${typeof displayValue})`);
    console.log(`  转换正确: ${displayValue !== 0 ? '✅' : '❌'}`);
    console.log('---');
  });
}

// 运行测试
testValueConversion();

// 验证API数据
async function verifyApiData() {
  try {
    console.log('\n=== 验证API数据 ===');
    const response = await fetch('http://localhost:3000/api/data?type=latest&limit=3');
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('API返回的数据:');
      result.data.forEach((item, index) => {
        const displayValue = getDisplayValue(item);
        console.log(`${index + 1}. 设备: ${item.device_id}, 数据流: ${item.datastream_id}`);
        console.log(`   数据库值: ${item.value} (${typeof item.value})`);
        console.log(`   显示值: ${displayValue} (${typeof displayValue})`);
        console.log(`   状态: ${displayValue !== 0 ? '✅ 正常' : '❌ 异常'}`);
        console.log('');
      });
    } else {
      console.log('API请求失败:', result.error);
    }
  } catch (error) {
    console.error('验证API数据时出错:', error.message);
  }
}

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  // 需要fetch polyfill
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  verifyApiData().catch(console.error);
}

module.exports = { getDisplayValue, testValueConversion };
