// 智能客服系统
interface CustomerQuery {
  id: string
  userId: string
  message: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'processing' | 'resolved' | 'escalated'
  createdAt: number
  resolvedAt?: number
  assignedAgent?: string
  satisfaction?: number
}

interface KnowledgeBase {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
  confidence: number
  usage_count: number
  last_updated: number
}

interface AutoResponse {
  pattern: RegExp
  response: string
  confidence: number
  followUp?: string[]
}

class IntelligentCustomerService {
  private queries = new Map<string, CustomerQuery>()
  private knowledgeBase: KnowledgeBase[] = [
    {
      id: 'kb_001',
      question: '如何创建AI伴侣？',
      answer: '点击首页的"创建伴侣"按钮，选择外观和性格特征，即可创建专属AI伴侣。整个过程只需30秒！',
      category: '基础使用',
      keywords: ['创建', '伴侣', '开始', '新建'],
      confidence: 0.95,
      usage_count: 156,
      last_updated: Date.now()
    },
    {
      id: 'kb_002',
      question: '免费用户有什么限制？',
      answer: '免费用户每日可发送20条消息，可体验基础对话功能。升级Premium可享受无限对话、高级AI模型等特权。',
      category: '付费相关',
      keywords: ['免费', '限制', '消息', '次数', 'premium'],
      confidence: 0.92,
      usage_count: 89,
      last_updated: Date.now()
    },
    {
      id: 'kb_003',
      question: '如何修改伴侣的性格？',
      answer: '进入伴侣设置页面，在"性格定制"选项中可以调整温柔度、活泼度等特质。Premium用户可使用高级定制功能。',
      category: '个性化设置',
      keywords: ['修改', '性格', '定制', '设置', '调整'],
      confidence: 0.88,
      usage_count: 67,
      last_updated: Date.now()
    },
    {
      id: 'kb_004',
      question: '支付失败怎么办？',
      answer: '请检查网络连接和支付方式，确保账户余额充足。如仍有问题，请联系客服或尝试其他支付方式。',
      category: '支付问题',
      keywords: ['支付', '失败', '付款', '充值', '订单'],
      confidence: 0.90,
      usage_count: 43,
      last_updated: Date.now()
    },
    {
      id: 'kb_005',
      question: '如何删除对话记录？',
      answer: '在对话界面长按消息可删除单条记录，或在设置中选择"清空对话历史"删除全部记录。',
      category: '数据管理',
      keywords: ['删除', '对话', '记录', '历史', '清空'],
      confidence: 0.85,
      usage_count: 34,
      last_updated: Date.now()
    }
  ]

  private autoResponses: AutoResponse[] = [
    {
      pattern: /你好|您好|hi|hello/i,
      response: '您好！我是智能客服小助手，很高兴为您服务。请问有什么可以帮助您的吗？',
      confidence: 0.95,
      followUp: ['常见问题', '联系人工客服', '使用教程']
    },
    {
      pattern: /谢谢|感谢|thank/i,
      response: '不客气！如果还有其他问题，随时可以咨询我哦～',
      confidence: 0.90
    },
    {
      pattern: /人工|客服|转接/i,
      response: '正在为您转接人工客服，请稍候...',
      confidence: 0.95,
      followUp: ['预计等待时间：2-5分钟']
    }
  ]

  // 处理用户查询
  async processQuery(userId: string, message: string): Promise<{
    response: string
    confidence: number
    needsHuman: boolean
    queryId: string
  }> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 创建查询记录
    const query: CustomerQuery = {
      id: queryId,
      userId,
      message,
      category: await this.categorizeQuery(message),
      priority: this.calculatePriority(message),
      status: 'processing',
      createdAt: Date.now()
    }
    
    this.queries.set(queryId, query)

    // 尝试自动回复
    const autoResponse = this.findAutoResponse(message)
    if (autoResponse && autoResponse.confidence > 0.8) {
      query.status = 'resolved'
      query.resolvedAt = Date.now()
      
      return {
        response: autoResponse.response,
        confidence: autoResponse.confidence,
        needsHuman: false,
        queryId
      }
    }

    // 搜索知识库
    const kbResult = this.searchKnowledgeBase(message)
    if (kbResult && kbResult.confidence > 0.7) {
      query.status = 'resolved'
      query.resolvedAt = Date.now()
      
      // 更新使用统计
      kbResult.usage_count++
      
      return {
        response: kbResult.answer,
        confidence: kbResult.confidence,
        needsHuman: false,
        queryId
      }
    }

    // 需要人工处理
    query.status = 'escalated'
    
    return {
      response: '您的问题比较复杂，正在为您转接专业客服，请稍候...',
      confidence: 0.5,
      needsHuman: true,
      queryId
    }
  }

  // 查询分类
  private async categorizeQuery(message: string): Promise<string> {
    const categories = {
      '基础使用': ['创建', '开始', '使用', '操作', '功能'],
      '付费相关': ['付费', '充值', '订单', '价格', '优惠', 'premium'],
      '技术问题': ['bug', '错误', '卡顿', '崩溃', '加载'],
      '账户问题': ['登录', '注册', '密码', '账号', '绑定'],
      '个性化设置': ['设置', '定制', '修改', '调整', '个性化'],
      '数据管理': ['删除', '导出', '备份', '恢复', '同步'],
      '其他': []
    }

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return category
      }
    }

    return '其他'
  }

  // 计算优先级
  private calculatePriority(message: string): CustomerQuery['priority'] {
    const urgentKeywords = ['紧急', '急', '重要', '无法使用', '崩溃', '丢失']
    const highKeywords = ['bug', '错误', '问题', '失败', '不能']
    const mediumKeywords = ['如何', '怎么', '设置', '修改']

    if (urgentKeywords.some(keyword => message.includes(keyword))) {
      return 'urgent'
    }
    if (highKeywords.some(keyword => message.includes(keyword))) {
      return 'high'
    }
    if (mediumKeywords.some(keyword => message.includes(keyword))) {
      return 'medium'
    }

    return 'low'
  }

  // 查找自动回复
  private findAutoResponse(message: string): AutoResponse | null {
    for (const response of this.autoResponses) {
      if (response.pattern.test(message)) {
        return response
      }
    }
    return null
  }

  // 搜索知识库
  private searchKnowledgeBase(message: string): KnowledgeBase | null {
    let bestMatch: KnowledgeBase | null = null
    let bestScore = 0

    for (const kb of this.knowledgeBase) {
      let score = 0
      
      // 关键词匹配
      for (const keyword of kb.keywords) {
        if (message.includes(keyword)) {
          score += 0.3
        }
      }
      
      // 问题相似度
      const similarity = this.calculateSimilarity(message, kb.question)
      score += similarity * 0.7
      
      // 考虑基础置信度
      score *= kb.confidence

      if (score > bestScore && score > 0.5) {
        bestScore = score
        bestMatch = { ...kb, confidence: score }
      }
    }

    return bestMatch
  }

  // 计算文本相似度
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split('')
    const words2 = text2.toLowerCase().split('')
    
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    
    return intersection.length / union.length
  }

  // 获取查询状态
  getQueryStatus(queryId: string): CustomerQuery | null {
    return this.queries.get(queryId) || null
  }

  // 更新查询状态
  updateQueryStatus(queryId: string, status: CustomerQuery['status'], agentId?: string) {
    const query = this.queries.get(queryId)
    if (query) {
      query.status = status
      if (agentId) {
        query.assignedAgent = agentId
      }
      if (status === 'resolved') {
        query.resolvedAt = Date.now()
      }
    }
  }

  // 添加满意度评分
  addSatisfactionRating(queryId: string, rating: number) {
    const query = this.queries.get(queryId)
    if (query) {
      query.satisfaction = rating
    }
  }

  // 获取常见问题
  getFrequentQuestions(limit: number = 10): KnowledgeBase[] {
    return this.knowledgeBase
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, limit)
  }

  // 获取分类问题
  getQuestionsByCategory(category: string): KnowledgeBase[] {
    return this.knowledgeBase.filter(kb => kb.category === category)
  }

  // 添加新的知识条目
  addKnowledgeEntry(entry: Omit<KnowledgeBase, 'id' | 'usage_count' | 'last_updated'>): string {
    const id = `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const newEntry: KnowledgeBase = {
      ...entry,
      id,
      usage_count: 0,
      last_updated: Date.now()
    }
    
    this.knowledgeBase.push(newEntry)
    return id
  }

  // 获取客服统计数据
  getServiceStats(): {
    totalQueries: number
    resolvedQueries: number
    averageResolutionTime: number
    satisfactionScore: number
    categoryStats: Record<string, number>
  } {
    const queries = Array.from(this.queries.values())
    const resolvedQueries = queries.filter(q => q.status === 'resolved')
    
    const totalResolutionTime = resolvedQueries.reduce((sum, q) => {
      return sum + (q.resolvedAt! - q.createdAt)
    }, 0)
    
    const satisfactionRatings = queries
      .filter(q => q.satisfaction !== undefined)
      .map(q => q.satisfaction!)
    
    const categoryStats: Record<string, number> = {}
    queries.forEach(q => {
      categoryStats[q.category] = (categoryStats[q.category] || 0) + 1
    })

    return {
      totalQueries: queries.length,
      resolvedQueries: resolvedQueries.length,
      averageResolutionTime: resolvedQueries.length > 0 ? totalResolutionTime / resolvedQueries.length : 0,
      satisfactionScore: satisfactionRatings.length > 0 ? 
        satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length : 0,
      categoryStats
    }
  }
}

// 人工客服工作台
class CustomerServiceWorkbench {
  private agents = new Map<string, {
    id: string
    name: string
    status: 'online' | 'busy' | 'offline'
    currentQueries: string[]
    totalResolved: number
    averageRating: number
  }>()

  // 分配查询给客服
  assignQuery(queryId: string, agentId: string): boolean {
    const agent = this.agents.get(agentId)
    if (!agent || agent.status === 'offline') {
      return false
    }

    agent.currentQueries.push(queryId)
    if (agent.currentQueries.length >= 3) {
      agent.status = 'busy'
    }

    return true
  }

  // 获取可用客服
  getAvailableAgents(): Array<{
    id: string
    name: string
    workload: number
  }> {
    return Array.from(this.agents.values())
      .filter(agent => agent.status !== 'offline')
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        workload: agent.currentQueries.length
      }))
      .sort((a, b) => a.workload - b.workload)
  }

  // 获取队列状态
  getQueueStatus(): {
    waitingQueries: number
    averageWaitTime: number
    availableAgents: number
  } {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => agent.status === 'online').length

    return {
      waitingQueries: 0, // 需要从实际队列获取
      averageWaitTime: 0, // 需要计算
      availableAgents
    }
  }
}

// 创建全局实例
export const customerService = new IntelligentCustomerService()
export const serviceWorkbench = new CustomerServiceWorkbench()

// React Hook
import { useState, useEffect } from 'react'

export const useCustomerService = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [currentQuery, setCurrentQuery] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<Array<{
    message: string
    isUser: boolean
    timestamp: number
    confidence?: number
  }>>([])

  const sendMessage = async (message: string) => {
    // 添加用户消息到历史
    setChatHistory(prev => [...prev, {
      message,
      isUser: true,
      timestamp: Date.now()
    }])

    try {
      const result = await customerService.processQuery('current_user', message)
      setCurrentQuery(result.queryId)
      
      // 添加客服回复到历史
      setChatHistory(prev => [...prev, {
        message: result.response,
        isUser: false,
        timestamp: Date.now(),
        confidence: result.confidence
      }])

      return result
    } catch (error) {
      setChatHistory(prev => [...prev, {
        message: '抱歉，服务暂时不可用，请稍后重试。',
        isUser: false,
        timestamp: Date.now()
      }])
      throw error
    }
  }

  const rateSatisfaction = (rating: number) => {
    if (currentQuery) {
      customerService.addSatisfactionRating(currentQuery, rating)
    }
  }

  const getFrequentQuestions = () => {
    return customerService.getFrequentQuestions()
  }

  return {
    isConnected,
    chatHistory,
    sendMessage,
    rateSatisfaction,
    getFrequentQuestions
  }
}

export default customerService