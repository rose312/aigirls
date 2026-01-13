// API响应时间监控系统
interface APIMetric {
  url: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: number
  success: boolean
  error?: string
}

interface APIStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  errorRate: number
}

interface EndpointStats extends APIStats {
  endpoint: string
  recentMetrics: APIMetric[]
}

class APIMonitor {
  private metrics: APIMetric[] = []
  private maxMetrics = 1000
  private alertThresholds = {
    responseTime: 2000, // 2秒
    errorRate: 10, // 10%
    consecutiveErrors: 5
  }
  private listeners: ((metric: APIMetric) => void)[] = []

  // 记录API调用
  recordAPICall(
    url: string,
    method: string,
    responseTime: number,
    statusCode: number,
    error?: string
  ): void {
    const metric: APIMetric = {
      url,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
      success: statusCode >= 200 && statusCode < 400,
      error
    }

    this.metrics.push(metric)

    // 限制存储的指标数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // 通知监听器
    this.listeners.forEach(listener => listener(metric))

    // 检查告警条件
    this.checkAlerts(metric)

    // 保存到localStorage
    this.saveMetricsToStorage()
  }

  // 获取整体统计
  getOverallStats(): APIStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0
      }
    }

    const successful = this.metrics.filter(m => m.success)
    const failed = this.metrics.filter(m => !m.success)
    const responseTimes = this.metrics.map(m => m.responseTime)

    return {
      totalRequests: this.metrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      errorRate: (failed.length / this.metrics.length) * 100
    }
  }

  // 获取端点统计
  getEndpointStats(): EndpointStats[] {
    const endpointMap = new Map<string, APIMetric[]>()

    // 按端点分组
    this.metrics.forEach(metric => {
      const endpoint = `${metric.method} ${metric.url}`
      if (!endpointMap.has(endpoint)) {
        endpointMap.set(endpoint, [])
      }
      endpointMap.get(endpoint)!.push(metric)
    })

    // 计算每个端点的统计
    return Array.from(endpointMap.entries()).map(([endpoint, metrics]) => {
      const successful = metrics.filter(m => m.success)
      const failed = metrics.filter(m => !m.success)
      const responseTimes = metrics.map(m => m.responseTime)

      return {
        endpoint,
        totalRequests: metrics.length,
        successfulRequests: successful.length,
        failedRequests: failed.length,
        averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        errorRate: (failed.length / metrics.length) * 100,
        recentMetrics: metrics.slice(-10) // 最近10次调用
      }
    })
  }

  // 获取最近的指标
  getRecentMetrics(limit: number = 50): APIMetric[] {
    return this.metrics.slice(-limit)
  }

  // 获取慢查询
  getSlowRequests(threshold: number = 1000): APIMetric[] {
    return this.metrics.filter(m => m.responseTime > threshold)
  }

  // 获取错误请求
  getErrorRequests(): APIMetric[] {
    return this.metrics.filter(m => !m.success)
  }

  // 检查告警条件
  private checkAlerts(metric: APIMetric): void {
    // 响应时间告警
    if (metric.responseTime > this.alertThresholds.responseTime) {
      this.triggerAlert('slow_response', `API响应时间过慢: ${metric.responseTime}ms`, metric)
    }

    // 连续错误告警
    const recentMetrics = this.metrics.slice(-this.alertThresholds.consecutiveErrors)
    if (recentMetrics.length === this.alertThresholds.consecutiveErrors &&
        recentMetrics.every(m => !m.success)) {
      this.triggerAlert('consecutive_errors', '连续API调用失败', metric)
    }

    // 错误率告警
    const recentStats = this.getRecentStats(100) // 最近100次请求
    if (recentStats.errorRate > this.alertThresholds.errorRate) {
      this.triggerAlert('high_error_rate', `错误率过高: ${recentStats.errorRate.toFixed(1)}%`, metric)
    }
  }

  // 获取最近N次请求的统计
  private getRecentStats(count: number): APIStats {
    const recentMetrics = this.metrics.slice(-count)
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        errorRate: 0
      }
    }

    const successful = recentMetrics.filter(m => m.success)
    const failed = recentMetrics.filter(m => !m.success)
    const responseTimes = recentMetrics.map(m => m.responseTime)

    return {
      totalRequests: recentMetrics.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      errorRate: (failed.length / recentMetrics.length) * 100
    }
  }

  // 触发告警
  private triggerAlert(type: string, message: string, metric: APIMetric): void {
    console.warn(`[API Monitor Alert] ${type}: ${message}`, metric)
    
    // 可以在这里添加更多告警逻辑，如发送通知等
    if (typeof window !== 'undefined') {
      // 在浏览器环境中可以显示通知
      const event = new CustomEvent('api-alert', {
        detail: { type, message, metric }
      })
      window.dispatchEvent(event)
    }
  }

  // 添加监听器
  addListener(listener: (metric: APIMetric) => void): void {
    this.listeners.push(listener)
  }

  // 移除监听器
  removeListener(listener: (metric: APIMetric) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics = []
    this.saveMetricsToStorage()
  }

  // 保存指标到localStorage
  private saveMetricsToStorage(): void {
    try {
      const recentMetrics = this.metrics.slice(-100) // 只保存最近100条
      localStorage.setItem('api_metrics', JSON.stringify(recentMetrics))
    } catch (error) {
      // localStorage可能已满，忽略错误
    }
  }

  // 从localStorage加载指标
  loadMetricsFromStorage(): void {
    try {
      const stored = localStorage.getItem('api_metrics')
      if (stored) {
        this.metrics = JSON.parse(stored)
      }
    } catch (error) {
      // 解析错误，清除损坏的数据
      localStorage.removeItem('api_metrics')
    }
  }

  // 导出指标数据
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getOverallStats(),
      endpointStats: this.getEndpointStats(),
      exportTime: new Date().toISOString()
    }, null, 2)
  }
}

// 创建全局监控实例
export const apiMonitor = new APIMonitor()

// 在浏览器环境中加载历史数据
if (typeof window !== 'undefined') {
  apiMonitor.loadMetricsFromStorage()
}

// API调用包装器
export const monitoredFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const startTime = Date.now()
  const method = options.method || 'GET'

  try {
    const response = await fetch(url, options)
    const responseTime = Date.now() - startTime

    apiMonitor.recordAPICall(
      url,
      method,
      responseTime,
      response.status,
      response.ok ? undefined : `HTTP ${response.status}`
    )

    return response
  } catch (error) {
    const responseTime = Date.now() - startTime
    apiMonitor.recordAPICall(
      url,
      method,
      responseTime,
      0,
      error instanceof Error ? error.message : 'Network Error'
    )
    throw error
  }
}

// React Hook for API monitoring
import { useState, useEffect } from 'react'

export const useAPIMonitor = () => {
  const [stats, setStats] = useState<APIStats>(apiMonitor.getOverallStats())
  const [recentMetrics, setRecentMetrics] = useState<APIMetric[]>([])

  useEffect(() => {
    const updateStats = () => {
      setStats(apiMonitor.getOverallStats())
      setRecentMetrics(apiMonitor.getRecentMetrics(10))
    }

    // 初始更新
    updateStats()

    // 添加监听器
    apiMonitor.addListener(updateStats)

    return () => {
      apiMonitor.removeListener(updateStats)
    }
  }, [])

  return {
    stats,
    recentMetrics,
    endpointStats: apiMonitor.getEndpointStats(),
    slowRequests: apiMonitor.getSlowRequests(),
    errorRequests: apiMonitor.getErrorRequests()
  }
}

// 性能优化建议
export const getPerformanceRecommendations = (): string[] => {
  const stats = apiMonitor.getOverallStats()
  const recommendations: string[] = []

  if (stats.averageResponseTime > 1000) {
    recommendations.push('API平均响应时间较慢，建议优化数据库查询或增加缓存')
  }

  if (stats.errorRate > 5) {
    recommendations.push('API错误率较高，建议检查错误处理和服务稳定性')
  }

  const slowRequests = apiMonitor.getSlowRequests(2000)
  if (slowRequests.length > 0) {
    recommendations.push(`发现${slowRequests.length}个慢请求，建议优化相关接口`)
  }

  const endpointStats = apiMonitor.getEndpointStats()
  const slowEndpoints = endpointStats.filter(ep => ep.averageResponseTime > 1500)
  if (slowEndpoints.length > 0) {
    recommendations.push(`以下接口响应较慢: ${slowEndpoints.map(ep => ep.endpoint).join(', ')}`)
  }

  if (recommendations.length === 0) {
    recommendations.push('API性能表现良好，继续保持！')
  }

  return recommendations
}

export default apiMonitor