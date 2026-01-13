'use client'

import { useState } from 'react'

export default function SetupPage() {
  const [status, setStatus] = useState<string>('准备设置数据库...')
  const [loading, setLoading] = useState(false)
  const [sqlContent, setSqlContent] = useState('')

  const setupDatabase = async () => {
    setLoading(true)
    setStatus('正在设置数据库...')

    try {
      const response = await fetch('/api/setup/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        setStatus('✅ 数据库设置成功！')
      } else {
        setStatus(`❌ 设置失败: ${result.message}`)
      }
    } catch (error: any) {
      setStatus(`❌ 设置失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadSqlContent = async () => {
    try {
      const response = await fetch('/src/lib/supabase-schema-simple.sql')
      const content = await response.text()
      setSqlContent(content)
    } catch (error) {
      setSqlContent('无法加载SQL内容，请手动复制文件内容')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          AI美女伴侣平台 - 数据库设置
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">自动设置（推荐）</h2>
          <p className="text-gray-600 mb-4">
            点击下面的按钮自动创建数据库表结构：
          </p>
          
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={setupDatabase}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-6 rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
            >
              {loading ? '设置中...' : '自动设置数据库'}
            </button>
            
            <span className="text-sm text-gray-600">{status}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">手动设置</h2>
          <p className="text-gray-600 mb-4">
            如果自动设置失败，请在Supabase控制台的SQL编辑器中运行以下SQL：
          </p>
          
          <div className="mb-4">
            <button
              onClick={loadSqlContent}
              className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
            >
              显示SQL内容
            </button>
          </div>

          {sqlContent && (
            <div className="bg-gray-100 p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
              <pre>{sqlContent}</pre>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-bold text-blue-800 mb-2">手动设置步骤：</h3>
            <ol className="list-decimal list-inside text-blue-700 space-y-1">
              <li>登录 <a href="https://supabase.com" target="_blank" className="underline">Supabase控制台</a></li>
              <li>选择你的项目</li>
              <li>点击左侧菜单的 "SQL Editor"</li>
              <li>创建新查询，粘贴上面的SQL内容</li>
              <li>点击 "Run" 执行SQL</li>
              <li>返回这里测试连接</li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/test"
            className="bg-white text-gray-800 border border-gray-300 py-2 px-6 rounded-md hover:border-pink-500 mr-4"
          >
            测试系统状态
          </a>
          <a
            href="/auth"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 px-6 rounded-md hover:from-pink-600 hover:to-purple-700"
          >
            前往登录
          </a>
        </div>
      </div>
    </div>
  )
}