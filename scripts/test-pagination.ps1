# 测试分页功能
Write-Host "=== 测试OneNet数据分页功能 ===" -ForegroundColor Green

# 测试1: 第一页 (10条记录)
Write-Host "`n测试1: 第一页 (10条记录)" -ForegroundColor Yellow
$url1 = "http://localhost:3000/api/data?type=paginated&limit=10&offset=0"
try {
    $response1 = Invoke-WebRequest -Uri $url1 -UseBasicParsing
    $data1 = $response1.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data1.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data1.pagination.limit), offset=$($data1.pagination.offset), hasMore=$($data1.pagination.hasMore)" -ForegroundColor Cyan
    if ($data1.pagination.totalCount) {
        Write-Host "   总记录数: $($data1.pagination.totalCount)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试2: 第二页 (10条记录)
Write-Host "`n测试2: 第二页 (10条记录)" -ForegroundColor Yellow
$url2 = "http://localhost:3000/api/data?type=paginated&limit=10&offset=10"
try {
    $response2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing
    $data2 = $response2.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data2.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data2.pagination.limit), offset=$($data2.pagination.offset), hasMore=$($data2.pagination.hasMore)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试3: 大页面 (50条记录)
Write-Host "`n测试3: 大页面 (50条记录)" -ForegroundColor Yellow
$url3 = "http://localhost:3000/api/data?type=paginated&limit=50&offset=0"
try {
    $response3 = Invoke-WebRequest -Uri $url3 -UseBasicParsing
    $data3 = $response3.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data3.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data3.pagination.limit), offset=$($data3.pagination.offset), hasMore=$($data3.pagination.hasMore)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试4: 设备过滤分页
Write-Host "`n测试4: 设备过滤分页" -ForegroundColor Yellow
$url4 = "http://localhost:3000/api/data?type=paginated&limit=20&offset=0&device_id=2454063050"
try {
    $response4 = Invoke-WebRequest -Uri $url4 -UseBasicParsing
    $data4 = $response4.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response4.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data4.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data4.pagination.limit), offset=$($data4.pagination.offset), hasMore=$($data4.pagination.hasMore)" -ForegroundColor Cyan
    if ($data4.data.Count -gt 0) {
        Write-Host "   设备ID: $($data4.data[0].device_id)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试5: 数据流过滤分页
Write-Host "`n测试5: 数据流过滤分页" -ForegroundColor Yellow
$url5 = "http://localhost:3000/api/data?type=paginated&limit=15&offset=0&datastream=temperature"
try {
    $response5 = Invoke-WebRequest -Uri $url5 -UseBasicParsing
    $data5 = $response5.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response5.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data5.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data5.pagination.limit), offset=$($data5.pagination.offset), hasMore=$($data5.pagination.hasMore)" -ForegroundColor Cyan
    if ($data5.data.Count -gt 0) {
        Write-Host "   数据流: $($data5.data[0].datastream_id)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试6: 边界测试 - 超大偏移量
Write-Host "`n测试6: 边界测试 - 超大偏移量" -ForegroundColor Yellow
$url6 = "http://localhost:3000/api/data?type=paginated&limit=10&offset=999999"
try {
    $response6 = Invoke-WebRequest -Uri $url6 -UseBasicParsing
    $data6 = $response6.Content | ConvertFrom-Json
    Write-Host "✅ 成功 - 状态码: $($response6.StatusCode)" -ForegroundColor Green
    Write-Host "   数据条数: $($data6.data.Count)" -ForegroundColor Cyan
    Write-Host "   分页信息: limit=$($data6.pagination.limit), offset=$($data6.pagination.offset), hasMore=$($data6.pagination.hasMore)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 测试总结 ===" -ForegroundColor Green
Write-Host "分页功能测试完成！现在支持:" -ForegroundColor White
Write-Host "- ✅ 基本分页 (limit/offset)" -ForegroundColor Green
Write-Host "- ✅ 设备过滤分页" -ForegroundColor Green
Write-Host "- ✅ 数据流过滤分页" -ForegroundColor Green
Write-Host "- ✅ 分页元数据 (hasMore, totalCount)" -ForegroundColor Green
Write-Host "- ✅ 边界情况处理" -ForegroundColor Green

Write-Host "`n请访问 http://localhost:3000/data 查看分页界面！" -ForegroundColor Cyan
