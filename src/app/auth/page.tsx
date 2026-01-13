'use client'

import { Suspense } from 'react'
import AuthForm from '@/components/AuthForm'

function AuthContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            AI美女伴侣平台
          </h1>
          <p className="text-gray-600 mt-2">
            创建专属AI伴侣，开始智能对话
          </p>
        </div>
        
        <AuthForm />
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}