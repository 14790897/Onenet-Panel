import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log('开始测试时间分桶逻辑...')
    
    // 测试数据：不同分钟的时间戳
    const testCases = [
      { time: '2025-07-19 10:07:23', value: 25.5, expected_bucket: '2025-07-19 10:05:00' },
      { time: '2025-07-19 10:08:45', value: 25.7, expected_bucket: '2025-07-19 10:05:00' },
      { time: '2025-07-19 10:09:12', value: 25.9, expected_bucket: '2025-07-19 10:05:00' },
      { time: '2025-07-19 10:12:34', value: 26.1, expected_bucket: '2025-07-19 10:10:00' },
      { time: '2025-07-19 10:13:56', value: 26.3, expected_bucket: '2025-07-19 10:10:00' },
      { time: '2025-07-19 10:17:18', value: 26.5, expected_bucket: '2025-07-19 10:15:00' },
    ]
    
    // 测试每个时间点的分桶结果
    const bucketTests = []
    
    for (const testCase of testCases) {
      const result = await sql`
        SELECT 
          ${testCase.time}::timestamp as original_time,
          EXTRACT(minute FROM ${testCase.time}::timestamp) as minute_part,
          FLOOR(EXTRACT(minute FROM ${testCase.time}::timestamp) / 5) as floor_result,
          
          -- ❌ 错误的分桶逻辑（原始代码）
          date_trunc('minute', ${testCase.time}::timestamp) + 
          INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM ${testCase.time}::timestamp) / 5) as wrong_bucket,
          
          -- ✅ 正确的分桶逻辑（修复后）
          date_trunc('hour', ${testCase.time}::timestamp) + 
          INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM ${testCase.time}::timestamp) / 5) as correct_bucket
      `
      
      const testResult = result[0]
      const isCorrect = testResult.correct_bucket.toISOString().startsWith(testCase.expected_bucket)
      
      bucketTests.push({
        originalTime: testCase.time,
        minutePart: parseInt(testResult.minute_part),
        floorResult: parseInt(testResult.floor_result),
        wrongBucket: testResult.wrong_bucket.toISOString(),
        correctBucket: testResult.correct_bucket.toISOString(),
        expectedBucket: testCase.expected_bucket,
        isCorrect,
        value: testCase.value
      })
    }
    
    // 测试聚合分组
    const aggregationTest = await sql`
      WITH test_data AS (
        SELECT '2025-07-19 10:07:23'::timestamp as created_at, 25.5 as value
        UNION ALL SELECT '2025-07-19 10:08:45'::timestamp, 25.7
        UNION ALL SELECT '2025-07-19 10:09:12'::timestamp, 25.9
        UNION ALL SELECT '2025-07-19 10:12:34'::timestamp, 26.1
        UNION ALL SELECT '2025-07-19 10:13:56'::timestamp, 26.3
        UNION ALL SELECT '2025-07-19 10:17:18'::timestamp, 26.5
      )
      SELECT 
        date_trunc('hour', created_at) + 
        INTERVAL '5 minutes' * FLOOR(EXTRACT(minute FROM created_at) / 5) as time_bucket,
        COUNT(*) as sample_count,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value
      FROM test_data
      GROUP BY time_bucket
      ORDER BY time_bucket
    `
    
    const aggregationResults = aggregationTest.map(row => ({
      timeBucket: row.time_bucket.toISOString(),
      sampleCount: parseInt(row.sample_count),
      avgValue: parseFloat(row.avg_value),
      minValue: parseFloat(row.min_value),
      maxValue: parseFloat(row.max_value)
    }))
    
    // 验证结果
    const allCorrect = bucketTests.every(test => test.isCorrect)
    const expectedAggregation = [
      { bucket: '2025-07-19T10:05:00', count: 3, avgRange: [25.5, 25.9] },
      { bucket: '2025-07-19T10:10:00', count: 2, avgRange: [26.1, 26.3] },
      { bucket: '2025-07-19T10:15:00', count: 1, avgRange: [26.5, 26.5] }
    ]
    
    console.log('时间分桶测试完成:', {
      allBucketTestsCorrect: allCorrect,
      aggregationGroupCount: aggregationResults.length
    })
    
    return NextResponse.json({
      success: true,
      message: "时间分桶逻辑测试完成",
      results: {
        bucketTests,
        aggregationResults,
        summary: {
          allBucketTestsCorrect: allCorrect,
          totalTestCases: bucketTests.length,
          correctTestCases: bucketTests.filter(t => t.isCorrect).length,
          aggregationGroups: aggregationResults.length,
          expectedGroups: expectedAggregation.length
        }
      }
    })
    
  } catch (error) {
    console.error("时间分桶测试失败:", error)
    return NextResponse.json({ 
      success: false, 
      error: "时间分桶测试失败",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
