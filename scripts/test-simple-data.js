/**
 * 简化的OneNet数据测试
 * 直接测试数据解析逻辑，跳过签名验证
 */

// 临时禁用签名验证进行测试
const WEBHOOK_URL = 'http://localhost:3000/api/onenet/webhook'

/**
 * 创建测试数据
 */
function createTestData() {
  const data = {
    deviceId: "TEST-DEVICE-001",
    deviceName: "测试设备",
    productId: "test-product",
    messageType: "notify",
    notifyType: "property",
    data: {
      id: "test-" + Date.now(),
      version: "1.0",
      params: {
        temperature: {
          value: 25.5,  // 数值类型
          time: Date.now()
        },
        humidity: {
          value: "65.2",  // 字符串类型数值
          time: Date.now()
        },
        pressure: {
          value: 1013,  // 整数
          time: Date.now()
        }
      }
    }
  }
  
  return JSON.stringify(data)
}

/**
 * 发送测试数据（使用默认token）
 */
async function sendTestData() {
  try {
    const msgContent = createTestData()
    const nonce = "test-nonce-" + Date.now()
    
    // 使用默认token，这样会跳过签名验证
    const payload = {
      msg: msgContent,
      signature: "test-signature",
      nonce: nonce,
      time: Date.now(),
      id: "test-" + Date.now()
    }
    
    console.log('发送测试数据...')
    console.log('消息内容:', msgContent)
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    console.log(`响应状态: ${response.status}`)
    console.log(`响应内容: ${responseText}`)
    
    return response.ok
    
  } catch (error) {
    console.error('发送数据时出错:', error)
    return false
  }
}

/**
 * 验证数据
 */
async function verifyData() {
  try {
    console.log('\n验证存储的数据...')
    const response = await fetch('http://localhost:3000/api/data?type=latest&limit=5')
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('最新的5条数据:')
      result.data.forEach((item, index) => {
        console.log(`${index + 1}. 设备: ${item.device_id}`)
        console.log(`   数据流: ${item.datastream_id}`)
        console.log(`   数值: ${item.value}`)
        console.log(`   时间: ${item.timestamp}`)
        if (item.raw_data && item.raw_data.originalValue !== undefined) {
          console.log(`   原始值: ${item.raw_data.originalValue} (类型: ${typeof item.raw_data.originalValue})`)
        }
        console.log('---')
      })
    } else {
      console.log('获取数据失败:', result.error)
    }
  } catch (error) {
    console.error('验证数据时出错:', error)
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('开始测试数据解析修复...\n')
  
  // 发送测试数据
  const success = await sendTestData()
  
  if (success) {
    console.log('✅ 数据发送成功')
    
    // 等待数据处理
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 验证数据
    await verifyData()
  } else {
    console.log('❌ 数据发送失败')
  }
  
  console.log('\n测试完成!')
}

// 运行测试
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { sendTestData, verifyData }
