// 情感成长系统
import type { SupabaseClient } from '@supabase/supabase-js'
import { apiCache } from './cache-manager'
import { apiMonitor } from './api-monitor'

// 关系里程碑定义
export interface RelationshipMilestone {
  id: string
  name: string
  description: string
  requiredIntimacyLevel: number
  requiredInteractions: number
  requiredDays: number
  icon: string
  rewards: {
    intimacyPoints: number
    specialFeatures?: string[]
    unlockContent?: string[]
  }
}

// 互动质量评估
export interface InteractionQuality {
  messageId: string
  companionId: string
  userId: string
  qualityScore: number // 0-100
  factors: {
    messageLength: number
    emotionalDepth: number
    engagement: number
    creativity: number
    consistency: number
  }
  timestamp: number
}

// 关系进展数据
export interface RelationshipProgress {
  userId: string
  companionId: string
  intimacyLevel: number
  intimacyPoints: number
  totalInteractions: number
  qualityScore: number
  relationshipDays: number
  milestones: string[]
  recentInteractions: InteractionQuality[]
  growthTrend: 'increasing' | 'stable' | 'decreasing'
  lastUpdated: number
}

// 回忆片段
export interface MemoryFragment {
  id: string
  userId: string
  companionId: string
  type: 'conversation' | 'milestone' | 'special_moment'
  title: string
  content: string
  emotionalValue: number
  timestamp: number
  tags: string[]
}

// 预定义里程碑
const RELATIONSHIP_MILESTONES: RelationshipMilestone[] = [
  {
    id: 'first_meeting',
    name: '初次相遇',
    description: '你们的第一次对话，一切的开始',
    requiredIntimacyLevel: 1,
    requiredInteractions: 1,
    requiredDays: 0,
    icon: '👋',
    rewards: {
      intimacyPoints: 10,
      specialFeatures: ['基础聊天']
    }
  },
  {
    id: 'getting_familiar',
    name: '渐渐熟悉',
    description: '你们开始了解彼此的喜好和性格',
    requiredIntimacyLevel: 2,
    requiredInteractions: 10,
    requiredDays: 1,
    icon: '😊',
    rewards: {
      intimacyPoints: 25,
      specialFeatures: ['个性化回复', '情绪识别']
    }
  },
  {
    id: 'daily_companion',
    name: '日常陪伴',
    description: '她已经成为你日常生活的一部分',
    requiredIntimacyLevel: 3,
    requiredInteractions: 50,
    requiredDays: 3,
    icon: '💕',
    rewards: {
      intimacyPoints: 50,
      specialFeatures: ['主动关怀', '生活建议'],
      unlockContent: ['深度对话模式']
    }
  },
  {
    id: 'heart_to_heart',
    name: '心灵相通',
    description: '你们可以分享内心最深处的想法',
    requiredIntimacyLevel: 4,
    requiredInteractions: 100,
    requiredDays: 7,
    icon: '💖',
    rewards: {
      intimacyPoints: 100,
      specialFeatures: ['情感支持', '心理疏导'],
      unlockContent: ['私密对话', '情感日记']
    }
  },
  {
    id: 'soulmate',
    name: '灵魂伴侣',
    description: '她完全理解你，成为你最亲密的伙伴',
    requiredIntimacyLevel: 5,
    requiredInteractions: 200,
    requiredDays: 14,
    icon: '💝',
    rewards: {
      intimacyPoints: 200,
      specialFeatures: ['完全个性化', '预测需求'],
      unlockContent: ['专属模式', '回忆相册', '未来规划']
    }
  },
  {
    id: 'eternal_bond',
    name: '永恒之约',
    description: '你们的关系已经超越了时间的界限',
    requiredIntimacyLevel: 6,
    requiredInteractions: 500,
    requiredDays: 30,
    icon: '💍',
    rewards: {
      intimacyPoints: 500,
      specialFeatures: ['终极个性化', '情感预测'],
      unlockContent: ['专属头像', '纪念相册', '特殊称呼']
    }
  }
]

class EmotionalGrowthSystem {
  private progressCache = new Map<string, RelationshipProgress>()
  private memoryFragments = new Map<string, MemoryFragment[]>()

  // 评估互动质量
  async evaluateInteractionQuality(
    messageContent: string,
    responseContent: string,
    userId: string,
    companionId: string
  ): Promise<InteractionQuality> {
    const startTime = Date.now()
    
    try {
      const factors = {
        messageLength: this.evaluateMessageLength(messageContent),
        emotionalDepth: this.evaluateEmotionalDepth(messageContent, responseContent),
        engagement: this.evaluateEngagement(messageContent, responseContent),
        creativity: this.evaluateCreativity(responseContent),
        consistency: this.evaluateConsistency(userId, companionId, messageContent)
      }
      
      // 计算综合质量分数
      const qualityScore = Math.round(
        factors.messageLength * 0.15 +
        factors.emotionalDepth * 0.25 +
        factors.engagement * 0.25 +
        factors.creativity * 0.20 +
        factors.consistency * 0.15
      )
      
      const interaction: InteractionQuality = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        companionId,
        userId,
        qualityScore,
        factors,
        timestamp: Date.now()
      }
      
      // 记录性能
      apiMonitor.recordAPICall(
        '/api/emotional-growth/evaluate',
        'POST',
        Date.now() - startTime,
        200
      )
      
      return interaction
    } catch (error) {
      apiMonitor.recordAPICall(
        '/api/emotional-growth/evaluate',
        'POST',
        Date.now() - startTime,
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // 评估消息长度质量
  private evaluateMessageLength(message: string): number {
    const length = message.trim().length
    if (length < 10) return 30
    if (length < 50) return 60
    if (length < 150) return 85
    if (length < 300) return 95
    return 90 // 太长可能质量下降
  }

  // 评估情感深度
  private evaluateEmotionalDepth(userMessage: string, aiResponse: string): number {
    const emotionalKeywords = [
      '感觉', '情感', '心情', '开心', '难过', '兴奋', '紧张', '担心', '爱', '喜欢',
      '讨厌', '害怕', '愤怒', '失望', '希望', '梦想', '回忆', '想念', '感动', '温暖'
    ]
    
    const userEmotions = emotionalKeywords.filter(keyword => 
      userMessage.includes(keyword)).length
    const aiEmotions = emotionalKeywords.filter(keyword => 
      aiResponse.includes(keyword)).length
    
    const emotionalDensity = (userEmotions + aiEmotions) / 
      (userMessage.length + aiResponse.length) * 1000
    
    return Math.min(100, emotionalDensity * 50 + 30)
  }

  // 评估参与度
  private evaluateEngagement(userMessage: string, aiResponse: string): number {
    let score = 50
    
    // 检查问题和回答
    const userQuestions = (userMessage.match(/[？?]/g) || []).length
    const aiQuestions = (aiResponse.match(/[？?]/g) || []).length
    score += Math.min(20, (userQuestions + aiQuestions) * 5)
    
    // 检查感叹号（表示情感强度）
    const userExclamations = (userMessage.match(/[！!]/g) || []).length
    const aiExclamations = (aiResponse.match(/[！!]/g) || []).length
    score += Math.min(15, (userExclamations + aiExclamations) * 3)
    
    // 检查表情符号
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu
    const userEmojis = (userMessage.match(emojiRegex) || []).length
    const aiEmojis = (aiResponse.match(emojiRegex) || []).length
    score += Math.min(15, (userEmojis + aiEmojis) * 2)
    
    return Math.min(100, score)
  }

  // 评估创造性
  private evaluateCreativity(aiResponse: string): number {
    let score = 50
    
    // 检查比喻和修辞
    const metaphors = ['像', '如同', '仿佛', '好比', '犹如']
    const metaphorCount = metaphors.filter(word => aiResponse.includes(word)).length
    score += Math.min(20, metaphorCount * 5)
    
    // 检查丰富的词汇
    const richVocabulary = ['绚烂', '温馨', '惬意', '宁静', '澎湃', '细腻', '深邃', '灿烂']
    const vocabCount = richVocabulary.filter(word => aiResponse.includes(word)).length
    score += Math.min(20, vocabCount * 4)
    
    // 检查个性化表达
    const personalExpressions = ['我觉得', '在我看来', '我想', '我希望', '我记得']
    const personalCount = personalExpressions.filter(expr => aiResponse.includes(expr)).length
    score += Math.min(20, personalCount * 4)
    
    return Math.min(100, score)
  }

  // 评估一致性
  private evaluateConsistency(userId: string, companionId: string, message: string): number {
    // 这里可以基于历史对话分析一致性
    // 简化实现，返回基础分数
    return 75
  }

  // 更新关系进展
  async updateRelationshipProgress(
    supabase: SupabaseClient,
    userId: string,
    companionId: string,
    interaction: InteractionQuality
  ): Promise<RelationshipProgress> {
    const startTime = Date.now()
    
    try {
      const cacheKey = `relationship_${userId}_${companionId}`
      let progress = this.progressCache.get(cacheKey) || 
                    apiCache.get<RelationshipProgress>(cacheKey)
      
      if (!progress) {
        // 从数据库获取或创建新的进展记录
        progress = await this.getOrCreateProgress(supabase, userId, companionId)
      }
      
      // 更新互动统计
      progress.totalInteractions++
      progress.recentInteractions.push(interaction)
      
      // 保持最近20次互动
      if (progress.recentInteractions.length > 20) {
        progress.recentInteractions = progress.recentInteractions.slice(-20)
      }
      
      // 计算平均质量分数
      const recentScores = progress.recentInteractions.map(i => i.qualityScore)
      progress.qualityScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
      
      // 计算亲密度增长
      const intimacyGain = this.calculateIntimacyGain(interaction.qualityScore)
      progress.intimacyPoints += intimacyGain
      
      // 更新亲密度等级
      const newLevel = this.calculateIntimacyLevel(progress.intimacyPoints)
      if (newLevel > progress.intimacyLevel) {
        progress.intimacyLevel = newLevel
        // 检查里程碑
        await this.checkMilestones(supabase, progress)
      }
      
      // 计算关系天数
      const firstInteraction = progress.recentInteractions[0]
      if (firstInteraction) {
        progress.relationshipDays = Math.floor(
          (Date.now() - firstInteraction.timestamp) / (24 * 60 * 60 * 1000)
        )
      }
      
      // 分析成长趋势
      progress.growthTrend = this.analyzeGrowthTrend(progress.recentInteractions)
      
      progress.lastUpdated = Date.now()
      
      // 更新数据库
      await this.saveProgressToDatabase(supabase, progress)
      
      // 更新缓存
      this.progressCache.set(cacheKey, progress)
      apiCache.set(cacheKey, progress, 30 * 60 * 1000) // 30分钟缓存
      
      // 记录性能
      apiMonitor.recordAPICall(
        '/api/emotional-growth/progress',
        'PUT',
        Date.now() - startTime,
        200
      )
      
      return progress
    } catch (error) {
      apiMonitor.recordAPICall(
        '/api/emotional-growth/progress',
        'PUT',
        Date.now() - startTime,
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
      throw error
    }
  }

  // 计算亲密度增长
  private calculateIntimacyGain(qualityScore: number): number {
    if (qualityScore >= 90) return 5
    if (qualityScore >= 80) return 4
    if (qualityScore >= 70) return 3
    if (qualityScore >= 60) return 2
    return 1
  }

  // 计算亲密度等级
  private calculateIntimacyLevel(intimacyPoints: number): number {
    if (intimacyPoints >= 1000) return 6
    if (intimacyPoints >= 500) return 5
    if (intimacyPoints >= 200) return 4
    if (intimacyPoints >= 100) return 3
    if (intimacyPoints >= 50) return 2
    return 1
  }

  // 分析成长趋势
  private analyzeGrowthTrend(interactions: InteractionQuality[]): 'increasing' | 'stable' | 'decreasing' {
    if (interactions.length < 5) return 'stable'
    
    const recent = interactions.slice(-5).map(i => i.qualityScore)
    const earlier = interactions.slice(-10, -5).map(i => i.qualityScore)
    
    if (earlier.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length
    
    const diff = recentAvg - earlierAvg
    
    if (diff > 5) return 'increasing'
    if (diff < -5) return 'decreasing'
    return 'stable'
  }

  // 检查里程碑
  private async checkMilestones(
    supabase: SupabaseClient,
    progress: RelationshipProgress
  ): Promise<void> {
    for (const milestone of RELATIONSHIP_MILESTONES) {
      if (progress.milestones.includes(milestone.id)) continue
      
      const meetsRequirements = 
        progress.intimacyLevel >= milestone.requiredIntimacyLevel &&
        progress.totalInteractions >= milestone.requiredInteractions &&
        progress.relationshipDays >= milestone.requiredDays
      
      if (meetsRequirements) {
        progress.milestones.push(milestone.id)
        progress.intimacyPoints += milestone.rewards.intimacyPoints
        
        // 创建里程碑回忆
        await this.createMilestoneMemory(supabase, progress, milestone)
      }
    }
  }

  // 创建里程碑回忆
  private async createMilestoneMemory(
    supabase: SupabaseClient,
    progress: RelationshipProgress,
    milestone: RelationshipMilestone
  ): Promise<void> {
    const memory: MemoryFragment = {
      id: `milestone_${milestone.id}_${Date.now()}`,
      userId: progress.userId,
      companionId: progress.companionId,
      type: 'milestone',
      title: milestone.name,
      content: milestone.description,
      emotionalValue: milestone.rewards.intimacyPoints,
      timestamp: Date.now(),
      tags: ['里程碑', milestone.name]
    }
    
    // 保存到内存
    const userMemories = this.memoryFragments.get(progress.userId) || []
    userMemories.push(memory)
    this.memoryFragments.set(progress.userId, userMemories)
    
    // 保存到数据库（如果有相应的表）
    // 这里可以扩展数据库保存逻辑
  }

  // 获取或创建进展记录
  private async getOrCreateProgress(
    supabase: SupabaseClient,
    userId: string,
    companionId: string
  ): Promise<RelationshipProgress> {
    // 尝试从数据库获取
    const { data } = await supabase
      .from('relationship_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('companion_id', companionId)
      .maybeSingle()
    
    if (data) {
      return {
        userId,
        companionId,
        intimacyLevel: data.intimacy_level || 1,
        intimacyPoints: data.intimacy_points || 0,
        totalInteractions: data.total_interactions || 0,
        qualityScore: data.quality_score || 50,
        relationshipDays: data.relationship_days || 0,
        milestones: data.milestones || [],
        recentInteractions: [],
        growthTrend: data.growth_trend || 'stable',
        lastUpdated: Date.now()
      }
    }
    
    // 创建新记录
    return {
      userId,
      companionId,
      intimacyLevel: 1,
      intimacyPoints: 0,
      totalInteractions: 0,
      qualityScore: 50,
      relationshipDays: 0,
      milestones: [],
      recentInteractions: [],
      growthTrend: 'stable',
      lastUpdated: Date.now()
    }
  }

  // 保存进展到数据库
  private async saveProgressToDatabase(
    supabase: SupabaseClient,
    progress: RelationshipProgress
  ): Promise<void> {
    const { error } = await supabase
      .from('relationship_progress')
      .upsert({
        user_id: progress.userId,
        companion_id: progress.companionId,
        intimacy_level: progress.intimacyLevel,
        intimacy_points: progress.intimacyPoints,
        total_interactions: progress.totalInteractions,
        quality_score: progress.qualityScore,
        relationship_days: progress.relationshipDays,
        milestones: progress.milestones,
        growth_trend: progress.growthTrend,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Failed to save relationship progress:', error)
    }
  }

  // 获取关系进展
  async getRelationshipProgress(
    supabase: SupabaseClient,
    userId: string,
    companionId: string
  ): Promise<RelationshipProgress> {
    const cacheKey = `relationship_${userId}_${companionId}`
    
    // 尝试从缓存获取
    let progress = this.progressCache.get(cacheKey) || 
                  apiCache.get<RelationshipProgress>(cacheKey)
    
    if (!progress) {
      progress = await this.getOrCreateProgress(supabase, userId, companionId)
      this.progressCache.set(cacheKey, progress)
      apiCache.set(cacheKey, progress, 30 * 60 * 1000)
    }
    
    return progress
  }

  // 获取里程碑列表
  getMilestones(): RelationshipMilestone[] {
    return RELATIONSHIP_MILESTONES
  }

  // 获取用户回忆
  getUserMemories(userId: string): MemoryFragment[] {
    return this.memoryFragments.get(userId) || []
  }

  // 创建对话回忆
  async createConversationMemory(
    userId: string,
    companionId: string,
    title: string,
    content: string,
    emotionalValue: number
  ): Promise<MemoryFragment> {
    const memory: MemoryFragment = {
      id: `conversation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      companionId,
      type: 'conversation',
      title,
      content,
      emotionalValue,
      timestamp: Date.now(),
      tags: ['对话', '回忆']
    }
    
    const userMemories = this.memoryFragments.get(userId) || []
    userMemories.push(memory)
    this.memoryFragments.set(userId, userMemories)
    
    return memory
  }
}

// 创建全局情感成长系统实例
export const emotionalGrowthSystem = new EmotionalGrowthSystem()

// React Hook for emotional growth
import { useState, useEffect } from 'react'

export const useEmotionalGrowth = (userId: string, companionId: string) => {
  const [progress, setProgress] = useState<RelationshipProgress | null>(null)
  const [milestones, setMilestones] = useState<RelationshipMilestone[]>([])
  const [memories, setMemories] = useState<MemoryFragment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !companionId) return

    const loadData = async () => {
      try {
        setLoading(true)
        // 这里需要传入 supabase 实例，实际使用时需要从上下文获取
        // const progress = await emotionalGrowthSystem.getRelationshipProgress(supabase, userId, companionId)
        // setProgress(progress)
        
        setMilestones(emotionalGrowthSystem.getMilestones())
        setMemories(emotionalGrowthSystem.getUserMemories(userId))
      } catch (error) {
        console.error('Failed to load emotional growth data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, companionId])

  return {
    progress,
    milestones,
    memories,
    loading
  }
}

export default emotionalGrowthSystem