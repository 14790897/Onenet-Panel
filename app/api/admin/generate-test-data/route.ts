import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    console.log('开始生成测试数据...')
    
    // 生成过去24小时的测试数据
    const testDataInserts = [
      // 24小时前的数据
      { device: '2454063050', datastream: 'temperature', value: '20.5', hours: 24 },
      { device: '2454063050', datastream: 'temperature', value: '20.8', hours: 23.5 },
      { device: '2454063050', datastream: 'temperature', value: '21.2', hours: 23 },
      
      // 12小时前的数据
      { device: '2454063050', datastream: 'temperature', value: '22.1', hours: 12 },
      { device: '2454063050', datastream: 'temperature', value: '22.5', hours: 11.5 },
      { device: '2454063050', datastream: 'temperature', value: '22.8', hours: 11 },
      
      // 6小时前的数据
      { device: '2454063050', datastream: 'temperature', value: '23.2', hours: 6 },
      { device: '2454063050', datastream: 'temperature', value: '23.5', hours: 5.5 },
      { device: '2454063050', datastream: 'temperature', value: '23.8', hours: 5 },
      
      // 3小时前的数据
      { device: '2454063050', datastream: 'temperature', value: '24.1', hours: 3 },
      { device: '2454063050', datastream: 'temperature', value: '24.3', hours: 2.5 },
      { device: '2454063050', datastream: 'temperature', value: '24.5', hours: 2 },
      
      // 1小时前的数据
      { device: '2454063050', datastream: 'temperature', value: '24.8', hours: 1 },
      { device: '2454063050', datastream: 'temperature', value: '25.0', hours: 0.83 }, // 50分钟
      { device: '2454063050', datastream: 'temperature', value: '25.2', hours: 0.67 }, // 40分钟
      
      // 30分钟前的数据
      { device: '2454063050', datastream: 'temperature', value: '25.5', hours: 0.5 },
      { device: '2454063050', datastream: 'temperature', value: '25.7', hours: 0.42 }, // 25分钟
      { device: '2454063050', datastream: 'temperature', value: '25.9', hours: 0.33 }, // 20分钟
      
      // 10分钟前的数据
      { device: '2454063050', datastream: 'temperature', value: '26.1', hours: 0.17 }, // 10分钟
      { device: '2454063050', datastream: 'temperature', value: '26.3', hours: 0.13 }, // 8分钟
      { device: '2454063050', datastream: 'temperature', value: '26.5', hours: 0.08 }, // 5分钟
      
      // 最近的数据
      { device: '2454063050', datastream: 'temperature', value: '26.8', hours: 0.03 }, // 2分钟
      { device: '2454063050', datastream: 'temperature', value: '27.0', hours: 0.02 }, // 1分钟
      
      // 第二个设备的数据
      { device: '2454895254', datastream: 'temperature', value: '19.5', hours: 24 },
      { device: '2454895254', datastream: 'temperature', value: '19.8', hours: 12 },
      { device: '2454895254', datastream: 'temperature', value: '20.2', hours: 6 },
      { device: '2454895254', datastream: 'temperature', value: '20.5', hours: 3 },
      { device: '2454895254', datastream: 'temperature', value: '20.8', hours: 1 },
      { device: '2454895254', datastream: 'temperature', value: '21.1', hours: 0.5 },
      { device: '2454895254', datastream: 'temperature', value: '21.4', hours: 0.17 },
      { device: '2454895254', datastream: 'temperature', value: '21.7', hours: 0.03 },
      
      // 湿度数据
      { device: '2454063050', datastream: 'humidity', value: '45.2', hours: 24 },
      { device: '2454063050', datastream: 'humidity', value: '46.5', hours: 12 },
      { device: '2454063050', datastream: 'humidity', value: '47.8', hours: 6 },
      { device: '2454063050', datastream: 'humidity', value: '48.1', hours: 3 },
      { device: '2454063050', datastream: 'humidity', value: '48.5', hours: 1 },
      { device: '2454063050', datastream: 'humidity', value: '49.0', hours: 0.5 },
      { device: '2454063050', datastream: 'humidity', value: '49.5', hours: 0.17 },
      { device: '2454063050', datastream: 'humidity', value: '50.0', hours: 0.03 }
    ]
    
    let insertedCount = 0
    
    // 批量插入数据
    for (const item of testDataInserts) {
      const createdAt = new Date(Date.now() - item.hours * 60 * 60 * 1000)
      
      await sql`
        INSERT INTO onenet_data (device_id, datastream_id, value, created_at, raw_data)
        VALUES (
          ${item.device}, 
          ${item.datastream}, 
          ${item.value}, 
          ${createdAt.toISOString()},
          ${JSON.stringify({ deviceName: `测试设备${item.device.slice(-1)}`, productId: "test" })}
        )
      `
      insertedCount++
    }
    
    // 验证插入的数据
    const verification = await sql`
      SELECT 
        COUNT(*) as total_count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 3600 as hours_span
      FROM onenet_data 
      WHERE device_id IN ('2454063050', '2454895254')
        AND raw_data->>'productId' = 'test'
    `
    
    console.log('测试数据生成完成:', {
      insertedCount,
      verification: verification[0]
    })
    
    return NextResponse.json({
      success: true,
      message: `成功生成 ${insertedCount} 条测试数据`,
      insertedCount,
      dataSpan: {
        totalRecords: parseInt(verification[0].total_count),
        earliest: verification[0].earliest,
        latest: verification[0].latest,
        hoursSpan: parseFloat(verification[0].hours_span)
      }
    })
    
  } catch (error) {
    console.error("生成测试数据失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "生成测试数据失败",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    // 删除测试数据
    const result = await sql`
      DELETE FROM onenet_data 
      WHERE raw_data->>'productId' = 'test'
    `
    
    return NextResponse.json({
      success: true,
      message: `成功删除测试数据`,
      deletedCount: result.length || 0
    })
    
  } catch (error) {
    console.error("删除测试数据失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "删除测试数据失败" 
    }, { status: 500 })
  }
}
