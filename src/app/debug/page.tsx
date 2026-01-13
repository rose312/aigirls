'use client'

import { useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase-types'

export default function DebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      
      // 测试基本连接 - 使用 count 查询
      const { count, error: healthError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      setResult({
        type: 'connection',
        success: !healthError,
        data: { count },
        error: healthError?.message
      })
    } catch (err: any) {
      setResult({
        type: 'connection',
        success: false,
        error: err.message
      })
    }
    setLoading(false)
  }

  const testSignUp = async () => {
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      // 使用更真实的邮箱格式
      const testEmail = `testuser${Math.floor(Math.random() * 10000)}@gmail.com`
      const testPassword = 'test123456'
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      })
      
      setResult({
        type: 'signup',
        success: !error,
        data: data,
        error: error?.message,
        errorDetails: error,
        testEmail,
        testPassword
      })
    } catch (err: any) {
      setResult({
        type: 'signup',
        success: false,
        error: err.message,
        errorDetails: err
      })
    }
    setLoading(false)
  }

  const testSignIn = async () => {
    if (!result || result.type !== 'signup' || !result.success) {
      alert('请先成功注册一个测试账户')
      return
    }
    
    setLoading(true)
    try {
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: result.testEmail,
        password: result.testPassword
      })
      
      setResult({
        type: 'signin',
        success: !error,
        data: data,
        error: error?.message
      })
    } catch (err: any) {
      setResult({
        type: 'signin',
        success: false,
        error: err.message
      })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Supabase 连接诊断</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '测试中...' : '测试数据库连接'}
        </button>
        
        <button
          onClick={testSignUp}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? '测试中...' : '测试用户注册'}
        </button>
        
        <button
          onClick={testSignIn}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-2"
        >
          {loading ? '测试中...' : '测试用户登录'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">
            测试结果: {result.type}
          </h2>
          
          <div className={`p-2 rounded mb-2 ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            状态: {result.success ? '✅ 成功' : '❌ 失败'}
          </div>
          
          {result.error && (
            <div className="bg-red-50 p-2 rounded mb-2">
              <strong>错误:</strong> {result.error}
            </div>
          )}
          
          {result.testEmail && (
            <div className="bg-blue-50 p-2 rounded mb-2">
              <strong>测试邮箱:</strong> {result.testEmail}<br/>
              <strong>测试密码:</strong> {result.testPassword}
            </div>
          )}
          
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">详细数据</summary>
            <pre className="bg-white p-2 rounded mt-2 text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">环境变量检查:</h3>
        <div className="text-sm space-y-1">
          <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 已设置' : '❌ 未设置'}</div>
          <div>ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已设置' : '❌ 未设置'}</div>
        </div>
      </div>
    </div>
  )
}