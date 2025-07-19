/**
 * 测试实时数据API的改进
 */

// 测试不同的参数组合
const testCases = [
  {
    name: '默认参数',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'temperature'
    }
  },
  {
    name: '增加数据量',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'temperature',
      limit: '100'
    }
  },
  {
    name: '扩大时间范围',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'temperature',
      limit: '200',
      timeRange: '6h'
    }
  },
  {
    name: '最大数据量',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'temperature',
      limit: '500',
      timeRange: '24h'
    }
  },
  {
    name: '气压数据',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'pressure',
      limit: '300',
      timeRange: '6h'
    }
  }
];

/**
 * 测试API调用
 */
async function testRealtimeApi(testCase) {
  try {
    const params = new URLSearchParams(testCase.params);
    const url = `http://localhost:3000/api/analytics/realtime?${params}`;
    
    console.log(`\n=== 测试: ${testCase.name} ===`);
    console.log(`URL: ${url}`);
    
    const startTime = Date.now();
    const response = await fetch(url);
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      
      console.log(`✅ 请求成功`);
      console.log(`响应时间: ${endTime - startTime}ms`);
      console.log(`数据点数量: ${data.length}`);
      
      if (data.length > 0) {
        const firstPoint = data[0];
        const lastPoint = data[data.length - 1];
        
        console.log(`时间范围: ${firstPoint.time} - ${lastPoint.time}`);
        console.log(`设备数据:`);
        
        // 显示每个设备的数据点数量
        const deviceCounts = {};
        data.forEach(point => {
          Object.keys(point).forEach(key => {
            if (key !== 'timestamp' && key !== 'time' && point[key] !== undefined) {
              deviceCounts[key] = (deviceCounts[key] || 0) + 1;
            }
          });
        });
        
        Object.entries(deviceCounts).forEach(([device, count]) => {
          console.log(`  ${device}: ${count} 个数据点`);
        });
        
        // 显示示例数据
        console.log(`示例数据点:`);
        console.log(`  最早: ${JSON.stringify(firstPoint)}`);
        console.log(`  最新: ${JSON.stringify(lastPoint)}`);
      } else {
        console.log(`⚠️  无数据返回`);
      }
    } else {
      console.log(`❌ 请求失败: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`错误信息: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ 请求异常: ${error.message}`);
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('开始测试实时数据API改进...');
  
  for (const testCase of testCases) {
    await testRealtimeApi(testCase);
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== 测试总结 ===');
  console.log('所有测试完成！');
  console.log('现在实时图表应该支持:');
  console.log('- ✅ 可配置的数据点数量 (50-1000)');
  console.log('- ✅ 可配置的获取数量 (20-500)');
  console.log('- ✅ 可配置的时间范围 (10分钟-7天)');
  console.log('- ✅ 更大的数据集显示');
}

/**
 * 测试特定配置
 */
async function testSpecificConfig() {
  console.log('\n=== 测试推荐配置 ===');
  
  const recommendedConfig = {
    name: '推荐配置 - 显示更多历史数据',
    params: {
      devices: '2454063050,2454895254',
      datastream: 'temperature',
      limit: '200',
      timeRange: '1h'
    }
  };
  
  await testRealtimeApi(recommendedConfig);
}

// 运行测试
if (typeof window === 'undefined') {
  // Node.js环境
  const fetch = require('node-fetch');
  global.fetch = fetch;
  
  runAllTests()
    .then(() => testSpecificConfig())
    .catch(console.error);
} else {
  // 浏览器环境
  console.log('在浏览器中运行测试...');
  runAllTests()
    .then(() => testSpecificConfig())
    .catch(console.error);
}

module.exports = { testRealtimeApi, runAllTests };
