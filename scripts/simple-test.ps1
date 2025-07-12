# Simple OneNet Test Script
$baseUrl = "http://localhost:3002"
$webhookUrl = "$baseUrl/api/onenet/webhook"

Write-Host "Testing OneNet Webhook..." -ForegroundColor Green

# 1. Check database status
Write-Host "Checking database status..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/init-db" -Method GET -UseBasicParsing
    Write-Host "Database status check successful" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Database status check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Initialize database
Write-Host "Initializing database..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/init-db" -Method POST -UseBasicParsing
    Write-Host "Database initialization successful" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Database initialization failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Send test data
Write-Host "Sending test data..." -ForegroundColor Cyan

# Temperature sensor data
$tempData = '{"msg":{"at":"2025-01-12T10:00:00Z","type":1,"ds_id":"temperature","dev_id":"sensor001","value":25.6},"nonce":"test123"}'

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $tempData -UseBasicParsing
    Write-Host "Temperature data sent successfully - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Temperature data send failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Humidity sensor data
$humidityData = '{"msg":{"at":"2025-01-12T10:05:00Z","type":1,"ds_id":"humidity","dev_id":"sensor002","value":65.2},"nonce":"test456"}'

try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ContentType "application/json" -Body $humidityData -UseBasicParsing
    Write-Host "Humidity data sent successfully - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "Humidity data send failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Check data statistics
Write-Host "Checking data statistics..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/data?type=stats" -Method GET -UseBasicParsing
    Write-Host "Data statistics retrieved successfully" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Data statistics retrieval failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed! Please visit $baseUrl to see the web interface" -ForegroundColor Yellow
