'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentGuidance } from '@/lib/payment-guidance'

interface SmartPaymentGuidanceProps {
  userId: string
  trigger?: any
  onClose?: () => void
  onUpgrade?: (plan: string) => void
}

export default function SmartPaymentGuidance({ 
  userId, 
  trigger, 
  onClose, 
  onUpgrade 
}: SmartPaymentGuidanceProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [showComparison, setShowComparison] = useState(false)
  
  const { recommendation, conversionProbability, trackBehavior } = usePaymentGuidance(userId)

  const plans = [
    {
      id: 'basic_trial',
      name: '体验版',
      price: '免费',
      originalPrice: null,
      duration: '7天',
      features: [
        '7天免费试用',
        '体验所有功能',
        '20条/日消息限制',
        '基础AI模型'
      ],
      highlight: false,
      badge: '免费试用'
    },
    {
      id: 'premium_monthly',
      name: 'Premium月度',
      price: '29.9',
      originalPrice: '39.9',
      duration: '月',
      features: [
        '无限制对话',
        '高级AI模型',
        '个性化定制',
        '优先客服支持',
        '高级表情包',
        '专属头像框'
      ],
      highlight: true,
      badge: '最受欢迎'
    },
    {
      id: 'premium_annual',
      name: 'Premium年度',
      price: '199',
      originalPrice: '359',
      duration: '年',
      features: [
        '包含月度所有功能',
        '专属定制伴侣',
        '无限云端存储',
        '专属客服经理',
        '新功能优先体验',
        '年度专属礼品'
      ],
      highlight: false,
      badge: '超值优惠'
    }
  ]

  const paymentMethods = [
    { id: 'wechat', name: '微信支付', icon: '💚', popular: true },
    { id: 'alipay', name: '支付宝', icon: '🔵', popular: true },
    { id: 'unionpay', name: '银联支付', icon: '🏦', popular: false },
    { id: 'apple_pay', name: 'Apple Pay', icon: '🍎', popular: false }
  ]

  const steps = [
    { id: 'intro', name: '功能介绍', icon: '✨' },
    { id: 'plans', name: '选择套餐', icon: '📋' },
    { id: 'payment', name: '支付方式', icon: '💳' },
    { id: 'confirm', name: '确认订单', icon: '✅' }
  ]

  useEffect(() => {
    if (trigger) {
      trackBehavior('payment_guidance_shown', { triggerId: trigger.id })
    }
  }, [trigger])

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
    trackBehavior('plan_selected', { planId })
  }

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      trackBehavior('payment_step_advanced', { step: currentStep + 1 })
    }
  }

  const handleUpgrade = () => {
    if (selectedPlan && onUpgrade) {
      onUpgrade(selectedPlan)
      trackBehavior('upgrade_initiated', { planId: selectedPlan })
    }
  }

  const getRecommendedPlan = () => {
    if (conversionProbability > 80) return 'premium_annual'
    if (conversionProbability > 50) return 'premium_monthly'
    return 'basic_trial'
  }

  const renderIntroStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl text-white">✨</span>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {trigger?.message || '解锁更多精彩功能'}
        </h3>
        <p className="text-gray-600">
          升级Premium，享受无限制的AI伴侣体验
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {[
          { icon: '💬', title: '无限对话', desc: '不再受消息限制' },
          { icon: '🎨', title: '个性定制', desc: '专属伴侣形象' },
          { icon: '🧠', title: '高级AI', desc: '更智能的对话' },
          { icon: '⚡', title: '优先支持', desc: '专属客服服务' }
        ].map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-gray-50 rounded-lg"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <div className="font-medium text-gray-900">{feature.title}</div>
            <div className="text-sm text-gray-600">{feature.desc}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-purple-600">🎯</span>
          <span className="text-sm text-purple-800">
            基于您的使用习惯，转化概率: {conversionProbability}%
          </span>
        </div>
      </div>
    </motion.div>
  )

  const renderPlansStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">选择适合您的套餐</h3>
        <p className="text-gray-600">根据您的需求选择最合适的方案</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handlePlanSelect(plan.id)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? 'border-purple-500 bg-purple-50'
                : plan.highlight
                ? 'border-purple-300 bg-white shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${plan.id === getRecommendedPlan() ? 'ring-2 ring-green-400' : ''}`}
          >
            {plan.badge && (
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium ${
                plan.highlight ? 'bg-purple-600 text-white' : 'bg-green-500 text-white'
              }`}>
                {plan.badge}
              </div>
            )}

            {plan.id === getRecommendedPlan() && (
              <div className="absolute -top-3 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                推荐
              </div>
            )}

            <div className="text-center">
              <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
              <div className="mt-2">
                {plan.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">¥{plan.originalPrice}</span>
                )}
                <div className="text-2xl font-bold text-gray-900">
                  {plan.price === '免费' ? plan.price : `¥${plan.price}`}
                  {plan.price !== '免费' && (
                    <span className="text-sm text-gray-600">/{plan.duration}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {selectedPlan === plan.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-sm">✓</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          {showComparison ? '隐藏' : '查看'}详细功能对比
        </button>
      </div>

      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 rounded-lg p-4 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">功能</th>
                    <th className="text-center py-2">体验版</th>
                    <th className="text-center py-2">Premium月度</th>
                    <th className="text-center py-2">Premium年度</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: '每日消息', trial: '20条', monthly: '无限制', annual: '无限制' },
                    { feature: 'AI模型', trial: '基础版', monthly: '高级版', annual: '顶级版' },
                    { feature: '个性化', trial: '基础', monthly: '完整', annual: '专属定制' },
                    { feature: '客服支持', trial: '社区', monthly: '优先', annual: '专属经理' }
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{row.feature}</td>
                      <td className="py-2 text-center text-gray-600">{row.trial}</td>
                      <td className="py-2 text-center text-green-600">{row.monthly}</td>
                      <td className="py-2 text-center text-purple-600">{row.annual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  const renderPaymentStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">选择支付方式</h3>
        <p className="text-gray-600">安全便捷的支付体验</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <motion.button
            key={method.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-all"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{method.icon}</span>
              <div className="text-left">
                <div className="font-medium text-gray-900">{method.name}</div>
                {method.popular && (
                  <div className="text-xs text-green-600">推荐</div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-blue-600 mt-1">🔒</span>
          <div>
            <div className="font-medium text-blue-900">安全保障</div>
            <div className="text-sm text-blue-700 mt-1">
              • 银行级SSL加密保护<br/>
              • 不存储任何支付信息<br/>
              • 支持7天无理由退款
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderConfirmStep = () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan)
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">确认订单</h3>
          <p className="text-gray-600">请确认您的订单信息</p>
        </div>

        {selectedPlanData && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-900">{selectedPlanData.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedPlanData.duration === '年' ? '12个月订阅' : 
                   selectedPlanData.duration === '月' ? '1个月订阅' : '7天试用'}
                </p>
              </div>
              <div className="text-right">
                {selectedPlanData.originalPrice && (
                  <div className="text-sm text-gray-500 line-through">
                    ¥{selectedPlanData.originalPrice}
                  </div>
                )}
                <div className="text-xl font-bold text-gray-900">
                  {selectedPlanData.price === '免费' ? '免费' : `¥${selectedPlanData.price}`}
                </div>
              </div>
            </div>

            {selectedPlanData.originalPrice && selectedPlanData.price !== '免费' && (
              <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🎉</span>
                  <span className="text-sm text-green-800 font-medium">
                    限时优惠，节省 ¥{parseFloat(selectedPlanData.originalPrice) - parseFloat(selectedPlanData.price)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {selectedPlanData?.price === '免费' ? '开始免费试用' : '立即支付'}
          </motion.button>
        </div>

        <div className="text-center text-xs text-gray-500">
          点击支付即表示您同意我们的服务条款和隐私政策
        </div>
      </motion.div>
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        >
          {/* 头部进度条 */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">升级Premium</h2>
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  ✕
                </motion.button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep ? 'bg-white text-purple-600' : 'bg-purple-500 text-white'
                  }`}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-2 ${
                      index < currentStep ? 'bg-white' : 'bg-purple-500'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {currentStep === 0 && renderIntroStep()}
              {currentStep === 1 && renderPlansStep()}
              {currentStep === 2 && renderPaymentStep()}
              {currentStep === 3 && renderConfirmStep()}
            </AnimatePresence>
          </div>

          {/* 底部操作栏 */}
          <div className="bg-gray-50 border-t border-gray-200 p-4">
            <div className="flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 0}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  currentStep === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                上一步
              </motion.button>
              
              {currentStep < steps.length - 1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextStep}
                  disabled={currentStep === 1 && !selectedPlan}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    (currentStep === 1 && !selectedPlan)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  下一步
                </motion.button>
              ) : (
                <div className="text-sm text-gray-500">
                  准备完成订单
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}