'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getCompanion } from '@/lib/companion-service'
import { getChatHistory, sendMessage } from '@/lib/chat-service'
import ProactiveCareManager from '@/lib/proactive-care'
import { LoadingState } from '@/components/SkeletonLoader'
import { LoadingButton, InlineLoading } from '@/components/LoadingAnimations'
import { useDesignSystem } from '@/lib/design-system'
import { useAnimation, animationManager } from '@/lib/animation-system'
import type { Companion, ChatMessage } from '@/lib/database-setup'
import CompanionSettingsDrawer from '@/components/CompanionSettingsDrawer'
import EmotionalGrowthDisplay from '@/components/EmotionalGrowthDisplay'

// 表情包映射
const EMOJI_MAP: Record<string, string> = {
  ':)': '😊',
  ':-)': '😊',
  ':(': '😢',
  ':-(': '😢',
  ':D': '😃',
  ':-D': '😃',
  ':P': '😛',
  ':-P': '😛',
  ';)': '😉',
  ';-)': '😉',
  ':o': '😮',
  ':-o': '😮',
  ':*': '😘',
  ':-*': '😘',
  '<3': '💕',
  '</3': '💔',
  '^^': '😄',
  '>_<': '😣',
  '-_-': '😑',
  '~_~': '😴',
  'T_T': '😭',
  'QAQ': '😭',
  'OvO': '😍',
  '@_@': '😵',
  '=_=': '😑'
}

// 常用表情包
const QUICK_EMOJIS = ['😊', '😍', '🥰', '😘', '😂', '🤔', '😢', '😭', '😴', '🎉', '💕', '❤️', '👍', '👋', '🌸', '✨']

// 快捷回复
const QUICK_REPLIES = [
  '你好呀！👋',
  '今天过得怎么样？😊',
  '想你了 💕',
  '在做什么呢？🤔',
  '晚安 😴',
  '早上好！🌸',
  '谢谢你 ❤️',
  '哈哈哈 😂'
]

// 处理表情包转换
const processEmojis = (text: string): string => {
  let processedText = text
  Object.entries(EMOJI_MAP).forEach(([emoticon, emoji]) => {
    const regex = new RegExp(emoticon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    processedText = processedText.replace(regex, emoji)
  })
  return processedText
}

// 智能打字延迟算法
const calculateTypingDelay = (char: string, prevChar?: string): number => {
  // 基础延迟
  let delay = 50 + Math.random() * 30 // 50-80ms 基础延迟
  
  // 标点符号后的停顿
  if (prevChar && /[。！？，；：]/.test(prevChar)) {
    delay += 200 + Math.random() * 300 // 200-500ms 停顿
  }
  
  // 换行后的停顿
  if (prevChar === '\n') {
    delay += 100 + Math.random() * 200 // 100-300ms 停顿
  }
  
  // 空格的快速处理
  if (char === ' ') {
    delay = 20 + Math.random() * 10 // 20-30ms
  }
  
  // 数字和英文字母的快速输入
  if (/[a-zA-Z0-9]/.test(char)) {
    delay = 30 + Math.random() * 20 // 30-50ms
  }
  
  // 表情符号的停顿
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(char)) {
    delay += 100 + Math.random() * 100 // 额外100-200ms
  }
  
  return delay
}

// 打字音效播放器
const playTypingSound = () => {
  // 创建简单的打字音效
  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      // 静默处理音频错误
    }
  }
}

// 增强的流式消息组件
const StreamingMessage = ({ 
  content, 
  isComplete, 
  enableSound = false 
}: { 
  content: string
  isComplete: boolean
  enableSound?: boolean 
}) => {
  const [displayedContent, setDisplayedContent] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content)
      setIsTyping(false)
      return
    }

    if (currentIndex < content.length) {
      setIsTyping(true)
      const currentChar = content[currentIndex]
      const prevChar = currentIndex > 0 ? content[currentIndex - 1] : undefined
      const delay = calculateTypingDelay(currentChar, prevChar)
      
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
        
        // 播放打字音效
        if (enableSound && Math.random() > 0.7) { // 30% 概率播放音效
          playTypingSound()
        }
      }, delay)
      
      return () => clearTimeout(timer)
    } else {
      setIsTyping(false)
    }
  }, [content, currentIndex, isComplete, enableSound])

  const processedContent = processEmojis(displayedContent)

  return (
    <div className="relative">
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {processedContent}
        {isTyping && (
          <span className="inline-block w-0.5 h-4 bg-pink-500 ml-1 animate-pulse"></span>
        )}
      </p>
    </div>
  )
}

// 情绪检测和状态管理
const EMOTION_KEYWORDS = {
  happy: ['开心', '高兴', '快乐', '哈哈', '😊', '😄', '😃', '🥰', '😍', '太好了', '棒', '不错'],
  sad: ['难过', '伤心', '哭', '😢', '😭', '😔', '失望', '沮丧', '郁闷'],
  excited: ['兴奋', '激动', '太棒了', 'amazing', '哇', '✨', '🎉', '🔥', '超级'],
  love: ['爱', '喜欢', '💕', '❤️', '💖', '想你', '亲爱的', '宝贝'],
  angry: ['生气', '愤怒', '讨厌', '烦', '😠', '😡', '气死了'],
  surprised: ['惊讶', '震惊', '没想到', '😮', '😯', '天哪', '不会吧'],
  thinking: ['想', '思考', '🤔', '考虑', '琢磨', '纠结'],
  sleepy: ['困', '累', '睡', '😴', '💤', '疲惫'],
  playful: ['调皮', '淘气', '😛', '😜', '嘻嘻', '哼哼']
}

const detectEmotion = (text: string): string => {
  const lowerText = text.toLowerCase()
  
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return emotion
      }
    }
  }
  
  return 'neutral'
}

// 情绪主题配置
const EMOTION_THEMES = {
  happy: {
    gradient: 'from-yellow-100 to-orange-100',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    avatar: '😊'
  },
  sad: {
    gradient: 'from-blue-100 to-indigo-100',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    avatar: '😢'
  },
  excited: {
    gradient: 'from-pink-100 to-red-100',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    bgColor: 'bg-pink-50',
    avatar: '🤩'
  },
  love: {
    gradient: 'from-pink-100 to-rose-100',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    avatar: '🥰'
  },
  angry: {
    gradient: 'from-red-100 to-orange-100',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    avatar: '😠'
  },
  surprised: {
    gradient: 'from-purple-100 to-indigo-100',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    avatar: '😮'
  },
  thinking: {
    gradient: 'from-gray-100 to-slate-100',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    avatar: '🤔'
  },
  sleepy: {
    gradient: 'from-indigo-100 to-purple-100',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    avatar: '😴'
  },
  playful: {
    gradient: 'from-green-100 to-teal-100',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    avatar: '😜'
  },
  neutral: {
    gradient: 'from-pink-100 to-purple-100',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    bgColor: 'bg-pink-50',
    avatar: '👩'
  }
}

// 动态头像组件
const EmotionalAvatar = ({ 
  companion, 
  emotion = 'neutral', 
  size = 'md' 
}: { 
  companion: Companion
  emotion?: string
  size?: 'sm' | 'md' | 'lg'
}) => {
  const theme = EMOTION_THEMES[emotion as keyof typeof EMOTION_THEMES] || EMOTION_THEMES.neutral
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-gradient-to-br ${theme.gradient} rounded-full flex items-center justify-center shadow-sm border ${theme.borderColor} transition-all duration-500 relative overflow-hidden`}>
      {companion.avatar_url ? (
        <>
          <img
            src={companion.avatar_url}
            alt={companion.name}
            className="w-full h-full rounded-full object-cover"
          />
          {/* 情绪覆盖层 */}
          <div className={`absolute inset-0 ${theme.bgColor} opacity-20 rounded-full transition-opacity duration-500`}></div>
          {/* 情绪表情指示器 */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
            <span className="text-xs">{theme.avatar}</span>
          </div>
        </>
      ) : (
        <span className="text-lg">{theme.avatar}</span>
      )}
    </div>
  )
}

// 情绪状态指示器
const EmotionIndicator = ({ 
  emotion, 
  intensity = 0.5 
}: { 
  emotion: string
  intensity?: number 
}) => {
  const theme = EMOTION_THEMES[emotion as keyof typeof EMOTION_THEMES] || EMOTION_THEMES.neutral
  
  if (emotion === 'neutral') return null
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${theme.bgColor} ${theme.textColor} text-xs border ${theme.borderColor} transition-all duration-300`}>
      <span>{theme.avatar}</span>
      <span className="font-medium capitalize">{emotion}</span>
      {/* 情绪强度指示器 */}
      <div className="w-3 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-current transition-all duration-500`}
          style={{ width: `${intensity * 100}%` }}
        ></div>
      </div>
    </div>
  )
}
const TypingIndicator = ({ 
  companion, 
  isVisible, 
  messageLength = 0 
}: { 
  companion: Companion
  isVisible: boolean
  messageLength?: number 
}) => {
  const [dots, setDots] = useState('')
  const [typingPhase, setTypingPhase] = useState<'thinking' | 'typing' | 'finishing'>('thinking')

  useEffect(() => {
    if (!isVisible) {
      setDots('')
      setTypingPhase('thinking')
      return
    }

    // 根据消息长度计算打字阶段
    const thinkingTime = Math.min(1000 + messageLength * 20, 3000) // 1-3秒思考时间
    const typingTime = messageLength * 50 // 根据消息长度计算打字时间
    
    // 思考阶段
    const thinkingTimer = setTimeout(() => {
      setTypingPhase('typing')
    }, thinkingTime)

    // 完成阶段
    const finishingTimer = setTimeout(() => {
      setTypingPhase('finishing')
    }, thinkingTime + typingTime)

    return () => {
      clearTimeout(thinkingTimer)
      clearTimeout(finishingTimer)
    }
  }, [isVisible, messageLength])

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const getTypingText = () => {
    switch (typingPhase) {
      case 'thinking':
        return '正在思考'
      case 'typing':
        return '正在输入'
      case 'finishing':
        return '即将发送'
      default:
        return '正在输入'
    }
  }

  return (
    <div className="flex justify-start items-end gap-2">
      <EmotionalAvatar 
        companion={companion}
        emotion="thinking"
        size="sm"
      />
      
      <div className="bg-white border border-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{getTypingText()}{dots}</span>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: '0s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div 
              className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}
const EmojiPicker = ({ onEmojiSelect, onClose }: { onEmojiSelect: (emoji: string) => void, onClose: () => void }) => {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700">选择表情</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-8 gap-2">
        {QUICK_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji)
              onClose()
            }}
            className="w-8 h-8 flex items-center justify-center hover:bg-pink-50 rounded-lg transition-colors text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// 快捷回复组件
const QuickReplies = ({ onReplySelect, visible }: { onReplySelect: (reply: string) => void, visible: boolean }) => {
  if (!visible) return null

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {QUICK_REPLIES.slice(0, 4).map((reply, index) => (
        <button
          key={index}
          onClick={() => onReplySelect(reply)}
          className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600 rounded-full text-xs hover:from-pink-100 hover:to-purple-100 transition-all border border-pink-200 hover:border-pink-300"
        >
          {reply}
        </button>
      ))}
    </div>
  )
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [companion, setCompanion] = useState<Companion | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [quotaRemaining, setQuotaRemaining] = useState<number | undefined>()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [typingSoundEnabled, setTypingSoundEnabled] = useState(false)
  const [preparingResponse, setPreparingResponse] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [emotionIntensity, setEmotionIntensity] = useState(0.5)
  const [careMessages, setCareMessages] = useState<any[]>([])
  const [showCarePrompt, setShowCarePrompt] = useState(false)
  const [showEmotionalGrowth, setShowEmotionalGrowth] = useState(false)
  
  // 设计系统和动画
  const { colors, theme } = useDesignSystem()
  const { elementRef, animate } = useAnimation()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const params = useParams()
  const companionId = params.companionId as string

  useEffect(() => {
    initializeChat()
  }, [companionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  useEffect(() => {
    // 页面加载动画
    if (!loading && companion) {
      animate('fadeIn', { duration: 600 })
    }
  }, [loading, companion, animate])

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [newMessage])

  // 隐藏快捷回复当有消息时
  useEffect(() => {
    if (messages.length > 0) {
      setShowQuickReplies(false)
    }
  }, [messages.length])

  // 用户活跃度追踪
  useEffect(() => {
    if (user && companion) {
      // 追踪登录活动
      ProactiveCareManager.trackUserActivity(user.id, companion.id, 'login')
      
      // 定期检查关怀机会
      const checkCareInterval = setInterval(async () => {
        const careOpportunities = await ProactiveCareManager.checkCareOpportunities(user.id, companion.id)
        if (careOpportunities.length > 0) {
          setCareMessages(careOpportunities)
          setShowCarePrompt(true)
        }
      }, 30000) // 每30秒检查一次
      
      return () => clearInterval(checkCareInterval)
    }
  }, [user, companion])

  const initializeChat = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }
      setUser(currentUser)

      // 获取伴侣信息
      const companionData = await getCompanion(companionId, currentUser.id)
      if (!companionData) {
        alert('伴侣不存在')
        router.push('/')
        return
      }
      setCompanion(companionData)

      // 获取对话历史
      const history = await getChatHistory(currentUser.id, companionId)
      setMessages(history)
    } catch (error) {
      console.error('初始化聊天失败:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    setPreparingResponse(true)
    const messageContent = newMessage.trim()
    setNewMessage('')
    setShowQuickReplies(false)

    // 追踪用户消息活动
    if (user && companion) {
      await ProactiveCareManager.trackUserActivity(user.id, companion.id, 'message', {
        messageLength: messageContent.length,
        emotion: detectEmotion(messageContent)
      })
    }

    // 立即显示用户消息
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      companion_id: companionId,
      sender_type: 'user',
      content: messageContent,
      message_type: 'text',
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const result = await sendMessage(user.id, {
        companionId,
        content: messageContent
      })

      // 模拟AI思考和准备时间
      const aiContent = result.companionResponse.content
      const thinkingTime = Math.min(1000 + aiContent.length * 20, 3000)
      
      setTimeout(() => {
        setPreparingResponse(false)
        setIsStreaming(true)
        setStreamingMessage(aiContent)
        
        // 计算流式输出完成时间
        const streamingTime = aiContent.split('').reduce((total, char, index) => {
          const prevChar = index > 0 ? aiContent[index - 1] : undefined
          return total + calculateTypingDelay(char, prevChar)
        }, 0)
        
        // 流式输出完成后，替换为真实消息
        setTimeout(() => {
          setMessages(prev => {
            const newMessages = [...prev]
            // 替换临时用户消息为真实消息
            newMessages[newMessages.length - 1] = result.message
            // 添加AI回复
            newMessages.push(result.companionResponse)
            return newMessages
          })
          setIsStreaming(false)
          setStreamingMessage('')
          
          // 检测AI回复的情绪
          const aiEmotion = detectEmotion(result.companionResponse.content)
          setCurrentEmotion(aiEmotion)
          setEmotionIntensity(0.3 + Math.random() * 0.7) // 0.3-1.0 的强度
        }, streamingTime + 500)
      }, thinkingTime)

      setQuotaRemaining(result.quotaRemaining)

      // 更新伴侣亲密度显示
      if (companion) {
        setCompanion(prev => prev ? {
          ...prev,
          intimacy_level: result.intimacyLevel
        } : null)
      }
    } catch (error: any) {
      console.error('发送消息失败:', error)
      
      // 移除临时用户消息
      setMessages(prev => prev.slice(0, -1))
      setPreparingResponse(false)
      setIsStreaming(false)
      setStreamingMessage('')
      
      if (error.message.includes('配额') || error.message.includes('上限')) {
        alert('今日免费消息已用完，升级Premium享受无限对话！')
      } else if (error.message.includes('内容') || error.message.includes('规范')) {
        alert('消息内容不符合规范，请修改后重试')
      } else {
        alert('发送失败: ' + error.message)
      }
      
      // 恢复消息输入
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <LoadingState type="chat" />
  }

  if (!companion) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.gradient }}
      >
        <div className="text-center">
          <p style={{ color: colors.textSecondary }}>伴侣不存在</p>
          <LoadingButton
            isLoading={false}
            onClick={() => router.push('/')}
            variant="primary"
            className="mt-4"
          >
            返回首页
          </LoadingButton>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className="flex flex-col h-screen"
      style={{ background: colors.gradient }}
    >
      {/* Enhanced Header */}
      <header 
        className="backdrop-blur-md border-b px-4 py-4 flex items-center justify-between shadow-sm"
        style={{ 
          backgroundColor: `${colors.surface}F5`,
          borderColor: colors.border
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await animationManager.animate(
                document.activeElement as HTMLElement,
                'scaleIn',
                { duration: 150 }
              )
              router.push('/')
            }}
            className="p-2 rounded-full hover:opacity-80 transition-all duration-200"
            style={{ color: colors.textSecondary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="relative">
            <EmotionalAvatar 
              companion={companion}
              emotion={currentEmotion}
              size="lg"
            />
            {/* 在线状态指示器 */}
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 shadow-sm"
              style={{ 
                backgroundColor: colors.accent,
                borderColor: colors.surface
              }}
            ></div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h1 
                className="font-semibold text-lg"
                style={{ 
                  color: colors.text,
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: theme.typography.headingWeight
                }}
              >
                {companion.name}
              </h1>
              <EmotionIndicator emotion={currentEmotion} intensity={emotionIntensity} />
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${
                  preparingResponse ? 'animate-pulse' : 
                  isStreaming ? 'animate-pulse' : ''
                }`} style={{ 
                  backgroundColor: preparingResponse ? colors.accent : 
                                 isStreaming ? colors.secondary : 
                                 colors.primary
                }}></span>
                {preparingResponse ? '正在思考...' : 
                 isStreaming ? '正在输入...' : 
                 '在线'}
              </span>
              <span>•</span>
              <span>Lv.{companion.intimacy_level}</span>
              {quotaRemaining !== undefined && (
                <>
                  <span>•</span>
                  <span className={quotaRemaining <= 5 ? 'font-medium' : ''} style={{ 
                    color: quotaRemaining <= 5 ? colors.accent : colors.textSecondary 
                  }}>
                    剩余 {quotaRemaining} 条
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 音效切换按钮 */}
          <button
            onClick={() => setTypingSoundEnabled(!typingSoundEnabled)}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ 
              color: typingSoundEnabled ? colors.primary : colors.textSecondary,
              backgroundColor: typingSoundEnabled ? `${colors.primary}20` : 'transparent'
            }}
            title={typingSoundEnabled ? '关闭打字音效' : '开启打字音效'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {typingSoundEnabled ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 7h4l5-5v20l-5-5H5V7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              )}
            </svg>
          </button>
          
          {/* 通话按钮 */}
          <button 
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ 
              color: colors.textSecondary,
              backgroundColor: `${colors.primary}10`
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          {/* 情感成长按钮 */}
          <button
            onClick={() => setShowEmotionalGrowth(true)}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ 
              color: colors.textSecondary,
              backgroundColor: `${colors.secondary}10`
            }}
            title="查看情感成长"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          
          {/* 设置按钮 */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ 
              color: colors.textSecondary,
              backgroundColor: `${colors.primary}10`
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* 主动关怀消息提示 */}
        {showCarePrompt && careMessages.length > 0 && (
          <div className="fixed top-20 right-4 z-50 max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-pink-200 p-4 relative">
              <button
                onClick={() => setShowCarePrompt(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3 mb-3">
                <EmotionalAvatar 
                  companion={companion}
                  emotion="love"
                  size="sm"
                />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{companion.name} 想对你说</h3>
                  <p className="text-xs text-gray-500">主动关怀消息</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {careMessages.slice(0, 2).map((message, index) => (
                  <div key={message.id} className="bg-pink-50 rounded-xl p-3">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-pink-600 capitalize">
                        {message.type.replace('_', ' ')}
                      </span>
                      <button
                        onClick={async () => {
                          // 发送关怀消息到聊天
                          const careMessage: ChatMessage = {
                            id: `care-${Date.now()}`,
                            user_id: user.id,
                            companion_id: companionId,
                            sender_type: 'companion',
                            content: message.content,
                            message_type: 'text',
                            created_at: new Date().toISOString()
                          }
                          setMessages(prev => [...prev, careMessage])
                          
                          // 记录已发送
                          await ProactiveCareManager.sendCareMessage(user.id, companionId, message)
                          
                          // 移除已发送的消息
                          setCareMessages(prev => prev.filter(m => m.id !== message.id))
                          if (careMessages.length <= 1) {
                            setShowCarePrompt(false)
                          }
                        }}
                        className="text-xs bg-pink-500 text-white px-2 py-1 rounded-full hover:bg-pink-600 transition-colors"
                      >
                        接受
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {careMessages.length > 2 && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  还有 {careMessages.length - 2} 条关怀消息
                </p>
              )}
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">👋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">开始和 {companion.name} 聊天吧！</h3>
            <p className="text-gray-500 text-sm mb-6">她正在等待你的第一条消息 💕</p>
            
            {/* 欢迎消息建议 */}
            <div className="max-w-sm mx-auto">
              <p className="text-xs text-gray-400 mb-3">试试这些开场白：</p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_REPLIES.slice(0, 4).map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-2 bg-white text-gray-600 rounded-xl text-xs hover:bg-pink-50 hover:text-pink-600 transition-all border border-gray-200 hover:border-pink-200 shadow-sm"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {message.sender_type === 'companion' && (
                <EmotionalAvatar 
                  companion={companion}
                  emotion={detectEmotion(message.content)}
                  size="sm"
                />
              )}
              
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative ${
                  message.sender_type === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                {/* 消息内容 */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.sender_type === 'companion' 
                    ? processEmojis(message.content)
                    : message.content
                  }
                </div>
                
                {/* 时间戳 */}
                <p className={`text-xs mt-2 ${
                  message.sender_type === 'user' ? 'text-pink-100' : 'text-gray-400'
                }`}>
                  {formatTime(message.created_at)}
                </p>
                
                {/* 消息状态指示器 */}
                {message.sender_type === 'user' && (
                  <div className="absolute -bottom-1 -right-1">
                    <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              {message.sender_type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white text-sm">👤</span>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* 流式消息显示 */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start items-end gap-2">
            <EmotionalAvatar 
              companion={companion}
              emotion={detectEmotion(streamingMessage)}
              size="sm"
            />
            
            <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-gray-100 text-gray-800 shadow-sm">
              <StreamingMessage 
                content={streamingMessage} 
                isComplete={false} 
                enableSound={typingSoundEnabled}
              />
              <p className="text-xs mt-2 text-gray-400">
                {formatTime(new Date().toISOString())}
              </p>
            </div>
          </div>
        )}
        
        {/* 智能正在输入指示器 */}
        <TypingIndicator 
          companion={companion}
          isVisible={preparingResponse}
          messageLength={streamingMessage.length}
        />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <div 
        className="backdrop-blur-md border-t p-4 shadow-lg"
        style={{ 
          backgroundColor: `${colors.surface}F5`,
          borderColor: colors.border
        }}
      >
        {/* 快捷回复 */}
        <QuickReplies onReplySelect={handleQuickReply} visible={showQuickReplies} />
        
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex items-end gap-3 relative">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`和 ${companion.name} 说点什么...`}
                rows={1}
                className="w-full resize-none rounded-2xl border-2 px-4 py-3 pr-20 focus:outline-none transition-all duration-200 text-sm leading-relaxed shadow-sm"
                style={{ 
                  minHeight: '52px', 
                  maxHeight: '120px',
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              
              {/* 输入工具栏 */}
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {/* 表情按钮 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1 rounded-full hover:opacity-80 transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <span className="text-lg">😊</span>
                  </button>
                  
                  {showEmojiPicker && (
                    <EmojiPicker 
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>
                
                {/* 更多功能按钮 */}
                <button
                  type="button"
                  className="p-1 rounded-full hover:opacity-80 transition-colors"
                  style={{ color: colors.textSecondary }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* 发送按钮 */}
            <LoadingButton
              isLoading={sending}
              onClick={() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
              disabled={!newMessage.trim()}
              variant="primary"
              className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {!sending && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </LoadingButton>
          </div>
          
          {/* 配额提示 */}
          {quotaRemaining !== undefined && quotaRemaining <= 5 && (
            <div className="flex items-center justify-center gap-2 text-xs">
              <span 
                className="px-3 py-1.5 rounded-full"
                style={{ 
                  backgroundColor: quotaRemaining === 0 ? `${colors.accent}20` : `${colors.secondary}20`,
                  color: quotaRemaining === 0 ? colors.accent : colors.secondary
                }}
              >
                今日还可发送 {quotaRemaining} 条消息
              </span>
              {quotaRemaining === 0 && (
                <LoadingButton
                  isLoading={false}
                  onClick={() => router.push('/subscription')}
                  variant="primary"
                  size="sm"
                  className="shadow-sm"
                >
                  升级Premium
                </LoadingButton>
              )}
            </div>
          )}
        </form>
      </div>

      {/* 情感成长面板 */}
      {companion && user && showEmotionalGrowth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">情感成长记录</h2>
              <button
                onClick={() => setShowEmotionalGrowth(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <EmotionalGrowthDisplay
                userId={user.id}
                companionId={companion.id}
                companionName={companion.name}
              />
            </div>
          </div>
        </div>
      )}

      {companion && (
        <CompanionSettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          companion={companion}
          onCompanionUpdated={(next) => setCompanion(next)}
          onChatCleared={() => setMessages([])}
        />
      )}
    </div>
  )
}