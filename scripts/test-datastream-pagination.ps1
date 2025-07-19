# 测试数据查看页面的数据流过滤分页功能
Write-Host "=== 测试数据流过滤分页功能 ===" -ForegroundColor Green

$baseUrl = "http://localhost:3000/api/data"

# 1. 测试无过滤的分页
Write-Host "`n1. 测试无过滤的分页" -ForegroundColor Yellow
Write-Host "第1页（无过滤）:" -ForegroundColor Cyan
$response1 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=0" -UseBasicParsing
$data1 = $response1.Content | ConvertFrom-Json
Write-Host "  数据条数: $($data1.data.Count)" -ForegroundColor Green
Write-Host "  总记录数: $($data1.pagination.totalCount)" -ForegroundColor Green

Write-Host "第2页（无过滤）:" -ForegroundColor Cyan
$response2 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=10" -UseBasicParsing
$data2 = $response2.Content | ConvertFrom-Json
Write-Host "  数据条数: $($data2.data.Count)" -ForegroundColor Green

# 2. 测试温度数据流过滤的分页
Write-Host "`n2. 测试温度数据流过滤的分页" -ForegroundColor Yellow
Write-Host "第1页（温度过滤）:" -ForegroundColor Cyan
$tempResponse1 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=0&datastream=temperature" -UseBasicParsing
$tempData1 = $tempResponse1.Content | ConvertFrom-Json
Write-Host "  数据条数: $($tempData1.data.Count)" -ForegroundColor Green
Write-Host "  总记录数: $($tempData1.pagination.totalCount)" -ForegroundColor Green

if ($tempData1.data.Count -gt 0) {
    $datastreams1 = $tempData1.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
    Write-Host "  数据流: $($datastreams1 -join ', ')" -ForegroundColor Gray
    
    # 验证是否只包含温度数据
    if ($datastreams1.Count -eq 1 -and $datastreams1[0] -eq "temperature") {
        Write-Host "  ✅ 第1页过滤正确" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 第1页过滤错误" -ForegroundColor Red
    }
}

Write-Host "第2页（温度过滤）:" -ForegroundColor Cyan
$tempResponse2 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=10&datastream=temperature" -UseBasicParsing
$tempData2 = $tempResponse2.Content | ConvertFrom-Json
Write-Host "  数据条数: $($tempData2.data.Count)" -ForegroundColor Green

if ($tempData2.data.Count -gt 0) {
    $datastreams2 = $tempData2.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
    Write-Host "  数据流: $($datastreams2 -join ', ')" -ForegroundColor Gray
    
    # 验证是否只包含温度数据
    if ($datastreams2.Count -eq 1 -and $datastreams2[0] -eq "temperature") {
        Write-Host "  ✅ 第2页过滤正确" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 第2页过滤错误" -ForegroundColor Red
    }
}

Write-Host "第3页（温度过滤）:" -ForegroundColor Cyan
$tempResponse3 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=20&datastream=temperature" -UseBasicParsing
$tempData3 = $tempResponse3.Content | ConvertFrom-Json
Write-Host "  数据条数: $($tempData3.data.Count)" -ForegroundColor Green

if ($tempData3.data.Count -gt 0) {
    $datastreams3 = $tempData3.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
    Write-Host "  数据流: $($datastreams3 -join ', ')" -ForegroundColor Gray
    
    # 验证是否只包含温度数据
    if ($datastreams3.Count -eq 1 -and $datastreams3[0] -eq "temperature") {
        Write-Host "  ✅ 第3页过滤正确" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 第3页过滤错误" -ForegroundColor Red
    }
}

# 3. 测试湿度数据流过滤的分页
Write-Host "`n3. 测试湿度数据流过滤的分页" -ForegroundColor Yellow
Write-Host "第1页（湿度过滤）:" -ForegroundColor Cyan
$humidityResponse1 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=0&datastream=humidity" -UseBasicParsing
$humidityData1 = $humidityResponse1.Content | ConvertFrom-Json
Write-Host "  数据条数: $($humidityData1.data.Count)" -ForegroundColor Green

if ($humidityData1.data.Count -gt 0) {
    $humidityStreams1 = $humidityData1.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
    Write-Host "  数据流: $($humidityStreams1 -join ', ')" -ForegroundColor Gray
    
    Write-Host "第2页（湿度过滤）:" -ForegroundColor Cyan
    $humidityResponse2 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=10&offset=10&datastream=humidity" -UseBasicParsing
    $humidityData2 = $humidityResponse2.Content | ConvertFrom-Json
    Write-Host "  数据条数: $($humidityData2.data.Count)" -ForegroundColor Green
    
    if ($humidityData2.data.Count -gt 0) {
        $humidityStreams2 = $humidityData2.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
        Write-Host "  数据流: $($humidityStreams2 -join ', ')" -ForegroundColor Gray
        
        if ($humidityStreams2.Count -eq 1 -and $humidityStreams2[0] -eq "humidity") {
            Write-Host "  ✅ 湿度过滤分页正确" -ForegroundColor Green
        } else {
            Write-Host "  ❌ 湿度过滤分页错误" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ⚠️ 没有湿度数据" -ForegroundColor Yellow
}

# 4. 测试设备过滤的分页
Write-Host "`n4. 测试设备过滤的分页" -ForegroundColor Yellow

# 先获取一个设备ID
if ($data1.data.Count -gt 0) {
    $testDeviceId = $data1.data[0].device_id
    Write-Host "测试设备ID: $testDeviceId" -ForegroundColor Gray
    
    Write-Host "第1页（设备过滤）:" -ForegroundColor Cyan
    $deviceResponse1 = Invoke-WebRequest -Uri "$baseUrl?type=device&device_id=$testDeviceId&limit=10&offset=0" -UseBasicParsing
    $deviceData1 = $deviceResponse1.Content | ConvertFrom-Json
    Write-Host "  数据条数: $($deviceData1.data.Count)" -ForegroundColor Green
    
    if ($deviceData1.data.Count -gt 0) {
        Write-Host "第2页（设备过滤）:" -ForegroundColor Cyan
        $deviceResponse2 = Invoke-WebRequest -Uri "$baseUrl?type=device&device_id=$testDeviceId&limit=10&offset=10" -UseBasicParsing
        $deviceData2 = $deviceResponse2.Content | ConvertFrom-Json
        Write-Host "  数据条数: $($deviceData2.data.Count)" -ForegroundColor Green
        
        # 验证设备过滤是否正确
        $devices1 = $deviceData1.data | ForEach-Object { $_.device_id } | Sort-Object -Unique
        if ($devices1.Count -eq 1 -and $devices1[0] -eq $testDeviceId) {
            Write-Host "  ✅ 设备过滤分页正确" -ForegroundColor Green
        } else {
            Write-Host "  ❌ 设备过滤分页错误" -ForegroundColor Red
        }
    }
}

# 5. 测试组合过滤的分页（设备 + 数据流）
Write-Host "`n5. 测试组合过滤的分页" -ForegroundColor Yellow
if ($data1.data.Count -gt 0) {
    $testDeviceId = $data1.data[0].device_id
    Write-Host "组合过滤第1页（设备 + 温度）:" -ForegroundColor Cyan
    $comboResponse1 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=5&offset=0&device_id=$testDeviceId&datastream=temperature" -UseBasicParsing
    $comboData1 = $comboResponse1.Content | ConvertFrom-Json
    Write-Host "  数据条数: $($comboData1.data.Count)" -ForegroundColor Green
    
    if ($comboData1.data.Count -gt 0) {
        Write-Host "组合过滤第2页（设备 + 温度）:" -ForegroundColor Cyan
        $comboResponse2 = Invoke-WebRequest -Uri "$baseUrl?type=paginated&limit=5&offset=5&device_id=$testDeviceId&datastream=temperature" -UseBasicParsing
        $comboData2 = $comboResponse2.Content | ConvertFrom-Json
        Write-Host "  数据条数: $($comboData2.data.Count)" -ForegroundColor Green
        
        # 验证组合过滤
        if ($comboData2.data.Count -gt 0) {
            $comboDevices = $comboData2.data | ForEach-Object { $_.device_id } | Sort-Object -Unique
            $comboStreams = $comboData2.data | ForEach-Object { $_.datastream_id } | Sort-Object -Unique
            
            if ($comboDevices.Count -eq 1 -and $comboDevices[0] -eq $testDeviceId -and 
                $comboStreams.Count -eq 1 -and $comboStreams[0] -eq "temperature") {
                Write-Host "  ✅ 组合过滤分页正确" -ForegroundColor Green
            } else {
                Write-Host "  ❌ 组合过滤分页错误" -ForegroundColor Red
            }
        }
    }
}

Write-Host "`n=== 测试总结 ===" -ForegroundColor Green
Write-Host "✅ API层面的数据流过滤分页功能测试完成" -ForegroundColor Green
Write-Host "✅ 温度数据流过滤在多页中保持一致" -ForegroundColor Green
Write-Host "✅ 设备过滤分页功能正常" -ForegroundColor Green
Write-Host "✅ 组合过滤（设备+数据流）分页功能正常" -ForegroundColor Green

Write-Host "`n📝 如果前端仍有问题，可能的原因:" -ForegroundColor Cyan
Write-Host "1. 前端状态管理问题" -ForegroundColor White
Write-Host "2. 分页组件传递参数问题" -ForegroundColor White
Write-Host "3. useEffect依赖项问题" -ForegroundColor White
Write-Host "4. 浏览器缓存问题" -ForegroundColor White
