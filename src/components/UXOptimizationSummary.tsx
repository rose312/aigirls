'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnalytics } from '@/lib/analytics-monitoring'
import { usePersonalization } from '@/lib/personalization-center'
import { useSocialEcosystem } from '@/lib/social-ecosystem'
import { usePaymentGuidance } from '@/lib/payment-guidance'
import { useCustomerService } from '@/lib/intelligent-customer-service'

interface UXOptimizationSummaryProps {
  userId: string
}

export default function UXOptimizationSummary({ userId }: UXOptimizationSummaryProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  // 集成所有系统的数据
  const { dashboardData, trackEvent } = useAnalytics()
  const { profile: personalizationProfile, recommendations } = usePersonalization(userId)
  const { profile: socialProfile, feed, activeGames } = useSocialEcosystem(userId)
  const { recommendation: paymentRecommendation, conversionProbability } = usePaymentGuidance(userId)
  const { chatHistory, getFrequentQuestions } = useCustomerService()

  useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const tabs = [
    { id: 'overview', name: '总览', icon: '📊' },
    { id: 'personalization', name: '个性化', icon: '🎯' },
    { id: 'social', name: '社交', icon: '👥' },
    { id: 'payment', name: '转化', icon: '💰' },
    { id: 'support', name: '客服', icon: '🎧' },
    { id: 'analytics', name: '分析', icon: '📈' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 头部导航 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              UX优化系统总览
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">系统运行正常</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab 
                dashboardData={dashboardData}
                socialProfile={socialProfile}
                conversionProbability={conversionProbability}
              />
            )}
            {activeTab === 'personalization' && (
              <PersonalizationTab 
                profile={personalizationProfile}
                recommendations={recommendations}
              />
            )}
            {activeTab === 'social' && (
              <SocialTab 
                profile={socialProfile}
                feed={feed}
                activeGames={activeGames}
              />
            )}
            {activeTab === 'payment' && (
              <PaymentTab 
                recommendation={paymentRecommendation}
                conversionProbability={conversionProbability}
              />
            )}
            {activeTab === 'support' && (
              <SupportTab 
                chatHistory={chatHistory}
                frequentQuestions={getFrequentQuestions()}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsTab 
                dashboardData={dashboardData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// 总览标签页
function OverviewTab({ dashboardData, socialProfile, conversionProbability }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 用户活跃度 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">活跃用户</p>
            <p className="text-2xl font-bold text-gray-900">
              {dashboardData?.activeUsers || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-green-600">
            <span>↗️ +12% 较昨日</span>
          </div>
        </div>
      </motion.div>

      {/* 转化率 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">转化率</p>
            <p className="text-2xl font-bold text-gray-900">
              {((dashboardData?.conversionRate || 0) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">💰</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${conversionProbability || 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">转化概率: {conversionProbability || 0}%</p>
        </div>
      </motion.div>

      {/* 用户等级 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">用户等级</p>
            <p className="text-2xl font-bold text-gray-900">
              Lv.{socialProfile?.level || 1}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((socialProfile?.experience || 0) % 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">经验值: {socialProfile?.experience || 0}</p>
        </div>
      </motion.div>

      {/* 系统状态 */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 md:col-span-2 lg:col-span-3"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统功能状态</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: '零门槛体验', status: 'active', icon: '🚀' },
            { name: '智能推荐', status: 'active', icon: '🎯' },
            { name: '情感成长', status: 'active', icon: '💝' },
            { name: '社交生态', status: 'active', icon: '🌟' },
            { name: '支付引导', status: 'active', icon: '💳' },
            { name: '智能客服', status: 'active', icon: '🤖' },
            { name: '性能监控', status: 'active', icon: '📊' },
            { name: 'A/B测试', status: 'active', icon: '🧪' }
          ].map((feature, index) => (
            <div key={index} className="flex items-center space-x-3">
              <span className="text-2xl">{feature.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{feature.name}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-600">运行中</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// 个性化标签页
function PersonalizationTab({ profile, recommendations }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">个性化偏好</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">伴侣偏好</h4>
            <div className="space-y-2">
              {profile?.preferences?.filter((p: any) => p.category === 'companion').map((pref: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{pref.key}</span>
                  <span className="text-sm font-medium text-gray-900">{pref.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">界面偏好</h4>
            <div className="space-y-2">
              {profile?.preferences?.filter((p: any) => p.category === 'interface').map((pref: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{pref.key}</span>
                  <span className="text-sm font-medium text-gray-900">{pref.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">智能推荐</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations?.companions?.map((rec: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">{rec.type}</h4>
              <p className="text-sm text-gray-600 mt-1">{rec.reason}</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full"
                    style={{ width: `${rec.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">置信度: {(rec.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 社交标签页
function SocialTab({ profile, feed, activeGames }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">社交档案</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">👤</span>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{profile?.username || '用户'}</h4>
            <p className="text-sm text-gray-600">等级 {profile?.level || 1} • 经验值 {profile?.experience || 0}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">👥 {profile?.socialStats?.friendsCount || 0} 好友</span>
              <span className="text-sm text-gray-500">❤️ {profile?.socialStats?.likesReceived || 0} 获赞</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">徽章收集</h3>
          <div className="grid grid-cols-3 gap-3">
            {profile?.badges?.map((badge: any, index: number) => (
              <div key={index} className="text-center p-3 border border-gray-200 rounded-lg">
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-xs font-medium text-gray-900 mt-1">{badge.name}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">活跃游戏</h3>
          <div className="space-y-3">
            {activeGames?.slice(0, 3).map((game: any, index: number) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900">{game.name}</h4>
                <p className="text-sm text-gray-600">{game.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{game.participants?.length || 0} 参与者</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {game.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 支付标签页
function PaymentTab({ recommendation, conversionProbability }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">转化分析</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">转化概率</h4>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${conversionProbability || 0}%` }}
                />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                {conversionProbability || 0}%
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">推荐套餐</h4>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h5 className="font-medium text-gray-900">{recommendation?.plan || 'Premium月度'}</h5>
              <p className="text-sm text-gray-600 mt-1">{recommendation?.urgency || '限时优惠'}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-green-600">
                  -{recommendation?.discount || 20}%
                </span>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors">
                  立即升级
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">功能对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">功能</th>
                <th className="text-center py-2">免费版</th>
                <th className="text-center py-2">Premium</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              {[
                { feature: '每日消息数量', free: '20条', premium: '无限制' },
                { feature: 'AI模型', free: '基础版', premium: '高级版' },
                { feature: '个性化定制', free: '基础', premium: '完整' },
                { feature: '客服支持', free: '社区', premium: '专属' }
              ].map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 text-gray-900">{item.feature}</td>
                  <td className="py-2 text-center text-gray-600">{item.free}</td>
                  <td className="py-2 text-center text-green-600 font-medium">{item.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// 客服标签页
function SupportTab({ chatHistory, frequentQuestions }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">智能客服</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">服务状态</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">响应时间</span>
                <span className="text-sm font-medium text-green-600">&lt; 1秒</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">解决率</span>
                <span className="text-sm font-medium text-green-600">95%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">满意度</span>
                <span className="text-sm font-medium text-green-600">4.8/5.0</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">最近对话</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {chatHistory?.slice(-3).map((chat: any, index: number) => (
                <div key={index} className={`p-2 rounded text-sm ${
                  chat.isUser ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-900'
                }`}>
                  {chat.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">常见问题</h3>
        <div className="space-y-3">
          {frequentQuestions?.slice(0, 5).map((faq: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900">{faq.question}</h4>
              <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">使用次数: {faq.usage_count}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {faq.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 分析标签页
function AnalyticsTab({ dashboardData }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: '活跃用户', value: dashboardData?.activeUsers || 0, icon: '👥', color: 'blue' },
          { name: '转化率', value: `${((dashboardData?.conversionRate || 0) * 100).toFixed(1)}%`, icon: '📈', color: 'green' },
          { name: '会话时长', value: '8.5分钟', icon: '⏱️', color: 'purple' },
          { name: '满意度', value: '4.8/5.0', icon: '⭐', color: 'yellow' }
        ].map((metric, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${metric.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{metric.icon}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门事件</h3>
        <div className="space-y-3">
          {dashboardData?.topEvents?.map((event: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm font-medium text-gray-900">{event.event}</span>
              <span className="text-sm text-gray-600">{event.count} 次</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系统健康度</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: '性能告警', value: dashboardData?.performanceAlerts || 0, status: 'good' },
            { name: 'A/B测试', value: dashboardData?.abTestsRunning || 0, status: 'active' },
            { name: '系统负载', value: '23%', status: 'good' }
          ].map((health, index) => (
            <div key={index} className="text-center">
              <p className="text-sm font-medium text-gray-600">{health.name}</p>
              <p className="text-xl font-bold text-gray-900">{health.value}</p>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                health.status === 'good' ? 'bg-green-100 text-green-800' :
                health.status === 'active' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {health.status === 'good' ? '正常' : health.status === 'active' ? '运行中' : '异常'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}