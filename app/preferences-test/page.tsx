'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataViewPreferences } from '@/lib/data-view-preferences';
import { useAnalyticsPreferences } from '@/lib/analytics-preferences';
import { PreferenceIndicator, usePreferenceState } from '@/components/preference-indicator';
import { Settings, RotateCcw, Cookie, Eye } from 'lucide-react';

export default function PreferencesTest() {
  const [dataPrefs, setDataPrefs] = useState<any>(null);
  const [analyticsPrefs, setAnalyticsPrefs] = useState<any>(null);
  
  const dataManager = useDataViewPreferences();
  const analyticsManager = useAnalyticsPreferences();
  const prefState = usePreferenceState();

  // 加载偏好设置
  useEffect(() => {
    const loadPrefs = () => {
      const data = dataManager.loadPreferences();
      const analytics = analyticsManager.loadPreferences();
      
      setDataPrefs(data);
      setAnalyticsPrefs(analytics);
      
      if (data || analytics) {
        prefState.markLoaded();
      }
    };
    
    loadPrefs();
  }, []);

  // 设置测试数据偏好
  const setTestDataPrefs = () => {
    const testPrefs = {
      selectedDevice: "sensor001",
      activeTab: "device",
      lastVisit: Date.now()
    };
    
    dataManager.savePreferences(testPrefs);
    setDataPrefs(testPrefs);
    prefState.markSaved();
  };

  // 设置测试分析偏好
  const setTestAnalyticsPrefs = () => {
    const testPrefs = {
      selectedDevices: ["sensor001", "sensor002"],
      selectedDatastream: "temperature",
      dateRange: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      lastVisit: Date.now()
    };
    
    analyticsManager.savePreferences(testPrefs);
    setAnalyticsPrefs(testPrefs);
    prefState.markSaved();
  };

  // 清除所有偏好
  const clearAllPrefs = () => {
    dataManager.clearPreferences();
    analyticsManager.clearPreferences();
    setDataPrefs(null);
    setAnalyticsPrefs(null);
    prefState.markCleared();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 头部 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🍪 偏好设置测试</h1>
            <p className="text-gray-600 mt-1">测试用户偏好保存和恢复功能</p>
          </div>
          
          <PreferenceIndicator 
            hasPreferences={!!(dataPrefs || analyticsPrefs)}
            onReset={clearAllPrefs}
          />
        </div>

        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              测试操作
            </CardTitle>
            <CardDescription>
              点击按钮设置测试偏好，然后刷新页面查看是否正确恢复
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={setTestDataPrefs} variant="outline">
                <Cookie className="w-4 h-4 mr-2" />
                设置数据页偏好
              </Button>
              
              <Button onClick={setTestAnalyticsPrefs} variant="outline">
                <Cookie className="w-4 h-4 mr-2" />
                设置分析页偏好
              </Button>
              
              <Button onClick={clearAllPrefs} variant="destructive">
                <RotateCcw className="w-4 h-4 mr-2" />
                清除所有偏好
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 数据页偏好显示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              数据页偏好设置
            </CardTitle>
            <CardDescription>
              /data 页面的用户偏好
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataPrefs ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">选中设备</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {dataPrefs.selectedDevice || "未选择"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">激活标签</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {dataPrefs.activeTab || "all"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">最后访问</label>
                    <div className="mt-1 text-sm text-gray-500">
                      {dataPrefs.lastVisit ? formatDate(dataPrefs.lastVisit) : "未知"}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <strong>原始数据:</strong>
                  <pre className="mt-1 text-xs">{JSON.stringify(dataPrefs, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无数据页偏好设置</p>
                <p className="text-sm">点击上方按钮设置测试偏好</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分析页偏好显示 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              分析页偏好设置
            </CardTitle>
            <CardDescription>
              /analytics 页面的用户偏好
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsPrefs ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">选中设备</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {analyticsPrefs.selectedDevices?.map((device: string) => (
                        <Badge key={device} variant="outline">{device}</Badge>
                      )) || <Badge variant="outline">未选择</Badge>}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">数据流类型</label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {analyticsPrefs.selectedDatastream || "未选择"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">时间范围</label>
                    <div className="mt-1 text-sm text-gray-500">
                      {analyticsPrefs.dateRange ? (
                        <>
                          从: {new Date(analyticsPrefs.dateRange.from).toLocaleDateString('zh-CN')}<br/>
                          到: {new Date(analyticsPrefs.dateRange.to).toLocaleDateString('zh-CN')}
                        </>
                      ) : "未设置"}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">最后访问</label>
                    <div className="mt-1 text-sm text-gray-500">
                      {analyticsPrefs.lastVisit ? formatDate(analyticsPrefs.lastVisit) : "未知"}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <strong>原始数据:</strong>
                  <pre className="mt-1 text-xs">{JSON.stringify(analyticsPrefs, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Cookie className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无分析页偏好设置</p>
                <p className="text-sm">点击上方按钮设置测试偏好</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card>
          <CardHeader>
            <CardTitle>💡 使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>1. 测试步骤：</strong>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                <li>点击"设置数据页偏好"或"设置分析页偏好"按钮</li>
                <li>刷新页面 (F5) 验证偏好是否正确恢复</li>
                <li>访问对应页面 (/data 或 /analytics) 查看实际效果</li>
                <li>使用"清除所有偏好"按钮重置</li>
              </ul>
            </div>
            <div>
              <strong>2. 技术细节：</strong>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                <li>使用浏览器Cookie存储，30天有效期</li>
                <li>JSON格式数据，URL安全编码</li>
                <li>适配无服务器环境</li>
                <li>自动过期清理机制</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
