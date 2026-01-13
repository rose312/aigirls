'use client'

import React from 'react'
import { useDesignSystem } from '@/lib/design-system'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'text',
  animation = 'pulse'
}) => {
  const { colors } = useDesignSystem()

  const getVariantClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full'
      case 'rounded':
        return 'rounded-lg'
      case 'rectangular':
        return 'rounded-none'
      default:
        return 'rounded'
    }
  }

  const getAnimationClasses = () => {
    switch (animation) {
      case 'wave':
        return 'animate-wave'
      case 'pulse':
        return 'animate-pulse'
      default:
        return ''
    }
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: colors.border
  }

  return (
    <div
      className={`
        ${getVariantClasses()}
        ${getAnimationClasses()}
        ${className}
      `}
      style={style}
    />
  )
}

// 聊天消息骨架屏
export const ChatMessageSkeleton: React.FC = () => {
  return (
    <div className="flex space-x-3 p-4">
      {/* 头像 */}
      <Skeleton variant="circular" width={40} height={40} />
      
      {/* 消息内容 */}
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="80%" height="1rem" />
        <Skeleton width="40%" height="1rem" />
      </div>
    </div>
  )
}

// 伴侣卡片骨架屏
export const CompanionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl p-4 shadow-md">
      {/* 头像 */}
      <div className="flex justify-center mb-4">
        <Skeleton variant="circular" width={80} height={80} />
      </div>
      
      {/* 名称 */}
      <Skeleton width="70%" height="1.25rem" className="mx-auto mb-2" />
      
      {/* 描述 */}
      <div className="space-y-2">
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="80%" height="0.875rem" />
      </div>
      
      {/* 按钮 */}
      <Skeleton width="100%" height="2.5rem" className="mt-4" variant="rounded" />
    </div>
  )
}

// 推荐列表骨架屏
export const RecommendationListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <Skeleton width="40%" height="1.5rem" className="mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <CompanionCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

// 聊天界面骨架屏
export const ChatInterfaceSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      {/* 头部 */}
      <div className="flex items-center p-4 border-b border-border">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="ml-3 flex-1">
          <Skeleton width="30%" height="1.25rem" className="mb-1" />
          <Skeleton width="20%" height="0.875rem" />
        </div>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      
      {/* 消息列表 */}
      <div className="flex-1 overflow-hidden">
        <div className="space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <ChatMessageSkeleton key={index} />
          ))}
        </div>
      </div>
      
      {/* 输入框 */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-3">
          <Skeleton width="100%" height="2.5rem" variant="rounded" className="flex-1" />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>
    </div>
  )
}

// 个人资料骨架屏
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-md">
      {/* 头像和基本信息 */}
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton variant="circular" width={80} height={80} />
        <div className="flex-1">
          <Skeleton width="50%" height="1.5rem" className="mb-2" />
          <Skeleton width="30%" height="1rem" className="mb-1" />
          <Skeleton width="40%" height="1rem" />
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="text-center">
            <Skeleton width="60%" height="1.5rem" className="mx-auto mb-1" />
            <Skeleton width="80%" height="0.875rem" className="mx-auto" />
          </div>
        ))}
      </div>
      
      {/* 详细信息 */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <Skeleton width="30%" height="1rem" className="mb-2" />
            <Skeleton width="100%" height="0.875rem" />
          </div>
        ))}
      </div>
    </div>
  )
}

// 设置页面骨架屏
export const SettingsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <Skeleton width="25%" height="2rem" />
      
      {/* 设置组 */}
      {Array.from({ length: 4 }).map((_, groupIndex) => (
        <div key={groupIndex} className="bg-surface rounded-xl p-6 shadow-md">
          {/* 组标题 */}
          <Skeleton width="40%" height="1.25rem" className="mb-4" />
          
          {/* 设置项 */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <div key={itemIndex} className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton width="60%" height="1rem" className="mb-1" />
                  <Skeleton width="80%" height="0.875rem" />
                </div>
                <Skeleton width="3rem" height="1.5rem" variant="rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 加载状态组合组件
interface LoadingStateProps {
  type: 'chat' | 'companions' | 'profile' | 'settings' | 'recommendations'
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ type, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'chat':
        return <ChatInterfaceSkeleton />
      case 'companions':
        return <RecommendationListSkeleton />
      case 'profile':
        return <ProfileSkeleton />
      case 'settings':
        return <SettingsSkeleton />
      case 'recommendations':
        return <RecommendationListSkeleton />
      default:
        return <div>Loading...</div>
    }
  }

  return (
    <div className={`animate-pulse ${className}`}>
      {renderSkeleton()}
    </div>
  )
}

// 自定义波浪动画样式
export const SkeletonStyles = () => (
  <style jsx global>{`
    @keyframes wave {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
    
    .animate-wave {
      position: relative;
      overflow: hidden;
    }
    
    .animate-wave::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.2),
        transparent
      );
      animation: wave 1.6s linear 0.5s infinite;
    }
  `}</style>
)

export default Skeleton