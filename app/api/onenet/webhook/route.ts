import { type NextRequest, NextResponse } from "next/server"
import { insertOneNetData } from "@/lib/database"
import {
  verifyOneNetSignature,
  parseOneNetMessage,
  isDuplicateMessage,
  type OneNetPushMessage,
  ONENET_TOKEN,
  ONENET_AES_KEY
} from "@/lib/onenet-utils"

/**
 * GET请求处理 - OneNET URL验证
 * OneNET平台会发送GET请求来验证URL的有效性
 * 请求格式: http(s)://url?msg=xxx&nonce=xxx&signature=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const msg = searchParams.get('msg')
    const nonce = searchParams.get('nonce')
    const signature = searchParams.get('signature')

    console.log('OneNET URL验证请求:', { msg, nonce, signature })

    // 检查必需参数
    if (!msg || !nonce || !signature) {
      return NextResponse.json(
        { error: "Missing required parameters: msg, nonce, or signature" },
        { status: 400 }
      )
    }

    // 验证签名（可选，如果不需要验证token可以跳过）
    const isValidSignature = verifyOneNetSignature(msg, nonce, signature, ONENET_TOKEN)
    
    if (!isValidSignature && ONENET_TOKEN !== 'your_onenet_token_here') {
      console.warn('签名验证失败，但仍返回msg以通过验证')
    }

    // 无论签名是否验证成功，都返回msg参数以通过OneNET验证
    return new NextResponse(msg, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  } catch (error) {
    console.error("OneNET URL验证错误:", error)
    return NextResponse.json(
      { error: "URL verification failed" },
      { status: 500 }
    )
  }
}

/**
 * POST请求处理 - OneNET数据推送
 * OneNET平台推送数据的格式：
 * {
 *   "msg": "消息内容（JSON字符串或加密内容）",
 *   "signature": "加密签名",
 *   "nonce": "随机字符串",
 *   "time": 推送时间戳,
 *   "id": "消息ID"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: OneNetPushMessage = await request.json()
    console.log("收到OneNET推送数据:", {
      hasMsg: !!body.msg,
      signature: body.signature,
      nonce: body.nonce,
      time: body.time,
      id: body.id
    })

    // 验证必需字段
    if (!body.msg || !body.signature || !body.nonce) {
      return NextResponse.json(
        { error: "Missing required fields: msg, signature, or nonce" },
        { status: 400 }
      )
    }

    // 检查重复消息
    if (body.id && isDuplicateMessage(body.id)) {
      console.log(`重复消息，跳过处理: ${body.id}`)
      return new NextResponse('OK', { status: 200 })
    }

    // 验证签名
    const isValidSignature = verifyOneNetSignature(body.msg, body.nonce, body.signature, ONENET_TOKEN)
    
    if (!isValidSignature && ONENET_TOKEN !== 'your_onenet_token_here') {
      console.error('OneNET签名验证失败')
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    // 解析消息内容
    let messageData
    try {
      // 判断是否为加密消息（如果配置了AES密钥且消息看起来是Base64编码）
      const isEncrypted = Boolean(ONENET_AES_KEY && ONENET_AES_KEY.length === 16 && 
                         /^[A-Za-z0-9+/=]+$/.test(body.msg))
      
      messageData = parseOneNetMessage(body.msg, isEncrypted)
      console.log('解析的消息数据:', messageData)
    } catch (parseError) {
      console.error('消息解析失败:', parseError)
      // 即使解析失败也返回200，避免OneNET重推
      return new NextResponse('OK', { status: 200 })
    }

    // 处理不同类型的OneNET消息
    await processOneNetMessage(messageData, body)

    // 必须快速返回200状态码，避免OneNET认为推送失败而重试
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error("OneNET数据处理错误:", error)
    // 即使出错也返回200，避免无限重试
    return new NextResponse('OK', { status: 200 })
  }
}

/**
 * 处理OneNET推送的消息数据
 */
async function processOneNetMessage(messageData: any, originalMessage: OneNetPushMessage) {
  try {
    // 根据消息类型进行不同处理
    if (messageData.type) {
      switch (messageData.type) {
        case 'device_data':
          await handleDeviceData(messageData)
          break
        case 'device_lifecycle':
          await handleDeviceLifecycle(messageData)
          break
        case 'scene_trigger':
          await handleSceneTrigger(messageData)
          break
        default:
          console.log('未知消息类型:', messageData.type)
          await handleGenericData(messageData, originalMessage)
      }
    } else {
      // 通用数据处理
      await handleGenericData(messageData, originalMessage)
    }
  } catch (error) {
    console.error('消息处理失败:', error)
  }
}

/**
 * 处理设备数据
 */
async function handleDeviceData(data: any) {
  const { device_id, datastream_id, value, timestamp } = data
  
  if (device_id && datastream_id && value !== undefined) {
    await insertOneNetData({
      device_id: String(device_id),
      datastream_id: String(datastream_id),
      value: Number(value),
      raw_data: data,
    })
    console.log('设备数据已存储:', { device_id, datastream_id, value })
  }
}

/**
 * 处理设备生命周期事件
 */
async function handleDeviceLifecycle(data: any) {
  console.log('设备生命周期事件:', data)
  // TODO: 实现设备状态更新逻辑
}

/**
 * 处理场景联动触发
 */
async function handleSceneTrigger(data: any) {
  console.log('场景联动触发:', data)
  // TODO: 实现场景联动处理逻辑
}

/**
 * 处理通用数据（兼容旧格式）
 */
async function handleGenericData(data: any, originalMessage: OneNetPushMessage) {
  try {
    // 尝试从数据中提取设备信息
    const { device_id, datastream_id, value, timestamp, ...rawData } = data

    if (device_id && datastream_id && value !== undefined) {
      await insertOneNetData({
        device_id: String(device_id),
        datastream_id: String(datastream_id),
        value: Number(value),
        raw_data: { ...rawData, originalMessage },
      })
      console.log('通用数据已存储:', { device_id, datastream_id, value })
    } else {
      console.log('数据格式不匹配，记录原始消息:', data)
    }
  } catch (error) {
    console.error('通用数据处理失败:', error)
  }
}
