'use client';

import { SmartValueDisplay, SimpleValueDisplay } from '@/components/smart-value-display';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ColorDemo() {
  // 模拟不同类型的IoT数据
  const mockData = [
    // 温度数据 (18-35度范围)
    { device: "sensor001", datastream: "temperature", value: 19.5, label: "卧室温度" },
    { device: "sensor001", datastream: "temperature", value: 24.2, label: "客厅温度" },
    { device: "sensor001", datastream: "temperature", value: 31.8, label: "阳台温度" },
    
    // 湿度数据 (30-85%范围)
    { device: "sensor002", datastream: "humidity", value: 35.2, label: "卧室湿度" },
    { device: "sensor002", datastream: "humidity", value: 58.7, label: "客厅湿度" },
    { device: "sensor002", datastream: "humidity", value: 78.9, label: "浴室湿度" },
    
    // 电池电压 (3.2-4.2V范围，高值为好)
    { device: "device003", datastream: "battery", value: 3.4, label: "传感器A电池" },
    { device: "device003", datastream: "battery", value: 3.8, label: "传感器B电池" },
    { device: "device003", datastream: "battery", value: 4.1, label: "传感器C电池" },
    
    // 压力数据
    { device: "sensor004", datastream: "pressure", value: 995.5, label: "大气压力" },
    { device: "sensor004", datastream: "pressure", value: 1013.2, label: "标准压力" },
    { device: "sensor004", datastream: "pressure", value: 1025.8, label: "高压区域" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部说明 */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 智能颜色显示系统演示</CardTitle>
            <CardDescription>
              根据每个数据流的历史范围动态计算颜色，两位小数精度显示
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-600 rounded"></span>
                <span>正常 (良好范围)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-600 rounded"></span>
                <span>中等 (一般范围)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-600 rounded"></span>
                <span>警告 (偏离范围)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded"></span>
                <span>异常 (极值范围)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 温度数据展示 */}
        <Card>
          <CardHeader>
            <CardTitle>🌡️ 温度监控</CardTitle>
            <CardDescription>范围通常在 18-35°C，值越接近中等温度越好</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockData.filter(item => item.datastream === 'temperature').map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline">{item.device}</Badge>
                      <div className="font-medium mt-1">{item.label}</div>
                    </div>
                    <div className="text-right">
                      <SmartValueDisplay
                        value={item.value}
                        deviceId={item.device}
                        datastreamId={item.datastream}
                        className="text-2xl"
                        showTooltip={true}
                      />
                      <div className="text-xs text-gray-500">°C</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 湿度数据展示 */}
        <Card>
          <CardHeader>
            <CardTitle>💧 湿度监控</CardTitle>
            <CardDescription>范围通常在 30-85%，适中湿度最佳</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockData.filter(item => item.datastream === 'humidity').map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline">{item.device}</Badge>
                      <div className="font-medium mt-1">{item.label}</div>
                    </div>
                    <div className="text-right">
                      <SmartValueDisplay
                        value={item.value}
                        deviceId={item.device}
                        datastreamId={item.datastream}
                        className="text-2xl"
                        showTooltip={true}
                      />
                      <div className="text-xs text-gray-500">%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 电池电压展示 */}
        <Card>
          <CardHeader>
            <CardTitle>🔋 电池电压监控</CardTitle>
            <CardDescription>范围通常在 3.2-4.2V，高电压表示电池健康</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockData.filter(item => item.datastream === 'battery').map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <Badge variant="outline">{item.device}</Badge>
                      <div className="font-medium mt-1">{item.label}</div>
                    </div>
                    <div className="text-right">
                      <SmartValueDisplay
                        value={item.value}
                        deviceId={item.device}
                        datastreamId={item.datastream}
                        className="text-2xl"
                        showTooltip={true}
                      />
                      <div className="text-xs text-gray-500">V</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 简化版本对比 */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ 简化版本对比</CardTitle>
            <CardDescription>不带Tooltip的轻量级显示</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockData.slice(0, 8).map((item, index) => (
                <div key={index} className="text-center p-3 border rounded">
                  <div className="text-sm text-gray-600 mb-1">{item.datastream}</div>
                  <SimpleValueDisplay
                    value={item.value}
                    deviceId={item.device}
                    datastreamId={item.datastream}
                    className="text-lg"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 说明信息 */}
        <Card>
          <CardHeader>
            <CardTitle>💡 工作原理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>1. 动态范围计算：</strong> 系统会查询每个数据流的历史最小值和最大值，而不是使用固定阈值。
            </div>
            <div>
              <strong>2. 智能类型识别：</strong> 自动识别数据类型（如电池、信号强度使用反转逻辑，高值为好）。
            </div>
            <div>
              <strong>3. 两位小数精度：</strong> 自动处理数值精度，整数显示为整数，小数保留两位。
            </div>
            <div>
              <strong>4. 缓存优化：</strong> 使用 sessionStorage 缓存统计数据，适配无服务器环境。
            </div>
            <div>
              <strong>5. 回退机制：</strong> 如果无法获取历史数据，自动回退到基于数据类型的预设阈值。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
