// 临时用户会话管理系统
import { v4 as uuidv4 } from 'uuid'

export interface GuestSession {
  sessionId: string
  temporaryCompanion: TempCompanion
  conversationHistory: GuestMessage[]
  experienceStartTime: Date
  messageCount: number
  engagementScore: number
  conversionTriggers: ConversionTrigger[]
}

export interface TempCompanion {
  id: string
  name: string
  personality: 'gentle' | 'lively' | 'intellectual'
  avatar: string
  backstory: string
  traits: string[]
  greeting: string
}

export interface GuestMessage {
  id: string
  content: string
  sender: 'user' | 'companion'
  timestamp: Date
  emotion?: string
}

export interface ConversionTrigger {
  type: 'message_count' | 'engagement_high' | 'time_spent'
  threshold: number
  triggered: boolean
  message: string
}

// 预设的临时伴侣模板
const TEMP_COMPANION_TEMPLATES: TempCompanion[] = [
  {
    id: 'temp-gentle',
    name: '小雨',
    personality: 'gentle',
    avatar: '/images/presets/temp-gentle.jpg',
    backstory: '温柔体贴的邻家女孩，喜欢安静的午后和温暖的对话',
    traits: ['温柔', '体贴', '善解人意', '细心'],
    greeting: '你好呀～我是小雨，很高兴遇见你！今天过得怎么样？💕'
  },
  {
    id: 'temp-lively',
    name: '小晴',
    personality: 'lively',
    avatar: '/images/presets/temp-lively.jpg',
    backstory: '活泼开朗的阳光女孩，总是充满正能量和好奇心',
    traits: ['活泼', '开朗', '好奇', '热情'],
    greeting: '嗨！我是小晴～超级开心认识你！我们来聊点有趣的吧！✨'
  },
  {
    id: 'temp-intellectual',
    name: '小书',
    personality: 'intellectual',
    avatar: '/images/presets/temp-intellectual.jpg',
    backstory: '知性优雅的文艺女孩，喜欢深度思考和有意义的交流',
    traits: ['知性', '优雅', '理性', '深刻'],
    greeting: '你好，我是小书。很高兴能与你进行一场有深度的对话 📚'
  }
]

// 转化触发器配置
const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    type: 'message_count',
    threshold: 3,
    triggered: false,
    message: '我们聊得很开心呢！想要创建专属于你的AI伴侣吗？这样我们就能有更深入的交流了～'
  },
  {
    type: 'engagement_high',
    threshold: 0.8,
    triggered: false,
    message: '感觉你很喜欢和我聊天！注册后我们可以解锁更多有趣的功能哦～'
  },
  {
    type: 'time_spent',
    threshold: 300, // 5分钟
    triggered: false,
    message: '时间过得真快！注册一个账户，我们就能保存这些美好的对话回忆了💕'
  }
]

class GuestSessionManager {
  private static readonly STORAGE_KEY = 'ai_companion_guest_session'
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000 // 24小时

  // 创建新的临时会话
  static createGuestSession(): GuestSession {
    const randomCompanion = TEMP_COMPANION_TEMPLATES[
      Math.floor(Math.random() * TEMP_COMPANION_TEMPLATES.length)
    ]

    const session: GuestSession = {
      sessionId: uuidv4(),
      temporaryCompanion: randomCompanion,
      conversationHistory: [
        {
          id: uuidv4(),
          content: randomCompanion.greeting,
          sender: 'companion',
          timestamp: new Date()
        }
      ],
      experienceStartTime: new Date(),
      messageCount: 0,
      engagementScore: 0,
      conversionTriggers: [...CONVERSION_TRIGGERS]
    }

    this.saveSession(session)
    return session
  }

  // 获取当前会话
  static getCurrentSession(): GuestSession | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const session: GuestSession = JSON.parse(stored)
      
      // 检查会话是否过期
      const now = new Date().getTime()
      const sessionStart = new Date(session.experienceStartTime).getTime()
      
      if (now - sessionStart > this.SESSION_DURATION) {
        this.clearSession()
        return null
      }

      // 转换日期字符串回Date对象
      session.experienceStartTime = new Date(session.experienceStartTime)
      session.conversationHistory = session.conversationHistory.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))

      return session
    } catch (error) {
      console.error('Failed to load guest session:', error)
      this.clearSession()
      return null
    }
  }

  // 保存会话
  static saveSession(session: GuestSession): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Failed to save guest session:', error)
    }
  }

  // 添加消息到会话
  static addMessage(content: string, sender: 'user' | 'companion', emotion?: string): GuestSession | null {
    const session = this.getCurrentSession()
    if (!session) return null

    const message: GuestMessage = {
      id: uuidv4(),
      content,
      sender,
      timestamp: new Date(),
      emotion
    }

    session.conversationHistory.push(message)
    
    if (sender === 'user') {
      session.messageCount++
      session.engagementScore = this.calculateEngagementScore(session)
      this.checkConversionTriggers(session)
    }

    this.saveSession(session)
    return session
  }

  // 计算参与度分数
  private static calculateEngagementScore(session: GuestSession): number {
    const { conversationHistory, experienceStartTime } = session
    const userMessages = conversationHistory.filter(msg => msg.sender === 'user')
    
    if (userMessages.length === 0) return 0

    // 基于消息频率、长度和时间跨度计算参与度
    const timeSpent = (new Date().getTime() - experienceStartTime.getTime()) / 1000 // 秒
    const avgMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
    const messageFrequency = userMessages.length / Math.max(timeSpent / 60, 1) // 每分钟消息数

    // 归一化分数 (0-1)
    const lengthScore = Math.min(avgMessageLength / 50, 1) // 50字符为满分
    const frequencyScore = Math.min(messageFrequency / 2, 1) // 每分钟2条消息为满分
    const persistenceScore = Math.min(timeSpent / 300, 1) // 5分钟为满分

    return (lengthScore + frequencyScore + persistenceScore) / 3
  }

  // 检查转化触发器
  private static checkConversionTriggers(session: GuestSession): void {
    const timeSpent = (new Date().getTime() - session.experienceStartTime.getTime()) / 1000

    session.conversionTriggers.forEach(trigger => {
      if (trigger.triggered) return

      let shouldTrigger = false

      switch (trigger.type) {
        case 'message_count':
          shouldTrigger = session.messageCount >= trigger.threshold
          break
        case 'engagement_high':
          shouldTrigger = session.engagementScore >= trigger.threshold
          break
        case 'time_spent':
          shouldTrigger = timeSpent >= trigger.threshold
          break
      }

      if (shouldTrigger) {
        trigger.triggered = true
      }
    })
  }

  // 获取下一个转化提示
  static getNextConversionPrompt(session: GuestSession): string | null {
    const triggeredPrompt = session.conversionTriggers.find(t => t.triggered)
    return triggeredPrompt ? triggeredPrompt.message : null
  }

  // 清除会话
  static clearSession(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // 检查是否应该显示转化提示
  static shouldShowConversionPrompt(session: GuestSession): boolean {
    return session.conversionTriggers.some(t => t.triggered)
  }

  // 获取会话统计
  static getSessionStats(session: GuestSession) {
    const timeSpent = (new Date().getTime() - session.experienceStartTime.getTime()) / 1000
    const userMessages = session.conversationHistory.filter(msg => msg.sender === 'user')
    
    return {
      timeSpent: Math.round(timeSpent),
      messageCount: session.messageCount,
      engagementScore: Math.round(session.engagementScore * 100),
      companionName: session.temporaryCompanion.name,
      conversationLength: session.conversationHistory.length
    }
  }

  // 迁移数据到正式账户（注册时调用）
  static async migrateToAccount(userId: string): Promise<boolean> {
    const session = this.getCurrentSession()
    if (!session) return false

    try {
      // 这里将临时数据迁移到正式账户
      // 实际实现时需要调用后端API
      const migrationData = {
        userId,
        temporaryCompanion: session.temporaryCompanion,
        conversationHistory: session.conversationHistory,
        sessionStats: this.getSessionStats(session)
      }

      // 调用迁移API
      const response = await fetch('/api/guest/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(migrationData)
      })

      if (response.ok) {
        this.clearSession()
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to migrate guest session:', error)
      return false
    }
  }
}

export default GuestSessionManager