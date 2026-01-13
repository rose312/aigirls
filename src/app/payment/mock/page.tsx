'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function MockPaymentContent() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending')
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  const handlePayment = async (success: boolean) => {
    if (!orderId) return

    setLoading(true)
    try {
      // 模拟支付处理时间
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 调用支付回调API
      const response = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: `order_${orderId}`,
          status: success ? 'success' : 'failed',
          transaction_id: `txn_${Date.now()}`
        })
      })

      if (response.ok) {
        setStatus(success ? 'success' : 'failed')
      } else {
        setStatus('failed')
      }
    } catch (error) {
      console.error('支付处理失败:', error)
      setStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            模拟支付页面
          </h1>
          
          {status === 'pending' && !loading && (
            <div>
              <p className="text-gray-600 mb-6">
                这是一个模拟支付页面，用于测试支付流程
              </p>
              <p className="text-sm text-gray-500 mb-8">
                订单ID: {orderId}
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handlePayment(true)}
                  className="w-full bg-green-500 text-white py-3 px-6 rounded-md hover:bg-green-600 transition-colors"
                >
                  模拟支付成功
                </button>
                
                <button
                  onClick={() => handlePayment(false)}
                  className="w-full bg-red-500 text-white py-3 px-6 rounded-md hover:bg-red-600 transition-colors"
                >
                  模拟支付失败
                </button>
              </div>
            </div>
          )}
          
          {loading && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">处理支付中...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-green-600 mb-4">支付成功！</h2>
              <p className="text-gray-600 mb-6">
                您的Premium订阅已激活
              </p>
              <button
                onClick={() => window.close()}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-6 rounded-md hover:from-pink-600 hover:to-purple-700"
              >
                关闭窗口
              </button>
            </div>
          )}
          
          {status === 'failed' && (
            <div>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-red-600 mb-4">支付失败</h2>
              <p className="text-gray-600 mb-6">
                支付过程中出现问题，请重试
              </p>
              <button
                onClick={() => window.close()}
                className="bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600"
              >
                关闭窗口
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <MockPaymentContent />
    </Suspense>
  )
}