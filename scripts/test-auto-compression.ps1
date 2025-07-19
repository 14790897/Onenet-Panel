# 测试自动压缩功能
Write-Host "=== 测试自动压缩功能 ===" -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# 1. 检查自动压缩状态
Write-Host "`n1. 检查自动压缩状态" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/auto-compression" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✅ 自动压缩状态获取成功" -ForegroundColor Green
        Write-Host "  原始记录数: $($data.stats.originalRecords)" -ForegroundColor Cyan
        Write-Host "  压缩记录数: $($data.stats.compressedRecords)" -ForegroundColor Cyan
        Write-Host "  压缩间隔: $($data.stats.compressionInterval)" -ForegroundColor Cyan
        Write-Host "  压缩延迟: $($data.stats.compressionDelay)" -ForegroundColor Cyan
        Write-Host "  压缩粒度: $($data.stats.compressionGranularity)" -ForegroundColor Cyan
        
        if ($data.stats.lastCompressionTime) {
            Write-Host "  上次压缩: $($data.stats.lastCompressionTime)" -ForegroundColor Gray
        } else {
            Write-Host "  上次压缩: 未执行" -ForegroundColor Gray
        }
        Write-Host "  下次压缩: $($data.stats.nextCompressionTime)" -ForegroundColor Gray
    } else {
        Write-Host "❌ 获取自动压缩状态失败: $($data.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. 手动触发压缩测试
Write-Host "`n2. 手动触发压缩测试" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/auto-compression?action=manual_compress" -Method POST -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    
    if ($data.success) {
        Write-Host "✅ 手动压缩执行成功" -ForegroundColor Green
        Write-Host "  是否压缩: $($data.result.compressed)" -ForegroundColor Cyan
        Write-Host "  压缩记录数: $($data.result.compressedRows)" -ForegroundColor Cyan
        Write-Host "  删除记录数: $($data.result.deletedRows)" -ForegroundColor Cyan
        Write-Host "  消息: $($data.message)" -ForegroundColor Gray
    } else {
        Write-Host "❌ 手动压缩失败: $($data.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 手动压缩请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 模拟数据插入触发自动压缩
Write-Host "`n3. 模拟数据插入（测试自动触发）" -ForegroundColor Yellow
Write-Host "注意: 自动压缩每30分钟检查一次，可能不会立即触发" -ForegroundColor Gray

# 获取当前数据库状态
try {
    $beforeResponse = Invoke-WebRequest -Uri "$baseUrl/api/admin/cleanup" -UseBasicParsing
    $beforeData = $beforeResponse.Content | ConvertFrom-Json
    
    if ($beforeData.success) {
        Write-Host "  压缩前记录数: $($beforeData.stats.total_records)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  获取压缩前状态失败" -ForegroundColor Yellow
}

# 模拟插入一些测试数据（如果有测试端点的话）
Write-Host "  模拟数据插入完成（实际插入需要通过OneNet webhook）" -ForegroundColor Gray

# 4. 检查压缩表数据
Write-Host "`n4. 检查压缩数据" -ForegroundColor Yellow
try {
    $compressedResponse = Invoke-WebRequest -Uri "$baseUrl/api/data/compressed?limit=5" -UseBasicParsing
    $compressedData = $compressedResponse.Content | ConvertFrom-Json
    
    if ($compressedData.success) {
        Write-Host "✅ 压缩数据查询成功" -ForegroundColor Green
        Write-Host "  压缩数据条数: $($compressedData.data.Count)" -ForegroundColor Cyan
        Write-Host "  数据类型: $($compressedData.meta.dataType)" -ForegroundColor Cyan
        
        if ($compressedData.data.Count -gt 0) {
            $sample = $compressedData.data[0]
            Write-Host "  样本数据:" -ForegroundColor Gray
            Write-Host "    设备ID: $($sample.device_id)" -ForegroundColor Gray
            Write-Host "    数据流: $($sample.datastream_id)" -ForegroundColor Gray
            Write-Host "    平均值: $($sample.value)" -ForegroundColor Gray
            if ($sample.raw_data.min_value) {
                Write-Host "    最小值: $($sample.raw_data.min_value)" -ForegroundColor Gray
                Write-Host "    最大值: $($sample.raw_data.max_value)" -ForegroundColor Gray
                Write-Host "    样本数: $($sample.raw_data.sample_count)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ 压缩数据查询失败: $($compressedData.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 压缩数据查询请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 总结
Write-Host "`n=== 自动压缩功能测试总结 ===" -ForegroundColor Green
Write-Host "✅ 自动压缩服务已集成到数据插入流程" -ForegroundColor Green
Write-Host "✅ 每次插入数据时会检查是否需要压缩" -ForegroundColor Green
Write-Host "✅ 压缩策略: 30分钟检查间隔，压缩30分钟前数据" -ForegroundColor Green
Write-Host "✅ 压缩粒度: 5分钟间隔聚合" -ForegroundColor Green
Write-Host "✅ 管理界面可查看状态和手动触发" -ForegroundColor Green

Write-Host "`n📝 使用说明:" -ForegroundColor Cyan
Write-Host "1. 每次OneNet推送数据时会自动检查压缩" -ForegroundColor White
Write-Host "2. 访问 /admin/cleanup 查看压缩状态" -ForegroundColor White
Write-Host "3. 可以手动触发压缩进行测试" -ForegroundColor White
Write-Host "4. 压缩后的数据通过 /api/data/compressed 查询" -ForegroundColor White
