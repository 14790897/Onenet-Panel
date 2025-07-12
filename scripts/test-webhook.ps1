# OneNet 数据推送测试脚本 (PowerShell)
# 运行方式: powershell -ExecutionPolicy Bypass -File test-webhook.ps1

$baseUrl = "http://localhost:3002"
$webhookUrl = "$baseUrl/api/onenet/webhook"

Write-Host "🚀 开始OneNet数据推送测试..." -ForegroundColor Green
Write-Host "📡 目标URL: $webhookUrl" -ForegroundColor Yellow

# 1. 检查数据库状态
Write-Host "`n📊 检查数据库状态..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/init-db" -Method GET -UseBasicParsing
    Write-Host "✅ 数据库状态检查成功" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ 数据库状态检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. 初始化数据库
Write-Host "`n🔧 初始化数据库..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/init-db" -Method POST -UseBasicParsing
    Write-Host "✅ 数据库初始化成功" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ 数据库初始化失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 发送测试数据
Write-Host "`n📡 发送测试数据..." -ForegroundColor Cyan

# 温度传感器数据
Write-Host "📤 发送: 温度传感器数据" -ForegroundColor Yellow
$tempData = '{"msg":{"at":"2025-01-12T10:00:00Z","type":1,"ds_id":"temperature","dev_id":"sensor001","value":25.6},"nonce":"test123"}'

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $tempData -UseBasicParsing
    Write-Host "✅ 温度数据发送成功 - 状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📥 响应: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 温度数据发送失败: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 湿度传感器数据
Write-Host "📤 发送: 湿度传感器数据" -ForegroundColor Yellow
$humidityData = '{"msg":{"at":"2025-01-12T10:05:00Z","type":1,"ds_id":"humidity","dev_id":"sensor002","value":65.2},"nonce":"test456"}'

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $humidityData -UseBasicParsing
    Write-Host "✅ 湿度数据发送成功 - 状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📥 响应: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 湿度数据发送失败: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# 物模型数据
Write-Host "📤 发送: 物模型数据" -ForegroundColor Yellow
$thingModelData = '{"imei":"device001","deviceName":"智能传感器","requestId":"req_123456789","productId":"test_product","timestamp":1736681400000,"type":7,"ds_id":"thing_model","value":{"temperature":{"value":28.5,"time":"2025-01-12T10:10:00Z"},"humidity":{"value":70.1,"time":"2025-01-12T10:10:00Z"}}}'

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $thingModelData -UseBasicParsing
    Write-Host "✅ 物模型数据发送成功 - 状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "📥 响应: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 物模型数据发送失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 检查数据接收情况
Write-Host "`n📊 检查数据接收情况..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/data?type=stats" -Method GET -UseBasicParsing
    Write-Host "✅ 数据统计获取成功" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ 数据统计获取失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✨ 测试完成！" -ForegroundColor Green
Write-Host "🌐 请访问 $baseUrl 查看Web界面" -ForegroundColor Yellow
