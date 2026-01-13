// 用户体验监控与分析系统
interface UserEvent {
  id: string
  userId: string
  sessionId: string
  eventType: string
  eventData: any
  timestamp: number
  page: string
  userAgent: string
  deviceInfo: DeviceInfo
}

interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  os: string
  browser: string
  screenSize: string
  connection: string
}

interface UserJourney {
  userId: string
  sessionId: string
  startTime: number
  endTime?: number
  events: UserEvent[]
  conversionGoals: ConversionGoal[]
  dropOffPoint?: string
}

interface ConversionGoal {
  id: string
  name: string
  type: 'registration' | 'first_chat' | 'payment' | 'retention'
  completed: boolean
  completedAt?: number
  value?: number
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  timestamp: number
  threshold: number
  status: 'good' | 'warning' | 'critical'
}

interface ABTest {
  id: string
  name: string
  description: string
  variants: ABTestVariant[]
  trafficSplit: number[]
  startDate: number
  endDate: number
  status: 'draft' | 'running' | 'completed' | 'paused'
  primaryMetric: string
  results?: ABTestResults
}

interface ABTestVariant {
  id: string
  name: string
  description: string
  config: any
}

interface ABTestResults {
  totalParticipants: number
  variantResults: Array<{
    variantId: string
    participants: number
    conversionRate: number
    confidence: number
    isWinner: boolean
  }>
  statisticalSignificance: number
}

class AnalyticsMonitoring {
  private events: UserEvent[] = []
  private journeys = new Map<string, UserJourney>()
  private performanceMetrics: PerformanceMetric[] = []
  private abTests = new Map<string, ABTest>()
  private alerts: Array<{
    id: string
    type: 'performance' | 'conversion' | 'error'
    message: string
    severity: 'low' | 'medium' | 'high'
    timestamp: number
  }> = []

  // 事件追踪
  trackEvent(
    userId: string,
    eventType: string,
    eventData: any = {},
    page: string = window.location.pathname
  ) {
    const sessionId = this.getSessionId(userId)
    const event: UserEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      sessionId,
      eventType,
      eventData,
      timestamp: Date.now(),
      page,
      userAgent: navigator.userAgent,
      deviceInfo: this.getDeviceInfo()
    }

    this.events.push(event)
    this.updateUserJourney(userId, sessionId, event)
    this.checkConversionGoals(userId, event)
    
    // 实时分析
    this.analyzeEventPattern(event)
  }

  // 获取设备信息
  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent
    const connection = (navigator as any).connection
    
    return {
      type: this.detectDeviceType(),
      os: this.detectOS(ua),
      browser: this.detectBrowser(ua),
      screenSize: `${screen.width}x${screen.height}`,
      connection: connection?.effectiveType || 'unknown'
    }
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
  }

  private detectOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  private detectBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  // 获取会话ID
  private getSessionId(userId: string): string {
    const storageKey = `session_${userId}`
    let sessionId = sessionStorage.getItem(storageKey)
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(storageKey, sessionId)
    }
    
    return sessionId
  }

  // 更新用户旅程
  private updateUserJourney(userId: string, sessionId: string, event: UserEvent) {
    const journeyKey = `${userId}_${sessionId}`
    let journey = this.journeys.get(journeyKey)
    
    if (!journey) {
      journey = {
        userId,
        sessionId,
        startTime: Date.now(),
        events: [],
        conversionGoals: this.initializeConversionGoals()
      }
      this.journeys.set(journeyKey, journey)
    }
    
    journey.events.push(event)
    journey.endTime = Date.now()
  }

  // 初始化转化目标
  private initializeConversionGoals(): ConversionGoal[] {
    return [
      {
        id: 'registration',
        name: '用户注册',
        type: 'registration',
        completed: false
      },
      {
        id: 'first_chat',
        name: '首次对话',
        type: 'first_chat',
        completed: false
      },
      {
        id: 'payment',
        name: '付费转化',
        type: 'payment',
        completed: false
      },
      {
        id: 'retention_7d',
        name: '7日留存',
        type: 'retention',
        completed: false
      }
    ]
  }

  // 检查转化目标
  private checkConversionGoals(userId: string, event: UserEvent) {
    const sessionId = this.getSessionId(userId)
    const journey = this.journeys.get(`${userId}_${sessionId}`)
    
    if (!journey) return

    journey.conversionGoals.forEach(goal => {
      if (goal.completed) return

      let shouldComplete = false
      
      switch (goal.type) {
        case 'registration':
          shouldComplete = event.eventType === 'user_registered'
          break
        case 'first_chat':
          shouldComplete = event.eventType === 'message_sent' && 
            journey.events.filter(e => e.eventType === 'message_sent').length === 1
          break
        case 'payment':
          shouldComplete = event.eventType === 'payment_completed'
          goal.value = event.eventData?.amount || 0
          break
        case 'retention':
          // 需要跨会话检查
          shouldComplete = this.checkRetention(userId, 7)
          break
      }

      if (shouldComplete) {
        goal.completed = true
        goal.completedAt = Date.now()
        
        // 触发转化事件
        this.trackEvent(userId, `conversion_${goal.id}`, {
          goalId: goal.id,
          value: goal.value
        })
      }
    })
  }

  // 检查用户留存
  private checkRetention(userId: string, days: number): boolean {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    const userEvents = this.events.filter(e => 
      e.userId === userId && e.timestamp > cutoffTime
    )
    
    // 检查是否在指定天数内有活动
    const activeDays = new Set(
      userEvents.map(e => new Date(e.timestamp).toDateString())
    )
    
    return activeDays.size >= Math.ceil(days * 0.3) // 至少30%的天数有活动
  }

  // 事件模式分析
  private analyzeEventPattern(event: UserEvent) {
    // 检查异常行为
    if (event.eventType === 'error') {
      this.createAlert('error', `用户遇到错误: ${event.eventData.message}`, 'medium')
    }
    
    // 检查性能问题
    if (event.eventType === 'page_load' && event.eventData.loadTime > 3000) {
      this.createAlert('performance', `页面加载时间过长: ${event.eventData.loadTime}ms`, 'high')
    }
    
    // 检查转化漏斗
    this.analyzeFunnelDropOff(event)
  }

  // 分析漏斗流失
  private analyzeFunnelDropOff(event: UserEvent) {
    const funnelSteps = [
      'page_visit',
      'companion_view',
      'chat_start',
      'message_sent',
      'upgrade_prompt_shown',
      'payment_initiated',
      'payment_completed'
    ]
    
    const userEvents = this.events.filter(e => e.userId === event.userId)
    const completedSteps = funnelSteps.filter(step => 
      userEvents.some(e => e.eventType === step)
    )
    
    // 检查是否在某个步骤流失
    if (completedSteps.length < funnelSteps.length) {
      const dropOffStep = funnelSteps[completedSteps.length]
      this.updateDropOffAnalysis(dropOffStep)
    }
  }

  // 更新流失分析
  private updateDropOffAnalysis(step: string) {
    // 这里可以实现更复杂的流失分析逻辑
    console.log(`用户在步骤 ${step} 流失`)
  }

  // 创建告警
  private createAlert(type: 'performance' | 'conversion' | 'error', message: string, severity: 'low' | 'medium' | 'high') {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      severity,
      timestamp: Date.now()
    }
    
    this.alerts.push(alert)
    
    // 发送实时通知
    this.sendAlertNotification(alert)
  }

  // 发送告警通知
  private sendAlertNotification(alert: any) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-alert', {
        detail: alert
      }))
    }
  }

  // 性能监控
  trackPerformanceMetric(name: string, value: number, threshold: number) {
    const metric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      value,
      timestamp: Date.now(),
      threshold,
      status: value > threshold ? 'critical' : value > threshold * 0.8 ? 'warning' : 'good'
    }
    
    this.performanceMetrics.push(metric)
    
    if (metric.status !== 'good') {
      this.createAlert('performance', `性能指标 ${name} 异常: ${value}`, 
        metric.status === 'critical' ? 'high' : 'medium')
    }
  }

  // A/B测试管理
  createABTest(test: Omit<ABTest, 'id' | 'status' | 'results'>): string {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const abTest: ABTest = {
      ...test,
      id: testId,
      status: 'draft'
    }
    
    this.abTests.set(testId, abTest)
    return testId
  }

  // 启动A/B测试
  startABTest(testId: string): boolean {
    const test = this.abTests.get(testId)
    if (!test || test.status !== 'draft') return false
    
    test.status = 'running'
    return true
  }

  // 获取A/B测试变体
  getABTestVariant(testId: string, userId: string): string | null {
    const test = this.abTests.get(testId)
    if (!test || test.status !== 'running') return null
    
    // 基于用户ID的一致性哈希
    const hash = this.hashUserId(userId + testId)
    const totalSplit = test.trafficSplit.reduce((sum, split) => sum + split, 0)
    const normalizedHash = hash % totalSplit
    
    let currentSplit = 0
    for (let i = 0; i < test.variants.length; i++) {
      currentSplit += test.trafficSplit[i]
      if (normalizedHash < currentSplit) {
        // 记录参与测试
        this.trackEvent(userId, 'ab_test_participation', {
          testId,
          variantId: test.variants[i].id
        })
        return test.variants[i].id
      }
    }
    
    return null
  }

  // 哈希用户ID
  private hashUserId(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // 分析A/B测试结果
  analyzeABTestResults(testId: string): ABTestResults | null {
    const test = this.abTests.get(testId)
    if (!test) return null
    
    const testEvents = this.events.filter(e => 
      e.eventType === 'ab_test_participation' && 
      e.eventData.testId === testId
    )
    
    const conversionEvents = this.events.filter(e => 
      e.eventType === `conversion_${test.primaryMetric}`
    )
    
    const variantResults = test.variants.map(variant => {
      const participants = testEvents.filter(e => 
        e.eventData.variantId === variant.id
      )
      
      const conversions = participants.filter(p => 
        conversionEvents.some(c => 
          c.userId === p.userId && 
          c.timestamp > p.timestamp
        )
      )
      
      return {
        variantId: variant.id,
        participants: participants.length,
        conversionRate: participants.length > 0 ? conversions.length / participants.length : 0,
        confidence: this.calculateStatisticalConfidence(participants.length, conversions.length),
        isWinner: false
      }
    })
    
    // 确定获胜变体
    const bestVariant = variantResults.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    )
    bestVariant.isWinner = true
    
    const results: ABTestResults = {
      totalParticipants: testEvents.length,
      variantResults,
      statisticalSignificance: this.calculateStatisticalSignificance(variantResults)
    }
    
    test.results = results
    return results
  }

  // 计算统计置信度
  private calculateStatisticalConfidence(participants: number, conversions: number): number {
    if (participants === 0) return 0
    
    const rate = conversions / participants
    const standardError = Math.sqrt((rate * (1 - rate)) / participants)
    
    // 简化的置信度计算
    return Math.min(95, participants > 100 ? 95 : (participants / 100) * 95)
  }

  // 计算统计显著性
  private calculateStatisticalSignificance(variantResults: any[]): number {
    if (variantResults.length < 2) return 0
    
    // 简化的显著性检验
    const totalParticipants = variantResults.reduce((sum, v) => sum + v.participants, 0)
    return totalParticipants > 1000 ? 95 : (totalParticipants / 1000) * 95
  }

  // 获取用户旅程分析
  getUserJourneyAnalysis(userId: string): {
    totalSessions: number
    averageSessionDuration: number
    conversionRate: number
    dropOffPoints: string[]
    mostEngagedPages: string[]
  } {
    const userJourneys = Array.from(this.journeys.values())
      .filter(j => j.userId === userId)
    
    if (userJourneys.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        conversionRate: 0,
        dropOffPoints: [],
        mostEngagedPages: []
      }
    }
    
    const totalDuration = userJourneys.reduce((sum, j) => 
      sum + ((j.endTime || Date.now()) - j.startTime), 0
    )
    
    const conversions = userJourneys.filter(j => 
      j.conversionGoals.some(g => g.completed)
    ).length
    
    const pageEngagement = new Map<string, number>()
    userJourneys.forEach(j => {
      j.events.forEach(e => {
        pageEngagement.set(e.page, (pageEngagement.get(e.page) || 0) + 1)
      })
    })
    
    const mostEngagedPages = Array.from(pageEngagement.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page]) => page)
    
    return {
      totalSessions: userJourneys.length,
      averageSessionDuration: totalDuration / userJourneys.length,
      conversionRate: conversions / userJourneys.length,
      dropOffPoints: [], // 需要更复杂的分析
      mostEngagedPages
    }
  }

  // 获取实时仪表板数据
  getDashboardData(): {
    activeUsers: number
    conversionRate: number
    averageSessionDuration: number
    topEvents: Array<{ event: string; count: number }>
    performanceAlerts: number
    abTestsRunning: number
  } {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const recentEvents = this.events.filter(e => e.timestamp > last24Hours)
    const activeUsers = new Set(recentEvents.map(e => e.userId)).size
    
    const eventCounts = new Map<string, number>()
    recentEvents.forEach(e => {
      eventCounts.set(e.eventType, (eventCounts.get(e.eventType) || 0) + 1)
    })
    
    const topEvents = Array.from(eventCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([event, count]) => ({ event, count }))
    
    const conversions = recentEvents.filter(e => 
      e.eventType.startsWith('conversion_')
    ).length
    
    const sessions = new Set(recentEvents.map(e => e.sessionId)).size
    
    const performanceAlerts = this.alerts.filter(a => 
      a.type === 'performance' && a.timestamp > last24Hours
    ).length
    
    const abTestsRunning = Array.from(this.abTests.values())
      .filter(t => t.status === 'running').length
    
    return {
      activeUsers,
      conversionRate: sessions > 0 ? conversions / sessions : 0,
      averageSessionDuration: 0, // 需要计算
      topEvents,
      performanceAlerts,
      abTestsRunning
    }
  }
}

// 创建全局实例
export const analytics = new AnalyticsMonitoring()

// React Hook
import { useState, useEffect } from 'react'

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    // 定期更新仪表板数据
    const updateDashboard = () => {
      setDashboardData(analytics.getDashboardData())
    }
    
    updateDashboard()
    const interval = setInterval(updateDashboard, 30000) // 30秒更新一次
    
    // 监听告警
    const handleAlert = (event: CustomEvent) => {
      setAlerts(prev => [event.detail, ...prev.slice(0, 9)]) // 保留最近10个告警
    }
    
    window.addEventListener('analytics-alert', handleAlert as EventListener)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('analytics-alert', handleAlert as EventListener)
    }
  }, [])

  const trackEvent = (eventType: string, eventData?: any) => {
    analytics.trackEvent('current_user', eventType, eventData)
  }

  const trackPerformance = (name: string, value: number, threshold: number) => {
    analytics.trackPerformanceMetric(name, value, threshold)
  }

  return {
    dashboardData,
    alerts,
    trackEvent,
    trackPerformance,
    getUserJourney: (userId: string) => analytics.getUserJourneyAnalysis(userId),
    getABTestVariant: (testId: string, userId: string) => analytics.getABTestVariant(testId, userId)
  }
}

export default analytics