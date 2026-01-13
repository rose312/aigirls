'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createSupabaseClient } from '@/lib/supabase-types'
import type { Subscription } from '@/lib/supabase-types'

export default function SubscriptionPage() {
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth')
        return
      }
      
      setUser(currentUser)
      await loadSubscription(currentUser.id)
    } catch (error) {
      console.error('认证检查失败:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscription = async (userId: string) => {
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      const response = await fetch('/api/subscription', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setSubscription(result.subscription)
      }
    } catch (error) {
      console.error('加载订阅信息失败:', error)
    }
  }

  const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
    if (!user || upgrading) return

    setUpgrading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('请重新登录')
        return
      }

      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan,
          payment_method: 'alipay' // 默认支付宝
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        // 跳转到支付页面（这里是模拟支付）
        window.open(result.payment_info.payment_url, '_blank')
        
        // 实际应用中应该跳转到真实的支付页面
        alert(`订单创建成功！\n订单号: ${result.order.external_order_id}\n金额: ¥${result.payment_info.amount}`)
      } else {
        alert('创建订单失败: ' + result.error)
      }
    } catch (error: any) {
      alert('升级失败: ' + error.message)
    } finally {
      setUpgrading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回首页
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            订阅管理
          </h1>
          <div></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 当前订阅状态 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">当前订阅</h2>
          
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">订阅类型:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscription.type === 'premium' 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {subscription.type === 'premium' ? 'Premium会员' : '免费用户'}
                </span>
              </div>
              
              {subscription.type === 'premium' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">订阅计划:</span>
                    <span>{subscription.plan === 'monthly' ? '月度订阅' : '年度订阅'}</span>
                  </div>
                  
                  {subscription.end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">到期时间:</span>
                      <span className={isExpired(subscription.end_date) ? 'text-red-600' : 'text-green-600'}>
                        {formatDate(subscription.end_date)}
                        {isExpired(subscription.end_date) && ' (已过期)'}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">每日消息限制:</span>
                <span>{subscription.daily_message_limit === -1 ? '无限制' : `${subscription.daily_message_limit}条`}</span>
              </div>
              
              {subscription.features && subscription.features.length > 0 && (
                <div>
                  <span className="text-gray-600">会员特权:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subscription.features.map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-sm">
                        {feature === 'unlimited_chat' && '无限对话'}
                        {feature === 'voice_messages' && '语音消息'}
                        {feature === 'exclusive_content' && '专属内容'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">加载订阅信息中...</p>
          )}
        </div>

        {/* 升级选项 */}
        {subscription?.type !== 'premium' || (subscription.end_date && isExpired(subscription.end_date)) ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">升级到Premium</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* 月度订阅 */}
              <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-colors">
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">月度订阅</h3>
                  <div className="text-3xl font-bold text-pink-600 mb-4">
                    ¥39<span className="text-lg text-gray-600">/月</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li>✓ 无限对话次数</li>
                    <li>✓ 语音消息功能</li>
                    <li>✓ 专属伴侣内容</li>
                    <li>✓ 优先客服支持</li>
                  </ul>
                  <button
                    onClick={() => handleUpgrade('monthly')}
                    disabled={upgrading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? '处理中...' : '选择月度'}
                  </button>
                </div>
              </div>

              {/* 年度订阅 */}
              <div className="border-2 border-pink-500 rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    推荐
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-2">年度订阅</h3>
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    ¥299<span className="text-lg text-gray-600">/年</span>
                  </div>
                  <div className="text-sm text-green-600 mb-4">
                    节省 ¥169 (相当于 ¥25/月)
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 mb-6">
                    <li>✓ 无限对话次数</li>
                    <li>✓ 语音消息功能</li>
                    <li>✓ 专属伴侣内容</li>
                    <li>✓ 优先客服支持</li>
                    <li>✓ 年度专属福利</li>
                  </ul>
                  <button
                    onClick={() => handleUpgrade('yearly')}
                    disabled={upgrading}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {upgrading ? '处理中...' : '选择年度'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>支持支付宝、微信支付</p>
              <p>订阅后立即生效，可随时取消</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">您已是Premium会员</h2>
            <p className="text-gray-600">享受无限对话和专属功能</p>
          </div>
        )}
      </div>
    </div>
  )
}