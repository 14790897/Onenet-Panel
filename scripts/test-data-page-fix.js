/**
 * 测试数据查看页面的数值显示修复
 */

// 模拟OneNetDataRecord接口
const testRecords = [
  {
    id: 1469,
    device_id: "2454895254",
    datastream_id: "pressure", 
    value: "1000.0000", // 字符串格式
    raw_data: {
      originalValue: 1000,
      deviceName: "living-room",
      messageType: "notify"
    },
    created_at: "2025-07-12T11:55:31.000Z"
  },
  {
    id: 1470,
    device_id: "2454063050",
    datastream_id: "temperature",
    value: "29.76", // 字符串格式的小数
    raw_data: {
      originalValue: 29.76,
      deviceName: "bm280-bedroom", 
      messageType: "notify"
    },
    created_at: "2025-07-12T11:55:32.000Z"
  },
  {
    id: 1471,
    device_id: "2454895254",
    datastream_id: "altitude",
    value: 0, // 数字0，但有原始值
    raw_data: {
      originalValue: 111,
      deviceName: "living-room",
      messageType: "notify"
    },
    created_at: "2025-07-12T11:55:33.000Z"
  },
  {
    id: 1472,
    device_id: "TEST-DEVICE",
    datastream_id: "humidity",
    value: "65.2", // 字符串格式
    raw_data: {
      originalValue: "65.2",
      deviceName: "test-sensor",
      messageType: "notify"
    },
    created_at: "2025-07-12T11:55:34.000Z"
  }
];

// 复制数据查看页面的getDisplayValue函数
function getDisplayValue(record) {
  // 首先尝试转换数据库中的值
  let dbValue = 0;
  if (typeof record.value === "number") {
    dbValue = record.value;
  } else if (typeof record.value === "string") {
    const parsed = parseFloat(record.value);
    dbValue = isNaN(parsed) ? 0 : parsed;
  }

  // 如果数据库中的值是0，但原始值存在且不是0，则使用原始值
  if (
    dbValue === 0 &&
    record.raw_data?.originalValue !== undefined &&
    record.raw_data.originalValue !== 0
  ) {
    const originalValue = record.raw_data.originalValue;
    // 尝试转换原始值为数字
    if (typeof originalValue === "number") {
      return originalValue;
    } else if (typeof originalValue === "string") {
      const parsed = parseFloat(originalValue);
      return isNaN(parsed) ? dbValue : parsed;
    }
  }
  
  return dbValue;
}

// 复制formatRawData函数
function formatRawData(rawData) {
  if (!rawData) return 'N/A';
  
  // 显示重要信息
  const info = [];
  if (rawData.deviceName) info.push(`设备名: ${rawData.deviceName}`);
  if (rawData.messageType) info.push(`消息类型: ${rawData.messageType}`);
  if (rawData.originalValue !== undefined) info.push(`原始值: ${rawData.originalValue}`);
  
  return info.length > 0 ? info.join(', ') : JSON.stringify(rawData).substring(0, 100) + '...';
}

// 测试函数
function testDataPageFix() {
  console.log('=== 测试数据查看页面修复 ===\n');
  
  testRecords.forEach((record, index) => {
    const displayValue = getDisplayValue(record);
    const rawDataInfo = formatRawData(record.raw_data);
    
    console.log(`测试记录 ${index + 1}:`);
    console.log(`  ID: ${record.id}`);
    console.log(`  设备: ${record.device_id}`);
    console.log(`  数据流: ${record.datastream_id}`);
    console.log(`  数据库值: ${record.value} (${typeof record.value})`);
    console.log(`  显示值: ${displayValue} (${typeof displayValue})`);
    console.log(`  额外信息: ${rawDataInfo}`);
    console.log(`  修复状态: ${displayValue !== 0 || record.value === 0 ? '✅ 正常' : '❌ 异常'}`);
    console.log('---');
  });
  
  // 统计结果
  const totalRecords = testRecords.length;
  const fixedRecords = testRecords.filter(record => {
    const displayValue = getDisplayValue(record);
    return displayValue !== 0 || record.value === 0;
  }).length;
  
  console.log(`\n=== 修复统计 ===`);
  console.log(`总记录数: ${totalRecords}`);
  console.log(`修复成功: ${fixedRecords}`);
  console.log(`修复失败: ${totalRecords - fixedRecords}`);
  console.log(`成功率: ${((fixedRecords / totalRecords) * 100).toFixed(1)}%`);
}

// 验证实际API数据
async function verifyDataPageApi() {
  try {
    console.log('\n=== 验证数据查看页面API ===');
    const response = await fetch('http://localhost:3000/api/data?type=latest&limit=5');
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('API返回的数据处理结果:');
      result.data.forEach((record, index) => {
        const displayValue = getDisplayValue(record);
        console.log(`${index + 1}. 设备: ${record.device_id}`);
        console.log(`   数据流: ${record.datastream_id}`);
        console.log(`   数据库值: ${record.value} (${typeof record.value})`);
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

// 运行测试
console.log('开始测试数据查看页面修复...\n');
testDataPageFix();

// 如果在Node.js环境中运行
if (typeof window === 'undefined') {
  // 需要fetch polyfill，但这里先跳过API验证
  console.log('\n注意: 跳过API验证（需要fetch polyfill）');
  console.log('请在浏览器中访问 http://localhost:3000/data 查看实际效果');
}

module.exports = { getDisplayValue, formatRawData, testDataPageFix };
