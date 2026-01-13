'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCustomerService } from '@/lib/intelligent-customer-service'

interface IntelligentCustomerServiceProps {
  isOpen: boolean
  onClose: () => void
}

export default function IntelligentCustomerService({ 
  isOpen, 
  onClose 
}: IntelligentCustomerServiceProps) {
  const [currentView, setCurrentView] = useState<'chat' | 'faq' | 'contact'>('chat')
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showSatisfactionRating, setShowSatisfactionRating] = useState(false)
  const [currentQueryId, setCurrentQueryId] = useState<string | null>(null)
  
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { 
    chatHistory, 
    sendMessage, 
    rateSatisfaction, 
    getFrequentQuestions 
  } = useCustomerService()

  const frequentQuestions = getFrequentQuestions()

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const message = inputMessage.trim()
    setInputMessage('')
    setIsTyping(true)

    try {
      const result = await sendMessage(message)
      setCurrentQueryId(result.queryId)
      
      // 如果需要人工客服，显示满意度评分
      if (result.needsHuman) {
        setTimeout(() => {
          setShowSatisfactionRating(true)
        }, 2000)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickQuestion = async (question: string) => {
    setInputMessage(question)
    await handleSendMessage()
  }

  const handleSatisfactionRating = (rating: number) => {
    if (currentQueryId) {
      rateSatisfaction(rating)
      setShowSatisfactionRating(false)
      setCurrentQueryId(null)
    }
  }

  const renderChatView = () => (
    <div className="flex flex-col h-full">
      {/* 聊天头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-bold">智能客服小助手</h3>
            <div className="flex items-center space-x-1 text-sm text-blue-100">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>在线服务中</span>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天内容 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4"
        style={{ maxHeight: '400px' }}
      >
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">👋</div>
            <h4 className="font-bold text-gray-900 mb-2">欢迎使用智能客服</h4>
            <p className="text-gray-600 mb-4">我是您的专属客服助手，有什么可以帮助您的吗？</p>
            
            {/* 快捷问题 */}
            <div className="space-y-2">
              <p className="text-sm text-gray-500">常见问题：</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  '如何创建AI伴侣？',
                  '免费用户有什么限制？',
                  '如何升级Premium？',
                  '支付失败怎么办？'
                ].map((question, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickQuestion(question)}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {chatHistory.map((chat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex ${chat.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              chat.isUser 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <p className="text-sm">{chat.message}</p>
              {!chat.isUser && chat.confidence && (
                <div className="mt-2 text-xs text-gray-500">
                  置信度: {(chat.confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* 满意度评分 */}
      <AnimatePresence>
        {showSatisfactionRating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 border-t border-yellow-200 p-4"
          >
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">请为本次服务评分：</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <motion.button
                    key={rating}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSatisfactionRating(rating)}
                    className="text-2xl hover:text-yellow-500 transition-colors"
                  >
                    ⭐
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入您的问题..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`px-4 py-2 rounded-lg transition-colors ${
              inputMessage.trim() && !isTyping
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            发送
          </motion.button>
        </div>
      </div>
    </div>
  )

  const renderFAQView = () => (
    <div className="p-4 space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">❓</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">常见问题</h3>
        <p className="text-gray-600">快速找到您需要的答案</p>
      </div>

      <div className="space-y-3">
        {frequentQuestions.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
              <div className="ml-4 text-right">
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {faq.category}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  使用 {faq.usage_count} 次
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center pt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentView('chat')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          没找到答案？联系客服
        </motion.button>
      </div>
    </div>
  )

  const renderContactView = () => (
    <div className="p-4 space-y-6">
      <div className="text-center py-4">
        <div className="text-4xl mb-2">📞</div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">联系我们</h3>
        <p className="text-gray-600">多种方式联系我们的客服团队</p>
      </div>

      <div className="space-y-4">
        {[
          {
            icon: '💬',
            title: '在线客服',
            description: '7x24小时在线服务',
            action: '立即咨询',
            onClick: () => setCurrentView('chat')
          },
          {
            icon: '📧',
            title: '邮件支持',
            description: 'support@aicompanion.com',
            action: '发送邮件',
            onClick: () => window.open('mailto:support@aicompanion.com')
          },
          {
            icon: '📱',
            title: '微信客服',
            description: '扫码添加客服微信',
            action: '查看二维码',
            onClick: () => {}
          },
          {
            icon: '📋',
            title: '意见反馈',
            description: '帮助我们改进产品',
            action: '提交反馈',
            onClick: () => {}
          }
        ].map((contact, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{contact.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{contact.title}</h4>
                  <p className="text-sm text-gray-600">{contact.description}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={contact.onClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                {contact.action}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div>
            <h4 className="font-medium text-blue-900">服务时间</h4>
            <div className="text-sm text-blue-700 mt-1">
              • 在线客服：7x24小时<br/>
              • 邮件支持：工作日内24小时回复<br/>
              • 微信客服：工作日 9:00-18:00
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
      >
        {/* 导航标签 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex">
            {[
              { id: 'chat', name: '智能客服', icon: '🤖' },
              { id: 'faq', name: '常见问题', icon: '❓' },
              { id: 'contact', name: '联系我们', icon: '📞' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentView(tab.id as any)}
                className={`flex-1 p-3 text-center transition-all ${
                  currentView === tab.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>{tab.icon}</span>
                  <span className="text-sm font-medium">{tab.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="relative" style={{ height: '500px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 overflow-y-auto"
            >
              {currentView === 'chat' && renderChatView()}
              {currentView === 'faq' && renderFAQView()}
              {currentView === 'contact' && renderContactView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 关闭按钮 */}
        <div className="absolute top-4 right-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <span className="text-gray-600">✕</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}