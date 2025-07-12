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
  name: string;
  value: any;
  numericValue: number;
  time: number;
  originalValue: any;
}> {
  const result: Array<{
    name: string;
    value: any;
    numericValue: number;
    time: number;
    originalValue: any;
  }> = [];

  if (!params || typeof params !== "object") {
    console.log("parseThingModelParams: params为空或不是对象", params);
    return result;
  }

  console.log("parseThingModelParams: 开始解析参数", params);

  for (const [paramName, paramData] of Object.entries(params)) {
    console.log(`处理参数 ${paramName}:`, paramData);

    // 检查参数数据结构
    if (paramData && typeof paramData === "object") {
      const param = paramData as any;
      let numericValue = 0;

      // 添加详细调试信息
      console.log(`解析参数 ${paramName}:`, {
        paramData,
        paramValue: param.value,
        paramValueType: typeof param.value,
        hasValue: param.hasOwnProperty("value"),
        paramKeys: Object.keys(param),
      });

      // 更强健的数值转换逻辑
      if (param.hasOwnProperty("value")) {
        const rawValue = param.value;

        if (typeof rawValue === "number" && !isNaN(rawValue)) {
          numericValue = rawValue;
        } else if (typeof rawValue === "string") {
          // 尝试解析字符串数字
          const trimmed = rawValue.trim();
          if (trimmed !== "") {
            const parsed = parseFloat(trimmed);
            numericValue = isNaN(parsed) ? 0 : parsed;
          }
        } else if (typeof rawValue === "boolean") {
          numericValue = rawValue ? 1 : 0;
        } else if (rawValue === null || rawValue === undefined) {
          numericValue = 0;
        } else {
          // 尝试强制转换其他类型
          const parsed = Number(rawValue);
          numericValue = isNaN(parsed) ? 0 : parsed;
        }
      } else {
        // 如果没有value字段，检查是否直接是数值
        if (typeof paramData === "number" && !isNaN(paramData)) {
          numericValue = paramData;
          param.value = paramData;
        }
      }

      // 记录转换结果
      console.log(`转换结果 ${paramName}: ${param.value} -> ${numericValue}`);

      // 如果原始值看起来是数字但转换失败，记录警告
      if (
        numericValue === 0 &&
        param.value !== 0 &&
        param.value !== "0" &&
        param.value !== false &&
        param.value !== null &&
        param.value !== undefined
      ) {
        console.warn(
          `数值转换可能有问题: ${paramName} = ${
            param.value
          } (类型: ${typeof param.value})`
        );
      }

      result.push({
        name: paramName,
        value: param.value,
        numericValue,
        time: param.time || Date.now(),
        originalValue: param.value,
      });
    } else {
      // 处理非对象类型的参数数据
      console.log(
        `参数 ${paramName} 不是对象类型:`,
        typeof paramData,
        paramData
      );

      let numericValue = 0;
      if (typeof paramData === "number" && !isNaN(paramData)) {
        numericValue = paramData;
      } else if (typeof paramData === "string") {
        const parsed = parseFloat(paramData.trim());
        numericValue = isNaN(parsed) ? 0 : parsed;
      }

      result.push({
        name: paramName,
        value: paramData,
        numericValue,
        time: Date.now(),
        originalValue: paramData,
      });
    }
  }

  console.log("parseThingModelParams: 解析完成", result);
  return result;
}

/**
 * 设备数据分析工具
 */
export interface DeviceDataPoint {
  device_id: string;
  device_name?: string;
  datastream_id: string;
  value: number;
  timestamp: string;
  raw_data?: any;
}

/**
 * 获取设备友好名称
 */
export function getDeviceFriendlyName(deviceId: string, rawData?: any): string {
  // 从原始数据中提取设备名称
  if (rawData?.deviceName) {
    return rawData.deviceName;
  }

  // 根据设备ID映射友好名称
  const deviceNameMap: Record<string, string> = {
    "2454895254": "客厅传感器",
    "2454063050": "卧室传感器",
    "living-room": "客厅传感器",
    "bm280-bedroom": "卧室传感器",
  };

  return deviceNameMap[deviceId] || `设备 ${deviceId}`;
}

/**
 * 获取数据流友好名称和单位
 */
export function getDatastreamInfo(datastreamId: string): {
  name: string;
  unit: string;
  icon: string;
} {
  const datastreamMap: Record<
    string,
    { name: string; unit: string; icon: string }
  > = {
    temperature: { name: "温度", unit: "°C", icon: "🌡️" },
    pressure: { name: "气压", unit: "hPa", icon: "🌪️" },
    altitude: { name: "海拔", unit: "m", icon: "⛰️" },
    humidity: { name: "湿度", unit: "%", icon: "💧" },
  };

  return (
    datastreamMap[datastreamId] || { name: datastreamId, unit: "", icon: "📊" }
  );
}

/**
 * 格式化数值显示
 */
export function formatSensorValue(value: number, datastreamId: string): string {
  const info = getDatastreamInfo(datastreamId);

  // 根据数据类型决定小数位数
  let decimals = 1;
  if (datastreamId === "pressure") {
    decimals = 2;
  } else if (datastreamId === "altitude") {
    decimals = 0;
  }

  return `${value.toFixed(decimals)}${info.unit}`;
}

/**
 * 判断传感器数值是否异常
 */
export function isSensorValueAbnormal(
  value: number,
  datastreamId: string
): boolean {
  const thresholds: Record<string, { min: number; max: number }> = {
    temperature: { min: -40, max: 60 }, // 温度范围 -40°C 到 60°C
    pressure: { min: 800, max: 1200 }, // 气压范围 800-1200 hPa
    altitude: { min: -500, max: 9000 }, // 海拔范围 -500m 到 9000m
    humidity: { min: 0, max: 100 }, // 湿度范围 0-100%
  };

  const threshold = thresholds[datastreamId];
  if (!threshold) return false;

  return value < threshold.min || value > threshold.max;
}

/**
 * 计算传感器数据趋势
 */
export function calculateDataTrend(
  data: DeviceDataPoint[]
): "rising" | "falling" | "stable" {
  if (data.length < 2) return "stable";

  // 取最近的几个数据点计算趋势
  const recentData = data.slice(-5);
  const values = recentData.map((d) => d.value);

  // 计算简单的线性趋势
  let rising = 0;
  let falling = 0;

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (Math.abs(diff) > 0.1) {
      // 忽略微小变化
      if (diff > 0) rising++;
      else falling++;
    }
  }

  if (rising > falling) return "rising";
  if (falling > rising) return "falling";
  return "stable";
}

/**
 * 生成数据摘要报告
 */
export function generateDataSummary(data: DeviceDataPoint[]): {
  deviceCount: number;
  datastreamCount: number;
  latestTimestamp: string;
  deviceSummaries: Array<{
    deviceId: string;
    deviceName: string;
    datastreams: Array<{
      name: string;
      latestValue: string;
      trend: "rising" | "falling" | "stable";
      isAbnormal: boolean;
    }>;
  }>;
} {
  const deviceGroups = new Map<string, DeviceDataPoint[]>();

  // 按设备分组
  data.forEach((point) => {
    const key = point.device_id;
    if (!deviceGroups.has(key)) {
      deviceGroups.set(key, []);
    }
    deviceGroups.get(key)!.push(point);
  });

  const deviceSummaries = Array.from(deviceGroups.entries()).map(
    ([deviceId, deviceData]) => {
      const datastreamGroups = new Map<string, DeviceDataPoint[]>();

      // 按数据流分组
      deviceData.forEach((point) => {
        const key = point.datastream_id;
        if (!datastreamGroups.has(key)) {
          datastreamGroups.set(key, []);
        }
        datastreamGroups.get(key)!.push(point);
      });

      const datastreams = Array.from(datastreamGroups.entries()).map(
        ([datastreamId, streamData]) => {
          // 按时间排序
          streamData.sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const latest = streamData[streamData.length - 1];
          const trend = calculateDataTrend(streamData);
          const isAbnormal = isSensorValueAbnormal(latest.value, datastreamId);

          return {
            name: getDatastreamInfo(datastreamId).name,
            latestValue: formatSensorValue(latest.value, datastreamId),
            trend,
            isAbnormal,
          };
        }
      );

      return {
        deviceId,
        deviceName: getDeviceFriendlyName(deviceId, deviceData[0]?.raw_data),
        datastreams,
      };
    }
  );

  return {
    deviceCount: deviceGroups.size,
    datastreamCount: new Set(data.map((d) => d.datastream_id)).size,
    latestTimestamp:
      data.length > 0
        ? data.reduce((latest, current) =>
            new Date(current.timestamp) > new Date(latest.timestamp)
              ? current
              : latest
          ).timestamp
        : "",
    deviceSummaries,
  };
}
