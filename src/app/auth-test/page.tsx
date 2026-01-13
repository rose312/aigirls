'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase-types'

export default function AuthTestPage() {
  const [session, setSession] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createSupabaseClient()
      
      // 获取当前会话
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      setSession(session)
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        return
      }
      
      // 获取用户信息
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      setUser(user)
      
      if (userError) {
        console.error('User error:', userError)
        return
      }
      
      // 测试 API 调用
      if (session?.access_token) {
        await testCompanionsAPI(session.access_token)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCompanionsAPI = async (token: string) => {
    try {
      const response = await fetch('/api/companions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      setApiResult({
        status: response.status,
        ok: response.ok,
        data: result
      })
    } catch (error: any) {
      setApiResult({
        status: 'error',
        error: error.message
      })
    }
  }

  const signOut = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  if (loading) {
    return <div className="p-6">检查认证状态...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">认证状态测试</h1>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">会话信息</h2>
          {session ? (
            <div>
              <p><strong>Access Token:</strong> {session.access_token ? '✅ 存在' : '❌ 不存在'}</p>
              <p><strong>Token 前缀:</strong> {session.access_token?.substring(0, 20)}...</p>
              <p><strong>过期时间:</strong> {new Date(session.expires_at * 1000).toLocaleString()}</p>
            </div>
          ) : (
            <p>❌ 无会话</p>
          )}
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">用户信息</h2>
          {user ? (
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>邮箱:</strong> {user.email}</p>
              <p><strong>邮箱确认:</strong> {user.email_confirmed_at ? '✅ 已确认' : '❌ 未确认'}</p>
            </div>
          ) : (
            <p>❌ 无用户信息</p>
          )}
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API 测试结果</h2>
          {apiResult ? (
            <div>
              <p><strong>状态码:</strong> {apiResult.status}</p>
              <p><strong>成功:</strong> {apiResult.ok ? '✅' : '❌'}</p>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">详细响应</summary>
                <pre className="bg-white p-2 rounded mt-2 text-sm overflow-auto">
                  {JSON.stringify(apiResult.data, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p>未测试</p>
          )}
        </div>
        
        <div className="space-x-4">
          <button
            onClick={checkAuth}
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