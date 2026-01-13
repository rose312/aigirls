'use client'

import { Suspense, lazy, ComponentType, ReactElement } from 'react'
import { motion } from 'framer-motion'

// 通用加载骨架屏
const LoadingSkeleton = ({ 
  type = 'default',
  className = '' 
}: { 
  type?: 'default' | 'card' | 'list' | 'chat' | 'profile'
  className?: string 
}) => {
  const skeletons = {
    default: (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ),
    card: (
      <div className={`animate-pulse bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
        </div>
      </div>
    ),
    list: (
      <div className={`animate-pulse space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    ),
    chat: (
      <div className={`animate-pulse space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-xs p-3 rounded-2xl ${
              i % 2 === 0 ? 'bg-gray-200' : 'bg-pink-200'
            }`}>
              <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    ),
    profile: (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {skeletons[type]}
    </motion.div>
  )
}

// 懒加载组件包装器
interface LazyLoadWrapperProps {
  children: ReactElement
  fallback?: ReactElement
  skeletonType?: 'default' | 'card' | 'list' | 'chat' | 'profile'
  className?: string
  delay?: number
}

const LazyLoadWrapper = ({
  children,
  fallback,
  skeletonType = 'default',
  className = '',
  delay = 0
}: LazyLoadWrapperProps) => {
  const defaultFallback = fallback || <LoadingSkeleton type={skeletonType} className={className} />

  return (
    <Suspense fallback={
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay / 1000, duration: 0.3 }}
      >
        {defaultFallback}
      </motion.div>
    }>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </Suspense>
  )
}

// 创建懒加载组件的工厂函数
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    fallback?: ReactElement
    skeletonType?: 'default' | 'card' | 'list' | 'chat' | 'profile'
    className?: string
    delay?: number
  }
) => {
  const LazyComponent = lazy(importFunc)
  
  return (props: any) => (
    <LazyLoadWrapper
      fallback={options?.fallback}
      skeletonType={options?.skeletonType}
      className={options?.className}
      delay={options?.delay}
    >
      <LazyComponent {...props} />
    </LazyLoadWrapper>
  )
}

// 预定义的懒加载组件
export const LazyCompanionCard = createLazyComponent(
  () => import('@/components/CompanionCard'),
  { skeletonType: 'card' }
)

export const LazyChatInterface = createLazyComponent(
  () => import('@/components/ChatInterface'),
  { skeletonType: 'chat' }
)

export const LazyUserProfile = createLazyComponent(
  () => import('@/components/UserProfile'),
  { skeletonType: 'profile' }
)

export const LazyCompanionList = createLazyComponent(
  () => import('@/components/CompanionList'),
  { skeletonType: 'list' }
)

// 代码分割路由组件
export const LazyAuthPage = createLazyComponent(
  () => import('@/app/auth/page'),
  { skeletonType: 'default' }
)

export const LazyCreateCompanionPage = createLazyComponent(
  () => import('@/app/create-companion/page'),
  { skeletonType: 'card' }
)

export const LazySubscriptionPage = createLazyComponent(
  () => import('@/app/subscription/page'),
  { skeletonType: 'default' }
)

export default LazyLoadWrapper
export { LoadingSkeleton }