'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-types'
import { getCurrentUser, getUserProfile } from '@/lib/auth'

export default function ProfileTestPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    checkUserAndProfile()
  }, [])

  const checkUserAndProfile = async () => {
    try {
      setLoading(true)
      
      // 检查当前用户
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        // 检查用户档案
        const userProfile = await getUserProfile(currentUser.id)
        setProfile(userProfile)
        
        // 如果没有档案，尝试手动创建
        if (!userProfile) {
          await createProfileManually(currentUser)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProfileManually = async (user: any) => {
    try {
      const supabase = createSupabaseClient()
      
      // 生成推荐码
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      
      // 创建档案
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email.split('@')[0],
          referral_code: referralCode,
          language: 'zh'
        })
        .select()
        .single()
      
      if (profileError) throw profileError
      
      // 创建订阅
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          type: 'free',
          daily_message_limit: 20,
          features: ['basic_chat']
        })
      
      if (subError) throw subError
      
      setProfile(profileData)
      setError('')
    } catch (err: any) {
      setError('手动创建档案失败: ' + err.message)
    }
  }

  const signOut = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return <div className="p-6">加载中...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">用户档案测试</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
          <strong>错误:</strong> {error}
        </div>
      )}
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">认证用户</h2>
          {user ? (
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>邮箱:</strong> {user.email}</p>
              <p><strong>创建时间:</strong> {user.created_at}</p>
            </div>
          ) : (
            <p>未登录</p>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">用户档案</h2>
          {profile ? (
            <div>
              <p><strong>用户名:</strong> {profile.username}</p>
              <p><strong>语言:</strong> {profile.language}</p>
              <p><strong>推荐码:</strong> {profile.referral_code}</p>
            </div>
          ) : (
            <p>档案不存在</p>
          )}
        </div>
        
        <div className="space-x-4">
          <button
            onClick={checkUserAndProfile}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            重新检查
          </button>
          
          {user && (
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              退出登录
            </button>
          )}
          
          {!user && (
            <a
              href="/auth"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
            >
              去登录
            </a>
          )}
        </div>
      </div>
    </div>
  )
}