'use client'

import { useState, useEffect } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { getUserQuota, type UserQuota } from '@/lib/quota-service'

export default function QuotaDisplay() {
  const [quota, setQuota] = useState<UserQuota | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuota()
  }, [])

  const loadQuota = async () => {
    try {
      const user = await getCurrentUser()
      if (user) {
        const userQuota = await getUserQuota(user.id)
        setQuota(userQuota)
      }
    } catch (error) {
      console.error('加载配额失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-400">--</div>
        <div className="text-sm text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!quota) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-400">--</div>
        <div className="text-sm text-gray-600">配额信息</div>
      </div>
    )
  }

  const remaining = quota.isUnlimited ? -1 : quota.dailyLimit - quota.messageCount
  const percentage = quota.isUnlimited ? 100 : (remaining / quota.dailyLimit) * 100

  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${
        quota.isUnlimited ? 'text-purple-600' : 
        remaining > 10 ? 'text-green-600' :
        remaining > 5 ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {quota.isUnlimited ? '∞' : remaining}
      </div>
      <div className="text-sm text-gray-600">
        {quota.isUnlimited ? '无限对话' : '今日剩余对话'}
      </div>
      
      {!quota.isUnlimited && (
        <div className="w-16 bg-gray-200 rounded-full h-1 mt-1 mx-auto">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              percentage > 50 ? 'bg-green-500' :
              percentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.max(0, percentage)}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}