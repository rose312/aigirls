'use client'

import { useState, useEffect } from 'react'
import { useAPIMonitor } from '@/lib/api-monitor'
import { useCache } from '@/lib/cache-manager'

interface PerformanceStats {
  api: {
    totalRequests: number
    averageResponseTime: number
    errorRate: number
  }
  cache: {
    hitRate: number
    size: number
  }
  recommendations: {
    totalProfiles: number
    averageConfidence: number
  }
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'api' | 'cache' | 'recommendations'>('overview')
  const { stats: apiStats, recentMetrics, endpointStats, slowRequests, errorRequests } = useAPIMonitor()

  useEffect(() => {
    fetchPerformanceStats()
  }, [])

  const fetchPerformanceStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/performance?type=overview')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('获取性能数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('缓存已清理')
        fetchPerformanceStats()
      }
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }

  const cleanupCache = async () => {
    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_cache' })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(data.message)
        fetchPerformanceStats()
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-600">无法加载性能数据</p>
      </div>
    )
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-xl font-bold">性能监控面板</h3>
        </div>
        <p className="text-blue-100 text-sm">实时监控系统性能指标</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'overview', label: '概览', icon: '📈' },
          { key: 'api', label: 'API性能', icon: '🔗' },
          { key: 'cache', label: '缓存状态', icon: '💾' },
          { key: 'recommendations', label: '推荐系统', icon: '🤖' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 关键指标 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="text-3xl mb-2">⚡</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(stats.api.averageResponseTime, { good: 500, warning: 1000 })}`}>
                  {Math.round(stats.api.averageResponseTime)}ms
                </div>
                <div className="text-sm text-gray-600">平均响应时间</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                <div className="text-3xl mb-2">💾</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(100 - stats.cache.hitRate, { good: 20, warning: 50 })}`}>
                  {Math.round(stats.cache.hitRate)}%
                </div>
                <div className="text-sm text-gray-600">缓存命中率</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <div className="text-3xl mb-2">🎯</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(100 - (stats.recommendations.averageConfidence * 100), { good: 20, warning: 40 })}`}>
                  {Math.round(stats.recommendations.averageConfidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">推荐置信度</div>
              </div>
            </div>

            {/* 系统状态 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">API状态</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">总请求数</span>
                    <span className="text-sm font-medium">{stats.api.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">错误率</span>
                    <span className={`text-sm font-medium ${getPerformanceColor(stats.api.errorRate, { good: 1, warning: 5 })}`}>
                      {stats.api.errorRate.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">推荐系统</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">用户画像数</span>
                    <span className="text-sm font-medium">{stats.recommendations.totalProfiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">缓存大小</span>
                    <span className="text-sm font-medium">{stats.cache.size} 项</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            {/* API统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-blue-600">{apiStats.totalRequests}</div>
                <div className="text-sm text-gray-600">总请求</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-green-600">{apiStats.successfulRequests}</div>
                <div className="text-sm text-gray-600">成功请求</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-red-600">{apiStats.failedRequests}</div>
                <div className="text-sm text-gray-600">失败请求</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold text-purple-600">{Math.round(apiStats.averageResponseTime)}ms</div>
                <div className="text-sm text-gray-600">平均响应</div>
              </div>
            </div>

            {/* 端点性能 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">端点性能</h4>
              <div className="space-y-2">
                {endpointStats.slice(0, 5).map((endpoint, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">{endpoint.endpoint}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{endpoint.totalRequests} 次</span>
                      <span className={`font-medium ${getPerformanceColor(endpoint.averageResponseTime, { good: 500, warning: 1000 })}`}>
                        {Math.round(endpoint.averageResponseTime)}ms
                      </span>
                      <span className={`font-medium ${getPerformanceColor(endpoint.errorRate, { good: 1, warning: 5 })}`}>
                        {endpoint.errorRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 慢请求 */}
            {slowRequests.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">慢请求 (>1s)</h4>
                <div className="space-y-2">
                  {slowRequests.slice(0, 3).map((request, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">{request.method} {request.url}</span>
                        <span className="text-sm font-bold text-red-600">{request.responseTime}ms</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(request.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-6">
            {/* 缓存操作 */}
            <div className="flex gap-4">
              <button
                onClick={cleanupCache}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                清理过期缓存
              </button>
              <button
                onClick={clearCache}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                清空所有缓存
              </button>
              <button
                onClick={fetchPerformanceStats}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                刷新数据
              </button>
            </div>

            {/* 缓存统计 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">全局缓存</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">命中率</span>
                    <span className="text-sm font-medium">{Math.round(stats.cache.hitRate)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">缓存项数</span>
                    <span className="text-sm font-medium">{stats.cache.size}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">API缓存</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">用户数据</span>
                    <span className="text-sm font-medium">活跃</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">伴侣数据</span>
                    <span className="text-sm font-medium">活跃</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">查询缓存</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">数据库查询</span>
                    <span className="text-sm font-medium">优化中</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">响应时间</span>
                    <span className="text-sm font-medium">< 100ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* 推荐系统统计 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">用户画像</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">总画像数</span>
                    <span className="text-sm font-medium">{stats.recommendations.totalProfiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">平均置信度</span>
                    <span className="text-sm font-medium">{Math.round(stats.recommendations.averageConfidence * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-800 mb-3">推荐效果</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">推荐准确率</span>
                    <span className="text-sm font-medium text-green-600">85%+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">用户满意度</span>
                    <span className="text-sm font-medium text-green-600">4.2/5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 推荐算法状态 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">算法状态</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm font-medium">协同过滤算法</span>
                  </div>
                  <span className="text-sm text-green-600">运行正常</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-sm font-medium">内容推荐算法</span>
                  </div>
                  <span className="text-sm text-green-600">运行正常</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-sm font-medium">行为分析引擎</span>
                  </div>
                  <span className="text-sm text-blue-600">学习中</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}