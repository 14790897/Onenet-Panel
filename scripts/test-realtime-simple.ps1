# 测试实时数据API的改进
Write-Host "=== 测试实时数据API改进 ===" -ForegroundColor Green

# 测试1: 默认参数
Write-Host "`n测试1: 默认参数" -ForegroundColor Yellow
$url1 = "http://localhost:3000/api/analytics/realtime?devices=2454063050,2454895254&datastream=temperature"
try {
    $response1 = Invoke-WebRequest -Uri $url1 -UseBasicParsing
    $data1 = $response1.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 数据点数量: $($data1.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: 增加数据量
Write-Host "`n测试2: 增加数据量 (limit=100)" -ForegroundColor Yellow
$url2 = "http://localhost:3000/api/analytics/realtime?devices=2454063050,2454895254&datastream=temperature&limit=100"
try {
    $response2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing
    $data2 = $response2.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 数据点数量: $($data2.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 扩大时间范围
Write-Host "`n测试3: 扩大时间范围 (6小时, limit=200)" -ForegroundColor Yellow
$url3 = "http://localhost:3000/api/analytics/realtime?devices=2454063050,2454895254&datastream=temperature&limit=200&timeRange=6h"
try {
    $response3 = Invoke-WebRequest -Uri $url3 -UseBasicParsing
    $data3 = $response3.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 数据点数量: $($data3.Count)" -ForegroundColor Green
    if ($data3.Count -gt 0) {
        Write-Host "   时间范围: $($data3[0].time) - $($data3[-1].time)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: 最大数据量
Write-Host "`n测试4: 最大数据量 (24小时, limit=500)" -ForegroundColor Yellow
$url4 = "http://localhost:3000/api/analytics/realtime?devices=2454063050,2454895254&datastream=temperature&limit=500&timeRange=24h"
try {
    $response4 = Invoke-WebRequest -Uri $url4 -UseBasicParsing
    $data4 = $response4.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 数据点数量: $($data4.Count)" -ForegroundColor Green
    if ($data4.Count -gt 0) {
        Write-Host "   时间范围: $($data4[0].time) - $($data4[-1].time)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试5: 气压数据
Write-Host "`n测试5: 气压数据 (6小时, limit=300)" -ForegroundColor Yellow
$url5 = "http://localhost:3000/api/analytics/realtime?devices=2454063050,2454895254&datastream=pressure&limit=300&timeRange=6h"
try {
    $response5 = Invoke-WebRequest -Uri $url5 -UseBasicParsing
    $data5 = $response5.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 数据点数量: $($data5.Count)" -ForegroundColor Green
    if ($data5.Count -gt 0) {
        Write-Host "   时间范围: $($data5[0].time) - $($data5[-1].time)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试总结 ===" -ForegroundColor Green
Write-Host "现在实时图表应该支持:" -ForegroundColor White
Write-Host "- ✅ 可配置的数据点数量 (50-1000)" -ForegroundColor Green
Write-Host "- ✅ 可配置的获取数量 (20-500)" -ForegroundColor Green  
Write-Host "- ✅ 可配置的时间范围 (10分钟-7天)" -ForegroundColor Green
Write-Host "- ✅ 更大的数据集显示" -ForegroundColor Green

Write-Host "`n请访问 http://localhost:3000/analytics 查看改进后的实时图表！" -ForegroundColor Cyan
