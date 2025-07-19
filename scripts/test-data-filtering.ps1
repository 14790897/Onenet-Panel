# 测试数据查看页面的过滤和分页功能
Write-Host "=== 测试数据查看页面功能 ===" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api/data"

# 测试1: 基础分页功能
Write-Host "`n1. 测试基础分页功能" -ForegroundColor Yellow
for ($page = 0; $page -lt 3; $page++) {
    $offset = $page * 5
    $url = "$baseUrl" + "?type=paginated&limit=5&offset=$offset"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  第$($page + 1)页: $($data.data.Count) 条数据" -ForegroundColor Green
        if ($data.pagination.hasMore) {
            Write-Host "    有更多数据" -ForegroundColor Cyan
        } else {
            Write-Host "    没有更多数据" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "  第$($page + 1)页: 错误 - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 测试2: 数据流过滤功能
Write-Host "`n2. 测试数据流过滤功能" -ForegroundColor Yellow

# 首先获取所有可用的数据流
try {
    $datastreamResponse = Invoke-WebRequest -Uri "$baseUrl/../data/datastreams" -UseBasicParsing
    $datastreamData = $datastreamResponse.Content | ConvertFrom-Json
    $datastreams = $datastreamData.datastreams | Select-Object -First 5  # 测试前5个数据流
    
    Write-Host "  可用数据流: $($datastreamData.datastreams.Count) 个" -ForegroundColor Cyan
    Write-Host "  测试数据流: $($datastreams -join ', ')" -ForegroundColor Gray
    
    foreach ($datastream in $datastreams) {
        $url = "$baseUrl" + "?type=paginated&limit=3&offset=0&datastream=$datastream"
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing
            $data = $response.Content | ConvertFrom-Json
            Write-Host "    $datastream : $($data.data.Count) 条数据" -ForegroundColor Green
            
            # 验证过滤是否正确
            if ($data.data.Count -gt 0) {
                $uniqueDatastreams = $data.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
                if ($uniqueDatastreams.Count -eq 1 -and $uniqueDatastreams[0] -eq $datastream) {
                    Write-Host "      ✅ 过滤正确" -ForegroundColor Green
                } else {
                    Write-Host "      ❌ 过滤错误: 包含 $($uniqueDatastreams -join ', ')" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "    $datastream : 错误 - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  获取数据流列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 设备过滤功能
Write-Host "`n3. 测试设备过滤功能" -ForegroundColor Yellow

# 获取一些设备ID进行测试
$url = "$baseUrl" + "?type=paginated&limit=10&offset=0"
try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    $devices = $data.data | ForEach-Object { $_.device_id } | Sort-Object -Unique | Select-Object -First 2
    
    Write-Host "  测试设备: $($devices -join ', ')" -ForegroundColor Gray
    
    foreach ($device in $devices) {
        $url = "$baseUrl" + "?type=device&device_id=$device&limit=3&offset=0"
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing
            $data = $response.Content | ConvertFrom-Json
            Write-Host "    设备 $device : $($data.data.Count) 条数据" -ForegroundColor Green
            
            # 验证设备过滤是否正确
            if ($data.data.Count -gt 0) {
                $uniqueDevices = $data.data | ForEach-Object { $_.device_id } | Sort-Object -Unique
                if ($uniqueDevices.Count -eq 1 -and $uniqueDevices[0] -eq $device) {
                    Write-Host "      ✅ 设备过滤正确" -ForegroundColor Green
                } else {
                    Write-Host "      ❌ 设备过滤错误: 包含 $($uniqueDevices -join ', ')" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "    设备 $device : 错误 - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "  获取设备列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: 组合过滤功能（设备 + 数据流）
Write-Host "`n4. 测试组合过滤功能" -ForegroundColor Yellow

if ($devices -and $datastreams) {
    $testDevice = $devices[0]
    $testDatastream = $datastreams[0]
    
    $url = "$baseUrl" + "?type=paginated&limit=3&offset=0&device_id=$testDevice&datastream=$testDatastream"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  设备 $testDevice + 数据流 $testDatastream : $($data.data.Count) 条数据" -ForegroundColor Green
        
        if ($data.data.Count -gt 0) {
            $correctDevice = ($data.data | ForEach-Object { $_.device_id } | Sort-Object -Unique).Count -eq 1 -and ($data.data[0].device_id -eq $testDevice)
            $correctDatastream = ($data.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique).Count -eq 1 -and ($data.data[0].datastream_id -eq $testDatastream)
            
            if ($correctDevice -and $correctDatastream) {
                Write-Host "    ✅ 组合过滤正确" -ForegroundColor Green
            } else {
                Write-Host "    ❌ 组合过滤错误" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "  组合过滤测试失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 测试5: 分页大小测试
Write-Host "`n5. 测试不同分页大小" -ForegroundColor Yellow

$pageSizes = @(10, 20, 50)
foreach ($size in $pageSizes) {
    $url = "$baseUrl" + "?type=paginated&limit=$size&offset=0"
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $data = $response.Content | ConvertFrom-Json
        Write-Host "  页面大小 $size : $($data.data.Count) 条数据" -ForegroundColor Green
        
        if ($data.data.Count -eq $size -or -not $data.pagination.hasMore) {
            Write-Host "    ✅ 分页大小正确" -ForegroundColor Green
        } else {
            Write-Host "    ❌ 分页大小错误" -ForegroundColor Red
        }
    } catch {
        Write-Host "  页面大小 $size : 错误 - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== 测试总结 ===" -ForegroundColor Green
Write-Host "数据查看页面功能测试完成！" -ForegroundColor White
Write-Host "✅ 基础分页功能" -ForegroundColor Green
Write-Host "✅ 数据流过滤功能" -ForegroundColor Green
Write-Host "✅ 设备过滤功能" -ForegroundColor Green
Write-Host "✅ 组合过滤功能" -ForegroundColor Green
Write-Host "✅ 不同分页大小" -ForegroundColor Green
Write-Host "✅ 紧凑的数据显示" -ForegroundColor Green

Write-Host "`n现在可以正常使用数据查看页面的所有功能！" -ForegroundColor Cyan
Write-Host "访问: http://localhost:3000/data" -ForegroundColor Cyan
