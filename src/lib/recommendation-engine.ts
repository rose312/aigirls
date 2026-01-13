// 智能伴侣推荐引擎
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Companion } from './supabase-types'
import { apiCache } from './cache-manager'
import { apiMonitor } from './api-monitor'

// 用户画像数据结构
export interface UserProfile {
  userId: string
  preferences: {
    companionTypes: string[]
    personalityTraits: string[]
    interactionStyle: 'casual' | 'formal' | 'playful' | 'romantic'
    activityLevel: 'low' | 'medium' | 'high'
    conversationTopics: string[]
  }
  behavior: {
    totalChatTime: number
    averageSessionLength: number
    favoriteTimeSlots: string[]
    responseSpeed: 'fast' | 'medium' | 'slow'
    messageLength: 'short' | 'medium' | 'long'
  }
  demographics: {
    ageRange?: string
    interests: string[]
    lifestyle: string[]
  }
  history: {
    createdCompanions: number
    deletedCompanions: number
    longestRelationship: number
    averageIntimacyLevel: number
  }
  lastUpdated: number
}

// 推荐结果
export interface RecommendationResult {
  companionType: string
  score: number
  reasons: string[]
  confidence: number
  personalizedConfig?: {
    appearance?: any
    personality?: any
    background?: string
  }
}

// 用户行为事件
export interface UserBehaviorEvent {
  userId: string
  eventType: 'chat_start' | 'chat_end' | 'companion_create' | 'companion_delete' | 'message_send' | 'feature_use'
  companionId?: string
  metadata?: Record<string, any>
  timestamp: number
}

class RecommendationEngine {
  private profiles = new Map<string, UserProfile>()
  private behaviorEvents: UserBehaviorEvent[] = []
  private maxEvents = 10000

  // 记录用户行为事件
  recordBehaviorEvent(event: UserBehaviorEvent): void {
    this.behaviorEvents.push(event)
    
    // 限制事件数量
    if (this.behaviorEvents.length > this.maxEvents) {
      this.behaviorEvents.shift()
    }
    
    // 异步更新用户画像
    this.updateUserProfile(event.userId)
    
    // 保存到缓存
    this.saveBehaviorToCache(event.userId)
  }

  // 更新用户画像
  private async updateUserProfile(userId: string): Promise<void> {
    const userEvents = this.behaviorEvents.filter(e => e.userId === userId)
    if (userEvents.length === 0) return

    const profile: UserProfile = this.profiles.get(userId) || this.createDefaultProfile(userId)
    
    // 分析聊天行为
    const chatEvents = userEvents.filter(e => e.eventType === 'chat_start' || e.eventType === 'chat_end')
    const messageEvents = userEvents.filter(e => e.eventType === 'message_send')
    
    // 计算聊天统计
    let totalChatTime = 0
    let sessionCount = 0
    const chatSessions = new Map<string, { start: number; end?: number }>()
    
    chatEvents.forEach(event => {
      if (event.eventType === 'chat_start') {
        chatSessions.set(event.companionId || 'unknown', { start: event.timestamp })
      } else if (event.eventType === 'chat_end') {
        const session = chatSessions.get(event.companionId || 'unknown')
        if (session) {
          session.end = event.timestamp
          totalChatTime += event.timestamp - session.start
          sessionCount++
        }
      }
    })
    
    profile.behavior.totalChatTime = totalChatTime
    profile.behavior.averageSessionLength = sessionCount > 0 ? totalChatTime / sessionCount : 0
    
    // 分析消息模式
    if (messageEvents.length > 0) {
      const avgResponseTime = this.calculateAverageResponseTime(messageEvents)
      profile.behavior.responseSpeed = avgResponseTime < 30000 ? 'fast' : avgResponseTime < 120000 ? 'medium' : 'slow'
      
      const avgMessageLength = this.calculateAverageMessageLength(messageEvents)
      profile.behavior.messageLength = avgMessageLength < 50 ? 'short' : avgMessageLength < 150 ? 'medium' : 'long'
    }
    
    // 分析偏好
    const companionCreateEvents = userEvents.filter(e => e.eventType === 'companion_create')
    const companionTypes = companionCreateEvents.map(e => e.metadata?.companionType).filter(Boolean)
    profile.preferences.companionTypes = [...new Set(companionTypes)]
    
    // 分析活跃时间段
    profile.behavior.favoriteTimeSlots = this.analyzeFavoriteTimeSlots(userEvents)
    
    // 更新历史统计
    profile.history.createdCompanions = companionCreateEvents.length
    profile.history.deletedCompanions = userEvents.filter(e => e.eventType === 'companion_delete').length
    
    profile.lastUpdated = Date.now()
    this.profiles.set(userId, profile)
    
    // 缓存用户画像
    apiCache.cacheUserData(userId, profile, 30 * 60 * 1000) // 30分钟缓存
  }

  // 创建默认用户画像
  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        companionTypes: [],
        personalityTraits: [],
        interactionStyle: 'casual',
        activityLevel: 'medium',
        conversationTopics: []
      },
      behavior: {
        totalChatTime: 0,
        averageSessionLength: 0,
        favoriteTimeSlots: [],
        responseSpeed: 'medium',
        messageLength: 'medium'
      },
      demographics: {
        interests: [],
        lifestyle: []
      },
      history: {
        createdCompanions: 0,
        deletedCompanions: 0,
        longestRelationship: 0,
        averageIntimacyLevel: 1
      },
      lastUpdated: Date.now()
    }
  }

  // 计算平均响应时间
  private calculateAverageResponseTime(messageEvents: UserBehaviorEvent[]): number {
    if (messageEvents.length < 2) return 60000 // 默认1分钟
    
    let totalTime = 0
    let count = 0
    
    for (let i = 1; i < messageEvents.length; i++) {
      const timeDiff = messageEvents[i].timestamp - messageEvents[i - 1].timestamp
      if (timeDiff < 300000) { // 5分钟内的响应才算有效
        totalTime += timeDiff
        count++
      }
    }
    
    return count > 0 ? totalTime / count : 60000
  }

  // 计算平均消息长度
  private calculateAverageMessageLength(messageEvents: UserBehaviorEvent[]): number {
    const lengths = messageEvents
      .map(e => e.metadata?.messageLength)
      .filter(length => typeof length === 'number')
    
    if (lengths.length === 0) return 100 // 默认长度
    
    return lengths.reduce((sum, length) => sum + length, 0) / lengths.length
  }

  // 分析偏好时间段
  private analyzeFavoriteTimeSlots(events: UserBehaviorEvent[]): string[] {
    const timeSlots = new Map<string, number>()
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours()
      let slot: string
      
      if (hour >= 6 && hour < 12) slot = 'morning'
      else if (hour >= 12 && hour < 18) slot = 'afternoon'
      else if (hour >= 18 && hour < 22) slot = 'evening'
      else slot = 'night'
      
      timeSlots.set(slot, (timeSlots.get(slot) || 0) + 1)
    })
    
    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slot]) => slot)
  }

  // 获取用户画像
  async getUserProfile(userId: string): Promise<UserProfile> {
    // 尝试从缓存获取
    let profile = apiCache.getCachedUserData(userId) as UserProfile
    if (profile) {
      this.profiles.set(userId, profile)
      return profile
    }
    
    // 从内存获取
    profile = this.profiles.get(userId)
    if (profile) {
      return profile
    }
    
    // 创建新的默认画像
    profile = this.createDefaultProfile(userId)
    this.profiles.set(userId, profile)
    
    return profile
  }

  // 生成伴侣推荐
  async generateRecommendations(userId: string, limit: number = 3): Promise<RecommendationResult[]> {
    const startTime = Date.now()
    
    try {
      const profile = await this.getUserProfile(userId)
      const recommendations: RecommendationResult[] = []
      
      // 基于用户画像生成推荐
      const companionTypes = ['neighbor', 'office', 'student', 'custom']
      
      for (const type of companionTypes) {
        const score = this.calculateRecommendationScore(profile, type)
        const reasons = this.generateRecommendationReasons(profile, type)
        const confidence = this.calculateConfidence(profile, type)
        
        recommendations.push({
          companionType: type,
          score,
          reasons,
          confidence,
          personalizedConfig: this.generatePersonalizedConfig(profile, type)
        })
      }
      
      // 按分数排序并返回前N个
      const sortedRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
      
      // 记录API性能
      apiMonitor.recordAPICall(
        '/api/recommendations',
        'GET',
        Date.now() - startTime,
        200
      )
      
      return sortedRecommendations
    } catch (error) {
      apiMonitor.recordAPICall(
        '/api/recommendations',
        'GET',
        Date.now() - startTime,
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // 计算推荐分数
  private calculateRecommendationScore(profile: UserProfile, companionType: string): number {
    let score = 50 // 基础分数
    
    // 基于历史偏好
    if (profile.preferences.companionTypes.includes(companionType)) {
      score += 30
    }
    
    // 基于行为模式
    switch (companionType) {
      case 'neighbor':
        if (profile.behavior.responseSpeed === 'medium' && profile.preferences.interactionStyle === 'casual') {
          score += 20
        }
        if (profile.behavior.favoriteTimeSlots.includes('evening')) {
          score += 10
        }
        break
        
      case 'office':
        if (profile.behavior.messageLength === 'long' && profile.preferences.interactionStyle === 'formal') {
          score += 20
        }
        if (profile.behavior.favoriteTimeSlots.includes('afternoon')) {
          score += 10
        }
        break
        
      case 'student':
        if (profile.behavior.responseSpeed === 'fast' && profile.preferences.interactionStyle === 'playful') {
          score += 20
        }
        if (profile.behavior.favoriteTimeSlots.includes('night')) {
          score += 10
        }
        break
        
      case 'custom':
        if (profile.history.createdCompanions > 2) {
          score += 25
        }
        break
    }
    
    // 基于活跃度
    if (profile.behavior.totalChatTime > 3600000) { // 超过1小时
      score += 15
    }
    
    // 随机因子，增加多样性
    score += Math.random() * 10 - 5
    
    return Math.max(0, Math.min(100, score))
  }

  // 生成推荐理由
  private generateRecommendationReasons(profile: UserProfile, companionType: string): string[] {
    const reasons: string[] = []
    
    // 基于历史偏好
    if (profile.preferences.companionTypes.includes(companionType)) {
      reasons.push('基于您之前的选择偏好')
    }
    
    // 基于行为模式
    switch (companionType) {
      case 'neighbor':
        if (profile.behavior.favoriteTimeSlots.includes('evening')) {
          reasons.push('适合您的晚间聊天习惯')
        }
        if (profile.preferences.interactionStyle === 'casual') {
          reasons.push('符合您轻松随意的交流风格')
        }
        break
        
      case 'office':
        if (profile.behavior.messageLength === 'long') {
          reasons.push('适合您深度交流的习惯')
        }
        if (profile.behavior.favoriteTimeSlots.includes('afternoon')) {
          reasons.push('匹配您的下午活跃时间')
        }
        break
        
      case 'student':
        if (profile.behavior.responseSpeed === 'fast') {
          reasons.push('适合您快节奏的聊天方式')
        }
        if (profile.preferences.interactionStyle === 'playful') {
          reasons.push('符合您活泼的交流风格')
        }
        break
        
      case 'custom':
        if (profile.history.createdCompanions > 2) {
          reasons.push('您有丰富的自定义经验')
        }
        reasons.push('完全按照您的想法定制')
        break
    }
    
    // 通用理由
    if (profile.behavior.totalChatTime > 3600000) {
      reasons.push('基于您的活跃使用记录')
    }
    
    if (reasons.length === 0) {
      reasons.push('为您精心推荐')
    }
    
    return reasons
  }

  // 计算推荐置信度
  private calculateConfidence(profile: UserProfile, companionType: string): number {
    let confidence = 0.5 // 基础置信度
    
    // 数据量越多，置信度越高
    const dataPoints = profile.history.createdCompanions + 
                      Math.floor(profile.behavior.totalChatTime / 600000) + // 每10分钟聊天时间算1个数据点
                      profile.preferences.companionTypes.length
    
    confidence += Math.min(0.4, dataPoints * 0.05)
    
    // 特定匹配度
    if (profile.preferences.companionTypes.includes(companionType)) {
      confidence += 0.2
    }
    
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // 生成个性化配置
  private generatePersonalizedConfig(profile: UserProfile, companionType: string): any {
    const config: any = {}
    
    // 基于用户偏好调整外观
    if (profile.preferences.interactionStyle === 'romantic') {
      config.appearance = {
        clothingStyle: 'elegant',
        hairStyle: 'long_wavy'
      }
    } else if (profile.preferences.interactionStyle === 'playful') {
      config.appearance = {
        clothingStyle: 'casual',
        hairStyle: 'short_cute'
      }
    }
    
    // 基于行为模式调整性格
    if (profile.behavior.responseSpeed === 'fast') {
      config.personality = {
        traits: ['活泼', '热情', '敏捷'],
        speakingStyle: '语速较快，表达直接'
      }
    } else if (profile.behavior.responseSpeed === 'slow') {
      config.personality = {
        traits: ['温和', '深思', '稳重'],
        speakingStyle: '语速缓慢，措辞谨慎'
      }
    }
    
    // 基于时间偏好调整背景
    if (profile.behavior.favoriteTimeSlots.includes('night')) {
      config.background = '我是个夜猫子，喜欢在深夜与你分享心事和想法。'
    } else if (profile.behavior.favoriteTimeSlots.includes('morning')) {
      config.background = '我是个早起的人，喜欢在清晨与你分享美好的开始。'
    }
    
    return config
  }

  // 保存行为数据到缓存
  private saveBehaviorToCache(userId: string): void {
    const userEvents = this.behaviorEvents.filter(e => e.userId === userId).slice(-100) // 只保存最近100个事件
    apiCache.set(`user_behavior_${userId}`, userEvents, 24 * 60 * 60 * 1000) // 24小时缓存
  }

  // 从缓存加载行为数据
  loadBehaviorFromCache(userId: string): void {
    const cached = apiCache.get<UserBehaviorEvent[]>(`user_behavior_${userId}`)
    if (cached) {
      // 合并到现有事件中
      this.behaviorEvents.push(...cached)
      
      // 去重并限制数量
      const uniqueEvents = Array.from(
        new Map(this.behaviorEvents.map(e => [`${e.userId}_${e.timestamp}`, e])).values()
      )
      this.behaviorEvents = uniqueEvents.slice(-this.maxEvents)
    }
  }

  // 获取推荐统计
  getRecommendationStats(): {
    totalProfiles: number
    totalEvents: number
    averageConfidence: number
  } {
    const profiles = Array.from(this.profiles.values())
    const totalConfidence = profiles.reduce((sum, profile) => {
      // 计算平均置信度
      const companionTypes = ['neighbor', 'office', 'student', 'custom']
      const avgConfidence = companionTypes.reduce((acc, type) => 
        acc + this.calculateConfidence(profile, type), 0) / companionTypes.length
      return sum + avgConfidence
    }, 0)
    
    return {
      totalProfiles: this.profiles.size,
      totalEvents: this.behaviorEvents.length,
      averageConfidence: profiles.length > 0 ? totalConfidence / profiles.length : 0
    }
  }
}

// 创建全局推荐引擎实例
export const recommendationEngine = new RecommendationEngine()

// React Hook for recommendations
import { useState, useEffect } from 'react'

export const useRecommendations = (userId: string) => {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const results = await recommendationEngine.generateRecommendations(userId)
        setRecommendations(results)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  const recordBehavior = (event: Omit<UserBehaviorEvent, 'userId' | 'timestamp'>) => {
    recommendationEngine.recordBehaviorEvent({
      ...event,
      userId,
      timestamp: Date.now()
    })
  }

  return {
    recommendations,
    loading,
    error,
    recordBehavior
  }
}

export default recommendationEngine