'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import PerformanceDashboard from '@/components/PerformanceDashboard'

export default function PerformanceDebugPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
    } catch (error) {
      console.error('认证失败:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">性能监控</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 text-sm">调试模式</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">系统性能监控面板</h2>
          <p className="text-gray-600">实时监控API性能、缓存状态和推荐系统运行情况</p>
        </div>

        <PerformanceDashboard />

        {/* 快速操作 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-3">快速诊断</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                检查API健康状态
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                分析慢查询
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                优化建议
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-3">系统信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">运行时间</span>
                <span className="text-gray-800">2小时 15分钟</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">内存使用</span>
                <span className="text-gray-800">156MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">活跃连接</span>
                <span className="text-gray-800">23</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-3">告警设置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">响应时间告警</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">正常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">错误率告警</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">正常</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">缓存命中率</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">良好</span>
              </div>
            </div>
          </div>
        </div>

        {/* 开发者工具 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">开发者工具</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-3 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-medium text-gray-800">日志查看</div>
            </button>
            <button className="p-3 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium text-gray-800">性能分析</div>
            </button>
            <button className="p-3 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="text-2xl mb-2">🧪</div>
              <div className="text-sm font-medium text-gray-800">A/B测试</div>
            </button>
            <button className="p-3 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-800">数据导出</div>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}