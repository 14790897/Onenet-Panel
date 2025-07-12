#!/usr/bin/env node

// OneNet 数据推送测试脚本
// 运行方式: node test-onenet-webhook.js

const crypto = require('crypto')
const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3002'
const WEBHOOK_URL = `${BASE_URL}/api/onenet/webhook`

// 模拟OneNet推送数据
const mockDevices = [
  { id: 'sensor001', name: '温度传感器01' },
  { id: 'sensor002', name: '湿度传感器01' },
  { id: 'sensor003', name: '压力传感器01' },
]

const mockDatastreams = [
  { id: 'temperature', name: '温度' },
  { id: 'humidity', name: '湿度' },
  { id: 'pressure', name: '压力' },
  { id: 'voltage', name: '电压' },
]

// 生成OneNet签名（简化版）
function generateSignature(data, key = 'test_key') {
  return crypto.createHmac('md5', key).update(data).digest('base64')
}

// 生成随机数据
function generateRandomValue(datastream) {
  switch (datastream) {
    case 'temperature':
      return Number((Math.random() * 40 + 10).toFixed(1)) // 10-50°C
    case 'humidity':
      return Number((Math.random() * 60 + 30).toFixed(1)) // 30-90%
    case 'pressure':
      return Number((Math.random() * 200 + 800).toFixed(1)) // 800-1000hPa
    case 'voltage':
      return Number((Math.random() * 2 + 3).toFixed(2)) // 3-5V
    default:
      return Number((Math.random() * 100).toFixed(2))
  }
}

// 创建OneNet推送数据格式
function createOneNetData(deviceId, datastreamId, value) {
  const timestamp = new Date().toISOString()
  
  // 标准推送格式
  const standardData = {
    msg: {
      at: timestamp,
      type: 1,
      ds_id: datastreamId,
      dev_id: deviceId,
      value: value
    },
    nonce: Math.random().toString(36).substr(2, 9)
  }

  // 物模型推送格式  
  const thingModelData = {
    imei: deviceId,
    deviceName: `设备_${deviceId}`,
    requestId: `req_${Date.now()}`,
    productId: 'test_product',
    timestamp: Date.now(),
    type: 7, // 物模型数据类型
    ds_id: 'thing_model',
    value: {
      [datastreamId]: {
        value: value,
        time: timestamp
      }
    }
  }

  return { standardData, thingModelData }
}

// 发送测试数据
async function sendTestData(data, isThingModel = false) {
  try {
    const body = JSON.stringify(data)
    const signature = generateSignature(body)
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': signature, // 简化的签名头
      },
      body: body
    })

    const result = await response.text()
    console.log(`✅ ${isThingModel ? '物模型' : '标准'}数据发送成功:`, {
      status: response.status,
      deviceId: isThingModel ? data.imei : data.msg.dev_id,
      datastream: isThingModel ? Object.keys(data.value)[0] : data.msg.ds_id,
      value: isThingModel ? Object.values(data.value)[0].value : data.msg.value,
      response: result.substring(0, 100) + '...'
    })
  } catch (error) {
    console.error('❌ 发送失败:', error.message)
  }
}

// 批量发送测试数据
async function runTests() {
  console.log('🚀 开始OneNet数据推送测试...')
  console.log(`📡 目标URL: ${WEBHOOK_URL}`)
  
  // 发送多组测试数据
  for (let i = 0; i < 5; i++) {
    for (const device of mockDevices) {
      for (const datastream of mockDatastreams) {
        const value = generateRandomValue(datastream.id)
        const { standardData, thingModelData } = createOneNetData(device.id, datastream.id, value)
        
        // 随机选择发送标准格式或物模型格式
        if (Math.random() > 0.5) {
          await sendTestData(standardData, false)
        } else {
          await sendTestData(thingModelData, true)
        }
        
        // 添加小延迟避免过快发送
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`📊 第 ${i + 1} 轮数据发送完成`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('✨ 测试完成！请查看Web界面检查数据接收情况')
  console.log(`🌐 Web界面: ${BASE_URL}`)
}

// 执行测试
runTests().catch(console.error)
