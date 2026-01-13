'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UXOptimizationSummary from '@/components/UXOptimizationSummary'
import PersonalizationCenter from '@/components/PersonalizationCenter'
import SmartPaymentGuidance from '@/components/SmartPaymentGuidance'
import SocialEcosystem from '@/components/SocialEcosystem'
import IntelligentCustomerService from '@/components/IntelligentCustomerService'
import { usePaymentGuidance } from '@/lib/payment-guidance'
import { useAnalytics } from '@/lib/analytics-monitoring'

export default function Home() {
  const [currentUserId] = useState('demo_user_001')
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  
  const { currentTrigger, trackBehavior } = usePaymentGuidance(currentUserId)
  const { trackEvent } = useAnalytics()

  useEffect(() => {
    // 模拟用户进入页面
    trackEvent('page_visit', { page: 'home' })
    trackBehavior('session_start')
    
    // 3秒后隐藏欢迎界面
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // 监听支付引导触发
    if (currentTrigger) {
      setActiveModal('payment')
    }
  }, [currentTrigger])

  const features = [
    {
      id: 'summary',
      title: 'UX优化总览',
      description: '查看系统整体优化状态和性能指标',
      icon: '📊',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'personalization',
      title: '个性化定制',
      description: '打造专属于你的AI伴侣体验',
      icon: '🎯',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'social',
      title: '社交生态',
      description: '与其他用户互动，参与社交游戏',
      icon: '👥',
      color: 'from-pink-500 to-red-600'
    },
    {
      id: 'payment',
      title: '智能升级',
      description: '体验Premium功能，解锁更多可能',
      icon: '💎',
      color: 'from-green-500 to-blue-600'
    },
    {
      id: 'support',
      title: '智能客服',
      description: '24/7智能客服，随时为您解答疑问',
      icon: '🤖',
      color: 'from-orange-500 to-yellow-600'
    }
  ]

  const handleFeatureClick = (featureId: string) => {
    setActiveModal(featureId)
    trackEvent('feature_accessed', { feature: featureId })
    trackBehavior('feature_used', { feature: featureId })
  }

  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center z-50"
    >
      <div className="text-center text-white">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="text-8xl mb-4">✨</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            AI美女伴侣平台
          </h1>
          <p className="text-xl md:text-2xl text-purple-100">
            全新UX优化体验
          </p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center space-x-2 text-purple-100">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span>正在加载优化系统...</span>
          </div>
          
          <div className="w-64 h-2 bg-white bg-opacity-20 rounded-full mx-auto overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )

  const renderMainInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 顶部导航 */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">💝</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI伴侣平台</h1>
                <p className="text-sm text-gray-600">UX优化演示系统</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>系统运行正常</span>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFeatureClick('support')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="客服支持"
              >
                🎧
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            体验全新的AI伴侣平台
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            我们重新设计了整个用户体验，从零门槛体验到智能个性化，
            从社交互动到智能客服，每一个细节都为您精心优化。
          </p>
        </motion.div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFeatureClick(feature.id)}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 cursor-pointer hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl text-white">{feature.icon}</span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {feature.description}
              </p>
              
              <div className="flex items-center text-purple-600 font-medium">
                <span>立即体验</span>
                <span className="ml-2">→</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 系统状态概览 */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">系统优化成果</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: '用户体验提升', value: '85%', icon: '📈' },
              { label: '响应速度优化', value: '60%', icon: '⚡' },
              { label: '转化率提升', value: '45%', icon: '💰' },
              { label: '用户满意度', value: '4.8/5', icon: '⭐' }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* 浮动操作按钮 */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeatureClick('support')}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <span className="text-2xl">🤖</span>
        </motion.button>
      </motion.div>
    </div>
  )

  return (
    <>
      <AnimatePresence>
        {showWelcome && renderWelcomeScreen()}
      </AnimatePresence>
      
      {!showWelcome && renderMainInterface()}

      {/* 模态窗口 */}
      <AnimatePresence>
        {activeModal === 'summary' && (
          <UXOptimizationSummary 
            userId={currentUserId}
          />
        )}
        
        {activeModal === 'personalization' && (
          <PersonalizationCenter
            userId={currentUserId}
            onClose={() => setActiveModal(null)}
          />
        )}
        
        {activeModal === 'payment' && (
          <SmartPaymentGuidance
            userId={currentUserId}
            trigger={currentTrigger}
            onClose={() => setActiveModal(null)}
            onUpgrade={(plan) => {
              console.log('升级到:', plan)
              setActiveModal(null)
            }}
          />
        )}
        
        {activeModal === 'social' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">社交生态系统</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </motion.button>
              </div>
              <div className="overflow-y-auto max-h-[80vh]">
                <SocialEcosystem userId={currentUserId} />
              </div>
            </motion.div>
          </div>
        )}
        
        {activeModal === 'support' && (
          <IntelligentCustomerService
            isOpen={true}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}