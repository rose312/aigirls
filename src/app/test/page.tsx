'use client'

import { useState, useEffect } from 'react'

export default function TestPage() {
  const [status, setStatus] = useState<{
    database: string
    auth: string
    apis: string
  }>({
    database: '检查中...',
    auth: '检查中...',
    apis: '检查中...'
  })

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkSystemStatus = async () => {
    // 检查数据库连接
    try {
      const response = await fetch('/api/test/database')
      if (response.ok) {
        setStatus(prev => ({ ...prev, database: '✅ 正常' }))
      } else {
        setStatus(prev => ({ ...prev, database: '❌ 连接失败' }))
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, database: '❌ 连接失败' }))
    }

    // 检查认证API
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'test',
          email: 'test@example.com',
          password: 'test123'
        })
      })
      
      if (response.status === 400 || response.status === 409) {
        setStatus(prev => ({ ...prev, auth: '✅ API正常' }))
      } else {
        setStatus(prev => ({ ...prev, auth: '❌ API异常' }))
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, auth: '❌ API异常' }))
    }

    // 检查其他API
    try {
      const response = await fetch('/api/companions')
      if (response.status === 401) {
        setStatus(prev => ({ ...prev, apis: '✅ API正常（需要认证）' }))
      } else {
        setStatus(prev => ({ ...prev, apis: '❌ API异常' }))
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, apis: '❌ API异常' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          AI美女伴侣平台 - 系统状态
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-medium">数据库连接</span>
            <span>{status.database}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-medium">认证系统</span>
            <span>{status.auth}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-medium">API接口</span>
            <span>{status.apis}</span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-gray-600">
            如果数据库连接失败，请在Supabase控制台运行以下SQL：
          </p>
          <div className="bg-gray-100 p-4 rounded text-left text-sm font-mono">
            src/lib/supabase-schema.sql
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={checkSystemStatus}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-4 rounded-md hover:from-pink-600 hover:to-purple-700"
            >
              重新检查
            </button>
            <a
              href="/auth"
              className="bg-white text-gray-800 border border-gray-300 py-2 px-4 rounded-md hover:border-pink-500"
            >
              前往登录
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}