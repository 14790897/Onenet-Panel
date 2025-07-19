"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { RefreshCw, Database, TrendingUp, Activity, Settings, RotateCcw, Filter } from "lucide-react"
import { SmartValueDisplay } from "@/components/smart-value-display"
import { Pagination } from "@/components/pagination"
import { useDataViewPreferences } from "@/lib/data-view-preferences"

interface OneNetDataRecord {
  id: number
  device_id: string
  datastream_id: string
  value: number
  raw_data: any
  created_at: string
}

export default function DataView() {
  const [data, setData] = useState<OneNetDataRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [selectedDatastream, setSelectedDatastream] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all")
  const [availableDatastreams, setAvailableDatastreams] = useState<string[]>([])

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [hasMore, setHasMore] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const { savePreferences, loadPreferences, clearPreferences } =
    useDataViewPreferences();

  // 恢复用户偏好设置
  useEffect(() => {
    const preferences = loadPreferences();
    if (preferences) {
      if (preferences.selectedDevice) {
        setSelectedDevice(preferences.selectedDevice);
      }
      if (preferences.activeTab) {
        setActiveTab(preferences.activeTab);
      }
    }
    setPreferencesLoaded(true);
  }, []);

  const fetchData = async (page = currentPage, size = pageSize) => {
    try {
      setLoading(true);
      const offset = (page - 1) * size;
      const params = new URLSearchParams({
        type: 'paginated',
        limit: size.toString(),
        offset: offset.toString()
      });

      // 添加数据流过滤
      if (selectedDatastream && selectedDatastream !== 'all') {
        params.append('datastream', selectedDatastream);
      }

      const response = await fetch(`/api/data?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
          setHasMore(result.pagination?.hasMore || false);

          // 如果API返回了总数，使用它
          if (result.pagination?.totalCount !== undefined) {
            setTotalItems(result.pagination.totalCount);
          }

          // 提取可用的数据流
          const datastreams = Array.from(new Set(result.data.map((item: OneNetDataRecord) => item.datastream_id))) as string[];
          setAvailableDatastreams(datastreams);
        } else {
          setData([]); // 确保始终为数组
          console.error("获取数据失败:", result.error || "数据格式错误");
        }
      } else {
        setData([]); // 确保始终为数组
        console.error("获取数据失败，状态码:", response.status);
      }
    } catch (error) {
      console.error("获取数据失败:", error);
      setData([]); // 确保始终为数组
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/data/stats");
      if (response.ok) {
        const result = await response.json();
        setStats(result);
      } else {
        console.error("获取统计失败，状态码:", response.status);
      }
    } catch (error) {
      console.error("获取统计失败:", error);
    }
  };

  const fetchDatastreams = async (deviceId?: string) => {
    try {
      const params = deviceId ? `?device_id=${deviceId}` : '';
      const response = await fetch(`/api/data/datastreams${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAvailableDatastreams(result.datastreams);
        }
      } else {
        console.error("获取数据流失败，状态码:", response.status);
      }
    } catch (error) {
      console.error("获取数据流失败:", error);
    }
  };

  const fetchDeviceData = async (deviceId: string, page = 1, size = pageSize) => {
    try {
      setLoading(true);
      const offset = (page - 1) * size;
      const params = new URLSearchParams({
        type: 'device',
        device_id: deviceId,
        limit: size.toString(),
        offset: offset.toString()
      });

      // 添加数据流过滤
      if (selectedDatastream && selectedDatastream !== 'all') {
        params.append('datastream', selectedDatastream);
      }

      const response = await fetch(`/api/data?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setData(result.data);
          setHasMore(result.pagination?.hasMore || false);
        } else {
          setData([]); // 确保始终为数组
          console.error("获取设备数据失败: 数据格式错误");
        }
      } else {
        setData([]); // 确保始终为数组
        console.error("获取设备数据失败，状态码:", response.status);
      }
    } catch (error) {
      console.error("获取设备数据失败:", error);
      setData([]); // 确保始终为数组
    } finally {
      setLoading(false);
    }
  };

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (activeTab === "all") {
      fetchData(page, pageSize);
    } else if (selectedDevice) {
      fetchDeviceData(selectedDevice, page, pageSize);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // 重置到第一页
    if (activeTab === "all") {
      fetchData(1, size);
    } else if (selectedDevice) {
      fetchDeviceData(selectedDevice, 1, size);
    }
  };

  const handleDatastreamChange = (datastream: string) => {
    setSelectedDatastream(datastream);
    setCurrentPage(1); // 重置到第一页
    // 不在这里立即调用fetchData，让useEffect处理
  };

  const refreshData = () => {
    if (activeTab === "all") {
      fetchData(currentPage, pageSize);
    } else if (selectedDevice) {
      fetchDeviceData(selectedDevice, currentPage, pageSize);
    }
  };

  useEffect(() => {
    // 等待偏好设置加载完成后再获取数据
    if (!preferencesLoaded) return;

    if (selectedDevice && activeTab === "device") {
      fetchDeviceData(selectedDevice, 1, pageSize);
      fetchDatastreams(selectedDevice);
    } else {
      fetchData(1, pageSize);
      fetchDatastreams();
    }
    fetchStats();
  }, [preferencesLoaded, selectedDevice, activeTab, selectedDatastream]);

  // 保存用户偏好设置
  const saveCurrentPreferences = () => {
    savePreferences({
      selectedDevice: selectedDevice || undefined,
      activeTab,
    });
  };

  // 清除偏好设置
  const resetPreferences = () => {
    clearPreferences();
    setSelectedDevice("");
    setSelectedDatastream("all");
    setActiveTab("all");
    setCurrentPage(1);
    fetchData(1, pageSize);
  };

  const uniqueDevices = Array.from(
    new Set((Array.isArray(data) ? data : []).map((item) => item.device_id))
  );

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatRawData = (rawData: any) => {
    if (!rawData) return "N/A";

    // 显示重要信息
    const info = [];
    if (rawData.deviceName) info.push(`设备名: ${rawData.deviceName}`);
    if (rawData.messageType) info.push(`消息类型: ${rawData.messageType}`);
    if (rawData.originalValue !== undefined)
      info.push(`原始值: ${rawData.originalValue}`);

    return info.length > 0
      ? info.join(", ")
      : JSON.stringify(rawData).substring(0, 100) + "...";
  };

  // 获取用于显示的数值，确保返回数字类型
  const getDisplayValue = (record: OneNetDataRecord) => {
    // 首先尝试转换数据库中的值
    let dbValue = 0;
    if (typeof record.value === "number") {
      dbValue = record.value;
    } else if (typeof record.value === "string") {
      const parsed = parseFloat(record.value);
      dbValue = isNaN(parsed) ? 0 : parsed;
    }

    // 如果数据库中的值是0，但原始值存在且不是0，则使用原始值
    if (
      dbValue === 0 &&
      record.raw_data?.originalValue !== undefined &&
      record.raw_data.originalValue !== 0
    ) {
      const originalValue = record.raw_data.originalValue;
      // 尝试转换原始值为数字
      if (typeof originalValue === "number") {
        return originalValue;
      } else if (typeof originalValue === "string") {
        const parsed = parseFloat(originalValue);
        return isNaN(parsed) ? dbValue : parsed;
      }
    }

    return dbValue;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              OneNET 数据监控
            </h1>
            <p className="text-gray-600 mt-1">实时查看接收到的OneNET推送数据</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/analytics">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                数据分析
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <Button
              onClick={resetPreferences}
              variant="outline"
              size="sm"
              title="重置查看偏好"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
            <Button onClick={refreshData} disabled={loading}>
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              刷新数据
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      总记录数
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_records}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Activity className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      设备数量
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.unique_devices}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      数据流数量
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.unique_datastreams}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <RefreshCw className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      最新数据
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {stats.latest_timestamp
                        ? formatTimestamp(stats.latest_timestamp)
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据流过滤器 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Label htmlFor="datastream-select" className="text-sm font-medium">
                  数据流过滤:
                </Label>
              </div>
              <Select
                value={selectedDatastream}
                onValueChange={handleDatastreamChange}
              >
                <SelectTrigger className="w-48" id="datastream-select">
                  <SelectValue placeholder="选择数据流" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有数据流</SelectItem>
                  {availableDatastreams.map((datastream) => (
                    <SelectItem key={datastream} value={datastream}>
                      {datastream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDatastream !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatastreamChange("all")}
                >
                  清除过滤
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            savePreferences({ activeTab: value, selectedDevice: selectedDevice || undefined });
          }}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">所有数据</TabsTrigger>
              <TabsTrigger value="device">按设备查看</TabsTrigger>
            </TabsList>

            {/* 偏好设置状态指示 */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {selectedDevice && (
                <Badge variant="secondary" className="text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  已选设备: {selectedDevice}
                </Badge>
              )}
              <span className="text-xs">偏好已保存</span>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>最新数据记录</CardTitle>
                <CardDescription>
                  显示最近接收到的OneNET推送数据 (最多50条)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无数据记录</p>
                    <p className="text-sm">请确保OneNET推送服务已正确配置</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left px-2 py-1 font-medium">设备ID</th>
                          <th className="text-left px-2 py-1 font-medium">数据流</th>
                          <th className="text-left px-2 py-1 font-medium">数值</th>
                          <th className="text-left px-2 py-1 font-medium">额外信息</th>
                          <th className="text-left px-2 py-1 font-medium">时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b hover:bg-gray-50/50"
                          >
                            <td className="px-2 py-1">
                              <Badge variant="outline" className="text-xs">
                                {record.device_id}
                              </Badge>
                            </td>
                            <td className="px-2 py-1">
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                {record.datastream_id}
                              </code>
                            </td>
                            <td className="px-2 py-1">
                              <SmartValueDisplay
                                value={getDisplayValue(record)}
                                deviceId={record.device_id}
                                datastreamId={record.datastream_id}
                                className="font-mono text-sm"
                                showTooltip={true}
                              />
                            </td>
                            <td className="px-2 py-1 text-xs text-gray-600 max-w-xs">
                              {formatRawData(record.raw_data)}
                            </td>
                            <td className="px-2 py-1 text-xs text-gray-500">
                              {formatTimestamp(record.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 分页组件 */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  loading={loading}
                  showPageSizeSelector={true}
                  showInfo={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="device" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>按设备查看数据</CardTitle>
                <CardDescription>选择特定设备查看其数据记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={selectedDevice === "" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedDevice("");
                      setActiveTab("all");
                      setCurrentPage(1);
                      savePreferences({
                        selectedDevice: undefined,
                        activeTab: "all",
                      });
                      fetchData(1, pageSize);
                    }}
                  >
                    所有设备
                  </Button>
                  {uniqueDevices.map((deviceId) => (
                    <Button
                      key={deviceId}
                      variant={
                        selectedDevice === deviceId ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setSelectedDevice(deviceId);
                        setCurrentPage(1);
                        savePreferences({
                          selectedDevice: deviceId,
                          activeTab: "device",
                        });
                        fetchDeviceData(deviceId, 1, pageSize);
                      }}
                    >
                      {deviceId}
                    </Button>
                  ))}
                </div>

                {data.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>该设备暂无数据记录</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {data.map((record) => (
                      <div
                        key={record.id}
                        className="border rounded-md p-3 hover:bg-gray-50/50 text-sm"
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {record.device_id}
                            </Badge>
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                              {record.datastream_id}
                            </code>
                            <SmartValueDisplay
                              value={getDisplayValue(record)}
                              deviceId={record.device_id}
                              datastreamId={record.datastream_id}
                              className="font-mono text-sm font-medium"
                              showTooltip={true}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(record.created_at)}
                          </span>
                        </div>
                        {record.raw_data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 py-1">
                              原始数据
                            </summary>
                            <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(record.raw_data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 设备数据分页组件 */}
                {selectedDevice && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                    showPageSizeSelector={true}
                    showInfo={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
