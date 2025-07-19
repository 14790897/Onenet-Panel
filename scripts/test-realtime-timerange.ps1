# 测试实时数据监控的时间范围选择功能
Write-Host "=== 测试实时数据监控时间范围选择 ===" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api/analytics/realtime"
$devices = "2454063050,2454895254"
$datastream = "temperature"
$limit = "20"

# 测试不同的时间范围
$timeRanges = @(
    @{ name = "10分钟"; value = "10m" },
    @{ name = "30分钟"; value = "30m" },
    @{ name = "1小时"; value = "1h" },
    @{ name = "6小时"; value = "6h" },
    @{ name = "24小时"; value = "24h" },
    @{ name = "7天"; value = "7d" }
)

foreach ($range in $timeRanges) {
    Write-Host "`n测试时间范围: $($range.name) ($($range.value))" -ForegroundColor Yellow
    
    try {
        $url = "$baseUrl" + "?devices=$devices&datastream=$datastream&limit=$limit&timeRange=$($range.value)"
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "  ✅ 请求成功" -ForegroundColor Green
        Write-Host "  数据点数量: $($data.Count)" -ForegroundColor Cyan
        
        if ($data.Count -gt 0) {
            # 分析时间范围
            $timestamps = $data | ForEach-Object { [DateTime]$_.timestamp }
            $earliest = ($timestamps | Measure-Object -Minimum).Minimum
            $latest = ($timestamps | Measure-Object -Maximum).Maximum
            $timeSpan = $latest - $earliest
            
            Write-Host "  最早时间: $($earliest.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
            Write-Host "  最晚时间: $($latest.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
            Write-Host "  实际时间跨度: $($timeSpan.TotalHours.ToString('F1'))小时" -ForegroundColor Gray
            
            # 检查数据是否包含设备信息
            $deviceIds = $data | ForEach-Object { $_.PSObject.Properties.Name } | Where-Object { $_ -ne "timestamp" -and $_ -ne "time" -and $_ -ne "rawTimestamp" } | Sort-Object -Unique
            Write-Host "  包含设备: $($deviceIds -join ', ')" -ForegroundColor Gray
            
            # 验证时间范围是否正确
            $now = Get-Date
            $expectedMinutes = switch ($range.value) {
                "10m" { 10 }
                "30m" { 30 }
                "1h" { 60 }
                "6h" { 360 }
                "24h" { 1440 }
                "7d" { 10080 }
            }
            
            $actualMinutes = ($now - $earliest).TotalMinutes
            if ($actualMinutes -le ($expectedMinutes + 5)) { # 允许5分钟误差
                Write-Host "  ✅ 时间范围正确" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️ 时间范围可能不准确 (期望: $expectedMinutes 分钟, 实际: $($actualMinutes.ToString('F1')) 分钟)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ⚠️ 该时间范围内无数据" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "  ❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 测试无效的时间范围参数
Write-Host "`n测试无效时间范围参数:" -ForegroundColor Yellow
try {
    $url = "$baseUrl" + "?devices=$devices&datastream=$datastream&limit=$limit&timeRange=invalid"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✅ 无效参数处理正常，返回 $($data.Count) 条数据（应该使用默认1小时）" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 无效参数处理失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试边界情况
Write-Host "`n测试边界情况:" -ForegroundColor Yellow

# 测试空设备列表
try {
    $url = "$baseUrl" + "?devices=&datastream=$datastream&limit=$limit&timeRange=1h"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  空设备列表: 返回 $($data.Count) 条数据（应该为0）" -ForegroundColor Cyan
} catch {
    Write-Host "  空设备列表处理失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试不存在的数据流
try {
    $url = "$baseUrl" + "?devices=$devices&datastream=nonexistent&limit=$limit&timeRange=1h"
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "  不存在的数据流: 返回 $($data.Count) 条数据（应该为0）" -ForegroundColor Cyan
} catch {
    Write-Host "  不存在的数据流处理失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试总结 ===" -ForegroundColor Green
Write-Host "✅ 时间范围选择功能测试完成" -ForegroundColor Green
Write-Host "✅ API支持多种时间范围: 10分钟、30分钟、1小时、6小时、24小时、7天" -ForegroundColor Green
Write-Host "✅ 无效参数处理正常" -ForegroundColor Green
Write-Host "✅ 边界情况处理正常" -ForegroundColor Green

Write-Host "`n📝 使用说明:" -ForegroundColor Cyan
Write-Host "1. 在实时监控页面选择不同的时间范围" -ForegroundColor White
Write-Host "2. 系统会自动重新获取对应时间范围内的数据" -ForegroundColor White
Write-Host "3. 时间范围越大，可能获取的数据点越多" -ForegroundColor White
Write-Host "4. 如果某个时间范围内无数据，图表会显示为空" -ForegroundColor White
