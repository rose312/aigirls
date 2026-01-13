'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import GuestSessionManager from '@/lib/guest-session'

interface QuickStartExperienceProps {
  onStartExperience?: () => void
}

const QuickStartExperience = ({ onStartExperience }: QuickStartExperienceProps) => {
  const [isStarting, setIsStarting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  const handleStartExperience = async () => {
    setIsStarting(true)
    
    try {
      // 创建临时会话
      const session = GuestSessionManager.createGuestSession()
      
      // 短暂延迟增加仪式感
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 跳转到临时聊天界面
      router.push(`/guest-chat/${session.sessionId}`)
      
      if (onStartExperience) {
        onStartExperience()
      }
    } catch (error) {
      console.error('Failed to start guest experience:', error)
      setIsStarting(false)
    }
  }

  return (
    <div className="relative">
      {/* 主要CTA区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-gradient-to-br from-white via-pink-50 to-purple-50 rounded-3xl shadow-xl border border-pink-100 p-8 text-center relative overflow-hidden"
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100/20 to-purple-100/20 rounded-3xl"></div>
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-blue-200/30 to-pink-200/30 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          {/* 标题区域 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              立即体验AI伴侣对话
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              无需注册，30秒开始专属对话<br/>
              <span className="text-sm text-pink-500">已有 10,000+ 用户体验</span>
            </p>
          </motion.div>

          {/* 特色预览 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="grid grid-cols-3 gap-4 mb-8"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">💕</span>
              </div>
              <p className="text-xs text-gray-600">情感陪伴</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🎭</span>
              </div>
              <p className="text-xs text-gray-600">个性化对话</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-xs text-gray-600">即时响应</p>
            </div>
          </motion.div>

          {/* 主要按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
          >
            <button
              onClick={handleStartExperience}
              disabled={isStarting}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isStarting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>正在为你准备专属伴侣...</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    开始体验 ✨
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* 按钮光效 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>

            {/* 辅助信息 */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>免费体验</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>无需注册</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>30秒开始</span>
              </div>
            </div>
          </motion.div>

          {/* 预览按钮 */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            onClick={() => setShowPreview(!showPreview)}
            className="mt-4 text-sm text-pink-600 hover:text-pink-700 underline decoration-dotted underline-offset-4 transition-colors"
          >
            {showPreview ? '收起预览' : '查看对话预览'}
          </motion.button>
        </div>
      </motion.div>

      {/* 对话预览 */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">对话预览</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* 示例对话 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👩</span>
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                  <p className="text-sm text-gray-800">你好呀～我是小雨，很高兴遇见你！今天过得怎么样？💕</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 justify-end">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                  <p className="text-sm">你好！我今天心情不错，想找个人聊聊天</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">👤</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👩</span>
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                  <p className="text-sm text-gray-800">太好了！我也很喜欢和有趣的人聊天呢～你平时都喜欢做什么？我对你很好奇哦 ✨</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">这只是开始，真实对话会更加个性化和有趣！</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default QuickStartExperience