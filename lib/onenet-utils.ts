import crypto from 'crypto'

// OneNET推送服务的Token配置
export const ONENET_TOKEN = process.env.ONENET_TOKEN || 'your_onenet_token_here'
export const ONENET_AES_KEY = process.env.ONENET_AES_KEY || '' // 16位AES密钥

/**
 * OneNET推送消息的数据结构
 */
export interface OneNetPushMessage {
  msg: string
  signature: string
  nonce: string
  time?: number
  id?: string
}

/**
 * 验证OneNET推送请求的签名
 * @param msg 消息内容
 * @param nonce 随机字符串
 * @param signature 签名
 * @param token OneNET配置的token
 * @returns 验证结果
 */
export function verifyOneNetSignature(
  msg: string,
  nonce: string,
  signature: string,
  token: string = ONENET_TOKEN
): boolean {
  try {
    // 按照OneNET规则拼接字符串：token + nonce + msg
    const str = token + nonce + msg
    
    // MD5加密
    const md5Hash = crypto.createHash('md5').update(str, 'utf8').digest()
    
    // Base64编码
    const calculatedSignature = Buffer.from(md5Hash).toString('base64')
    
    console.log('Signature verification:', {
      calculated: calculatedSignature,
      received: signature,
      match: calculatedSignature === signature
    })
    
    return calculatedSignature === signature
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

/**
 * 解密OneNET加密传输的消息
 * @param encryptedMsg 加密的消息内容
 * @param aesKey AES密钥（16位）
 * @returns 解密后的消息
 */
export function decryptOneNetMessage(encryptedMsg: string, aesKey: string = ONENET_AES_KEY): string {
  try {
    if (!aesKey || aesKey.length !== 16) {
      throw new Error('AES key must be 16 characters long')
    }
    
    // AES/CBC/PKCS7Padding解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', aesKey, aesKey)
    decipher.setAutoPadding(true)
    
    let decrypted = decipher.update(encryptedMsg, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Error decrypting message:', error)
    throw new Error('Failed to decrypt message')
  }
}

/**
 * 解析OneNET推送的消息内容
 * @param msgContent 消息内容（可能是加密的）
 * @param isEncrypted 是否加密
 * @returns 解析后的数据
 */
export function parseOneNetMessage(msgContent: string, isEncrypted: boolean = false) {
  try {
    let content = msgContent
    
    // 如果是加密消息，先解密
    if (isEncrypted && ONENET_AES_KEY) {
      content = decryptOneNetMessage(msgContent, ONENET_AES_KEY)
    }
    
    // 解析JSON数据
    const data = JSON.parse(content)
    
    return data
  } catch (error) {
    console.error('Error parsing OneNet message:', error)
    throw new Error('Failed to parse message content')
  }
}

/**
 * 检查是否为重复消息
 * @param messageId 消息ID
 * @returns 是否为重复消息
 */
const processedMessageIds = new Set<string>()

export function isDuplicateMessage(messageId?: string): boolean {
  if (!messageId) return false
  
  if (processedMessageIds.has(messageId)) {
    return true
  }
  
  // 添加到已处理集合，限制集合大小防止内存泄漏
  processedMessageIds.add(messageId)
  if (processedMessageIds.size > 10000) {
    // 清理一半的记录
    const entries = Array.from(processedMessageIds)
    processedMessageIds.clear()
    entries.slice(5000).forEach(id => processedMessageIds.add(id))
  }
  
  return false
}

/**
 * OneNET物模型推送消息的数据结构
 */
export interface OneNetThingModelMessage {
  deviceId: string
  deviceName: string
  productId: string
  messageType: 'notify' | 'response'
  notifyType: 'property' | 'event' | 'service'
  data: {
    id: string
    version: string
    params?: {
      [paramName: string]: {
        value: any
        time: number
      }
    }
  }
}

/**
 * 检查是否为OneNET物模型格式
 */
export function isThingModelMessage(data: any): data is OneNetThingModelMessage {
  return !!(data.deviceId && data.messageType && data.notifyType && data.data)
}

/**
 * 解析物模型参数数据
 */
export function parseThingModelParams(params: any): Array<{
  name: string
  value: any
  numericValue: number
  time: number
  originalValue: any
}> {
  const result: Array<{
    name: string
    value: any
    numericValue: number
    time: number
    originalValue: any
  }> = []

  if (!params || typeof params !== 'object') {
    return result
  }

  for (const [paramName, paramData] of Object.entries(params)) {
    if (paramData && typeof paramData === 'object') {
      const param = paramData as any
      let numericValue = 0

      // 添加详细调试信息
      console.log(`解析参数 ${paramName}:`, {
        paramData,
        paramValue: param.value,
        paramValueType: typeof param.value
      })

      // 尝试转换为数字 - 更强健的转换逻辑
      if (typeof param.value === 'number' && !isNaN(param.value)) {
        numericValue = param.value
      } else if (typeof param.value === 'string') {
        const parsed = parseFloat(param.value)
        numericValue = isNaN(parsed) ? 0 : parsed
      } else if (typeof param.value === 'boolean') {
        numericValue = param.value ? 1 : 0
      }
      
      // 如果原始值看起来是数字但转换失败，记录警告
      if (numericValue === 0 && param.value !== 0 && param.value !== '0' && param.value !== false) {
        console.warn(`数值转换可能有问题: ${paramName} = ${param.value} (类型: ${typeof param.value})`)
      }

      console.log(`转换结果 ${paramName}: ${param.value} -> ${numericValue}`)

      result.push({
        name: paramName,
        value: param.value,
        numericValue,
        time: param.time || Date.now(),
        originalValue: param.value
      })
    }
  }

  return result
}
