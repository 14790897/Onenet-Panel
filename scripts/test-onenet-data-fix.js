/**
 * 测试OneNet数据解析修复
 * 模拟发送包含数值的OneNet物模型数据
 */

const crypto = require('crypto')

// 配置
const WEBHOOK_URL = 'http://localhost:3000/api/onenet/webhook'
const TOKEN = 'your_onenet_token_here' // 与环境变量保持一致

/**
 * 生成OneNet签名
 */
function generateSignature(msg, nonce, token) {
  const str = token + nonce + msg
  const md5Hash = crypto.createHash('md5').update(str, 'utf8').digest()
  return Buffer.from(md5Hash).toString('base64')
}

/**
 * 创建测试数据 - 物模型格式
 */
function createThingModelData() {
  const data = {
    deviceId: "2454895254",
    deviceName: "living-room",
    productId: "test-product",
    messageType: "notify",
    notifyType: "property",
    data: {
      id: "test-" + Date.now(),
      version: "1.0",
      params: {
        temperature: {
          value: 29.5,
          time: Date.now()
        },
        pressure: {
          value: 1000.2,
          time: Date.now()
        },
        altitude: {
          value: 111,
          time: Date.now()
        }
      }
    }
  }
  
  return JSON.stringify(data)
}

/**
 * 创建测试数据 - 字符串数值格式
 */
function createStringValueData() {
  const data = {
    deviceId: "2454063050",
    deviceName: "bm280-bedroom",
    productId: "test-product",
    messageType: "notify",
    notifyType: "property",
    data: {
      id: "test-string-" + Date.now(),
      version: "1.0",
      params: {
        temperature: {
          value: "29.76", // 字符串格式的数值
          time: Date.now()
        },
        pressure: {
          value: "999.54",
          time: Date.now()
        },
        altitude: {
          value: "114.77",
          time: Date.now()
        }
      }
    }
  }
  
  return JSON.stringify(data)
}

/**
 * 发送测试数据
 */
async function sendTestData(msgContent, description) {
  try {
    const nonce = Math.random().toString(36).substring(2, 15)
    const signature = generateSignature(msgContent, nonce, TOKEN)
    
    const payload = {
      msg: msgContent,
      signature: signature,
      nonce: nonce,
      time: Date.now(),
      id: "test-" + Date.now()
    }
    
    console.log(`\n=== 发送测试数据: ${description} ===`)
    console.log('Payload:', JSON.stringify(payload, null, 2))
    
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
    
    if (response.ok) {
      console.log('✅ 数据发送成功')
    } else {
      console.log('❌ 数据发送失败')
    }
    
  } catch (error) {
    console.error('发送数据时出错:', error)
  }
}

/**
 * 获取最新数据进行验证
 */
async function verifyData() {
  try {
    console.log('\n=== 验证存储的数据 ===')
    const response = await fetch('http://localhost:3000/api/data?type=latest&limit=10')
    const result = await response.json()
    
    if (result.success && result.data) {
      console.log('最新数据:')
      result.data.forEach((item, index) => {
        console.log(`${index + 1}. 设备: ${item.device_id}, 数据流: ${item.datastream_id}, 数值: ${item.value}, 时间: ${item.timestamp}`)
        if (item.raw_data && item.raw_data.originalValue !== undefined) {
          console.log(`   原始值: ${item.raw_data.originalValue}`)
        }
      })
    } else {
      console.log('获取数据失败:', result.error)
    }
  } catch (error) {
    console.error('验证数据时出错:', error)
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('开始测试OneNet数据解析修复...')
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 测试1: 数值类型的参数
  await sendTestData(createThingModelData(), '数值类型参数')
  
  // 等待处理
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 测试2: 字符串类型的数值参数
  await sendTestData(createStringValueData(), '字符串类型数值参数')
  
  // 等待处理
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 验证结果
  await verifyData()
  
  console.log('\n测试完成!')
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = {
  sendTestData,
  createThingModelData,
  createStringValueData,
  verifyData
}
