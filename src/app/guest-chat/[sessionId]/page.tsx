'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import GuestSessionManager, { type GuestSession, type GuestMessage } from '@/lib/guest-session'

// 简化的AI回复生成（实际应该调用AI服务）
const generateAIResponse = async (message: string, companion: any, history: GuestMessage[]): Promise<string> => {
  // 模拟AI思考时间
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const responses = {
    gentle: [
      '我能理解你的感受呢～',
      '听起来很有趣，能告诉我更多吗？',
      '你真的很棒呢！💕',
      '我觉得你说得很有道理～',
      '谢谢你愿意和我分享这些'
    ],
    lively: [
      '哇！这听起来超棒的！✨',
      '我也想试试呢！',
      '你真的很有意思！',
      '这让我想到了...',
      '我们聊得好开心啊！'
    ],
    intellectual: [
      '这是一个很深刻的观点',
      '从另一个角度来看...',
      '你的想法很有启发性',
      '这让我思考了很多',
      '我们可以深入探讨一下'
    ]
  }
  
  const personalityResponses = responses[companion.personality] || responses.gentle
  return personalityResponses[Math.floor(Math.random() * personalityResponses.length)]
}

export default function GuestChatPage() {
  const [session, setSession] = useState<GuestSession | null>(null)
  const [messages, setMessages] = useState<GuestMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showConversionPrompt, setShowConversionPrompt] = useState(false)
  const [conversionMessage, setConversionMessage] = useState('')
  const [sessionStats, setSessionStats] = useState<any>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string

  useEffect(() => {
    initializeGuestChat()
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [newMessage])

  const initializeGuestChat = () => {
    const currentSession = GuestSessionManager.getCurrentSession()
    
    if (!currentSession || currentSession.sessionId !== sessionId) {
      // 会话不存在或已过期，重定向到首页
      router.push('/')
      return
    }

    setSession(currentSession)
    setMessages(currentSession.conversationHistory)
    setSessionStats(GuestSessionManager.getSessionStats(currentSession))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isTyping || !session) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    // 添加用户消息
    const updatedSession = GuestSessionManager.addMessage(messageContent, 'user')
    if (!updatedSession) return

    setSession(updatedSession)
    setMessages(updatedSession.conversationHistory)
    setSessionStats(GuestSessionManager.getSessionStats(updatedSession))

    // 检查是否需要显示转化提示
    if (GuestSessionManager.shouldShowConversionPrompt(updatedSession)) {
      const prompt = GuestSessionManager.getNextConversionPrompt(updatedSession)
      if (prompt) {
        setConversionMessage(prompt)
        setShowConversionPrompt(true)
      }
    }

    // 生成AI回复
    setIsTyping(true)
    try {
      const aiResponse = await generateAIResponse(
        messageContent, 
        session.temporaryCompanion, 
        updatedSession.conversationHistory
      )

      const finalSession = GuestSessionManager.addMessage(aiResponse, 'companion')
      if (finalSession) {
        setSession(finalSession)
        setMessages(finalSession.conversationHistory)
      }
    } catch (error) {
      console.error('Failed to generate AI response:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleRegisterNow = () => {
    // 保存当前会话状态，然后跳转到注册页面
    router.push('/auth?from=guest&action=register')
  }

  const handleContinueChat = () => {
    setShowConversionPrompt(false)
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* 临时体验头部 */}
      <header className="bg-white/95 backdrop-blur-md border-b border-pink-100 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center shadow-md">
                <span className="text-lg">👩</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            
            <div>
              <h1 className="font-semibold text-gray-800">{session.temporaryCompanion.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                  体验模式
                </span>
                <span>•</span>
                <span>{sessionStats?.messageCount || 0} 条对话</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRegisterNow}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
          >
            创建专属伴侣
          </button>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {/* 欢迎提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">
            欢迎体验AI伴侣对话！
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            这是 {session.temporaryCompanion.name}，{session.temporaryCompanion.backstory}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {session.temporaryCompanion.traits.map((trait, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs"
              >
                {trait}
              </span>
            ))}
          </div>
        </motion.div>

        {/* 对话消息 */}
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
          >
            {message.sender === 'companion' && (
              <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-sm">👩</span>
              </div>
            )}
            
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm relative ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
              <p className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-pink-100' : 'text-gray-400'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
            
            {message.sender === 'user' && (
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm">👤</span>
              </div>
            )}
          </motion.div>
        ))}

        {/* 正在输入指示器 */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start items-end gap-2"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-sm">👩</span>
            </div>
            <div className="bg-white border border-gray-100 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-white/95 backdrop-blur-md border-t border-pink-100 p-4 shadow-lg">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex items-end gap-3 relative">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`和 ${session.temporaryCompanion.name} 说点什么...`}
                rows={1}
                className="w-full resize-none rounded-2xl border-2 border-gray-200 px-4 py-3 pr-16 focus:border-pink-400 focus:outline-none transition-all duration-200 text-sm leading-relaxed placeholder-gray-400 shadow-sm"
                style={{ minHeight: '52px', maxHeight: '120px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
            </div>
            
            <button
              type="submit"
              disabled={!newMessage.trim() || isTyping}
              className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isTyping ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          
          {/* 体验提示 */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              体验模式 • 已对话 {sessionStats?.messageCount || 0} 轮 • 
              <button
                onClick={handleRegisterNow}
                className="text-pink-600 hover:text-pink-700 ml-1 underline"
              >
                注册解锁完整功能
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* 转化提示弹窗 */}
      <AnimatePresence>
        {showConversionPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💕</span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  {session.temporaryCompanion.name} 想对你说
                </h3>
                
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {conversionMessage}
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleRegisterNow}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-2xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    创建专属伴侣 ✨
                  </button>
                  
                  <button
                    onClick={handleContinueChat}
                    className="w-full text-gray-600 py-2 px-6 rounded-2xl hover:bg-gray-50 transition-all"
                  >
                    继续体验
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}