'use client'

import { useState, useEffect } from 'react'
import { signIn, signUp, checkUsernameAvailable } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import GuestSessionManager from '@/lib/guest-session'

interface AuthFormProps {
  mode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export default function AuthForm({ mode = 'signin', onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [migrating, setMigrating] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    referralCode: ''
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromGuest = searchParams.get('from') === 'guest'
  const action = searchParams.get('action')
  
  // 检查是否有临时会话数据
  const [guestSession, setGuestSession] = useState<any>(null)

  useEffect(() => {
    if (action === 'register') {
      setIsSignUp(true)
    }
    
    if (fromGuest) {
      const session = GuestSessionManager.getCurrentSession()
      setGuestSession(session)
    }
  }, [action, fromGuest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        // 检查用户名是否可用
        if (formData.username) {
          const isAvailable = await checkUsernameAvailable(formData.username)
          if (!isAvailable) {
            throw new Error('用户名已被使用')
          }
        }
        
        const result = await signUp(
          formData.email, 
          formData.password, 
          formData.username,
          formData.referralCode
        )
        
        // 如果有临时会话数据，进行迁移
        if (fromGuest && guestSession && result.user) {
          setMigrating(true)
          try {
            const migrationSuccess = await GuestSessionManager.migrateToAccount(result.user.id)
            if (migrationSuccess) {
              setSuccess('注册成功！临时对话已保存到您的账户中')
              setTimeout(() => {
                router.push('/')
              }, 2000)
            } else {
              setSuccess('注册成功！请检查邮箱验证链接')
            }
          } catch (migrationError) {
            console.error('数据迁移失败:', migrationError)
            setSuccess('注册成功！请检查邮箱验证链接')
          } finally {
            setMigrating(false)
          }
        } else {
          setSuccess('注册成功！请检查邮箱验证链接')
        }
      } else {
        await signIn(formData.email, formData.password)
        
        // 登录成功后，如果有临时会话数据，尝试迁移
        if (fromGuest && guestSession) {
          setMigrating(true)
          try {
            // 获取当前用户信息
            const { getCurrentUser } = await import('@/lib/auth')
            const user = await getCurrentUser()
            if (user) {
              await GuestSessionManager.migrateToAccount(user.id)
              setSuccess('登录成功！临时对话已保存到您的账户中')
            }
          } catch (migrationError) {
            console.error('数据迁移失败:', migrationError)
          } finally {
            setMigrating(false)
          }
        }
        
        onSuccess?.()
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-100/50 to-purple-100/50 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-pink-100/50 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* 临时会话提示 */}
        {fromGuest && guestSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">💕</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-sm">
                  保存与 {guestSession.temporaryCompanion.name} 的对话
                </h3>
                <p className="text-gray-600 text-xs">
                  注册后将自动保存您的 {guestSession.conversationHistory.length} 条对话记录
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {isSignUp ? '创建账户' : '欢迎回来'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱地址
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="输入邮箱地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="输入密码（至少6位）"
            />
          </div>

          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    用户名（可选）
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="设置用户名"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    推荐码（可选）
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="输入推荐码获得奖励"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 错误提示 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 成功提示 */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-xl border border-green-200"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading || migrating}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
          >
            <AnimatePresence mode="wait">
              {migrating ? (
                <motion.div
                  key="migrating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>保存对话数据中...</span>
                </motion.div>
              ) : loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>处理中...</span>
                </motion.div>
              ) : (
                <motion.span
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isSignUp ? '创建账户' : '立即登录'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
          >
            {isSignUp ? '已有账号？点击登录' : '没有账号？点击注册'}
          </button>
        </div>

        {/* 快速登录选项 */}
        {!isSignUp && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500 mb-4">或者</p>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full text-gray-600 py-2 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all text-sm"
            >
              继续体验（无需注册）
            </button>
          </div>
        )}
      </div>
    </div>
  )
}