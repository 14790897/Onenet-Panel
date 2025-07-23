'use client'

import { useState } from 'react'

export default function Test2hInterval() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // 测试您提供的失败URL，但使用2h间隔
      const url = '/api/analytics/comparison?devices=2454063050%2C2457220437&datastream=voc_ugm3&start_date=2025-07-16T10%3A55%3A06.922Z&end_date=2025-07-23T10%3A55%3A06.922Z&interval=2h'
      
      console.log('🔄 测试2h间隔API:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ 2h间隔API成功返回:', result)
      setData(result)
    } catch (err) {
      console.error('❌ 2h间隔API失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">测试 2h 间隔 API</h1>
      
      <div className="mb-6">
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试 2h 间隔'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">错误:</h3>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">API 返回结果:</h3>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>数据点数量:</strong> {data.length}</p>
            {data.length > 0 && (
              <>
                <p><strong>第一个数据点:</strong></p>
                <pre className="text-sm bg-white p-2 rounded mt-2">
                  {JSON.stringify(data[0], null, 2)}
                </pre>
                <p className="mt-2"><strong>最后一个数据点:</strong></p>
                <pre className="text-sm bg-white p-2 rounded mt-2">
                  {JSON.stringify(data[data.length - 1], null, 2)}
                </pre>
              </>
            )}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p><strong>测试URL:</strong></p>
        <code className="bg-gray-100 p-2 rounded block mt-1 break-all">
          /api/analytics/comparison?devices=2454063050%2C2457220437&datastream=voc_ugm3&start_date=2025-07-16T10%3A55%3A06.922Z&end_date=2025-07-23T10%3A55%3A06.922Z&interval=2h
        </code>
      </div>
    </div>
  )
}
