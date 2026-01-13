'use client'

import React, { useEffect, useState } from 'react'
import { useDesignSystem } from '@/lib/design-system'
import { useAnimation } from '@/lib/animation-system'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'dots' | 'spinner' | 'pulse' | 'bars' | 'heart' | 'wave'
  color?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  color,
  className = ''
}) => {
  const { colors } = useDesignSystem()
  const primaryColor = color || colors.primary

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4'
      case 'md': return 'w-8 h-8'
      case 'lg': return 'w-12 h-12'
      case 'xl': return 'w-16 h-16'
      default: return 'w-8 h-8'
    }
  }

  const renderVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={size} color={primaryColor} />
      case 'pulse':
        return <PulseLoader size={size} color={primaryColor} />
      case 'bars':
        return <BarsLoader size={size} color={primaryColor} />
      case 'heart':
        return <HeartLoader size={size} color={primaryColor} />
      case 'wave':
        return <WaveLoader size={size} color={primaryColor} />
      default:
        return (
          <div
            className={`${getSizeClasses()} animate-spin rounded-full border-2 border-gray-300 border-t-current ${className}`}
            style={{ borderTopColor: primaryColor }}
          />
        )
    }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderVariant()}
    </div>
  )
}

// 点状加载器
const DotsLoader: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : size === 'xl' ? 'w-4 h-4' : 'w-2 h-2'
  
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`${dotSize} rounded-full animate-bounce`}
          style={{
            backgroundColor: color,
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  )
}

// 脉冲加载器
const PulseLoader: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : size === 'xl' ? 'w-16 h-16' : 'w-8 h-8'
  
  return (
    <div className={`${sizeClass} relative`}>
      <div
        className="absolute inset-0 rounded-full animate-ping"
        style={{ backgroundColor: color, opacity: 0.75 }}
      />
      <div
        className="relative rounded-full w-full h-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

// 条状加载器
const BarsLoader: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const barHeight = size === 'sm' ? 'h-3' : size === 'lg' ? 'h-8' : size === 'xl' ? 'h-12' : 'h-6'
  const barWidth = 'w-1'
  
  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`${barWidth} ${barHeight} animate-pulse`}
          style={{
            backgroundColor: color,
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// 心形加载器
const HeartLoader: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-12 h-12' : size === 'xl' ? 'w-16 h-16' : 'w-8 h-8'
  
  return (
    <div className={`${sizeClass} relative animate-heartbeat`}>
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-full h-full"
        style={{ color }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  )
}

// 波浪加载器
const WaveLoader: React.FC<{ size: string; color: string }> = ({ size, color }) => {
  const waveHeight = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-6' : size === 'xl' ? 'h-8' : 'h-4'
  
  return (
    <div className="flex items-center space-x-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className={`w-1 ${waveHeight} animate-wave`}
          style={{
            backgroundColor: color,
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
    </div>
  )
}

// 页面加载覆盖层
interface PageLoadingOverlayProps {
  isLoading: boolean
  message?: string
  progress?: number
  variant?: 'spinner' | 'dots' | 'heart' | 'wave'
}

export const PageLoadingOverlay: React.FC<PageLoadingOverlayProps> = ({
  isLoading,
  message = '加载中...',
  progress,
  variant = 'spinner'
}) => {
  const { colors } = useDesignSystem()
  const { elementRef, animate } = useAnimation()

  useEffect(() => {
    if (isLoading) {
      animate('fadeIn')
    } else {
      animate('fadeOut')
    }
  }, [isLoading, animate])

  if (!isLoading) return null

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div
        className="bg-surface rounded-xl p-8 shadow-xl max-w-sm w-full mx-4"
        style={{ backgroundColor: colors.surface }}
      >
        <div className="text-center">
          <LoadingSpinner variant={variant} size="lg" className="mb-4" />
          
          <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
            {message}
          </h3>
          
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: colors.primary
                }}
              />
            </div>
          )}
          
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            请稍候，正在为您准备最佳体验...
          </p>
        </div>
      </div>
    </div>
  )
}

// 内联加载状态
interface InlineLoadingProps {
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  size?: 'sm' | 'md'
  className?: string
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  text = '加载中',
  variant = 'dots',
  size = 'sm',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner variant={variant} size={size} />
      <span className="text-sm text-text-secondary">{text}</span>
    </div>
  )
}

// 按钮加载状态
interface LoadingButtonProps {
  isLoading: boolean
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = ''
}) => {
  const { colors } = useDesignSystem()
  const { elementRef, microInteract } = useAnimation()

  const handleClick = async () => {
    if (!isLoading && !disabled && onClick) {
      await microInteract('buttonPress')
      onClick()
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-1.5 text-sm'
      case 'lg': return 'px-6 py-3 text-lg'
      default: return 'px-4 py-2'
    }
  }

  const getVariantStyles = () => {
    if (variant === 'primary') {
      return {
        backgroundColor: disabled || isLoading ? colors.border : colors.primary,
        color: colors.surface
      }
    } else {
      return {
        backgroundColor: colors.surface,
        color: colors.text,
        border: `1px solid ${colors.border}`
      }
    }
  }

  return (
    <button
      ref={elementRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        ${getSizeClasses()}
        rounded-lg font-medium transition-all duration-200
        flex items-center justify-center space-x-2
        ${disabled || isLoading ? 'cursor-not-allowed opacity-60' : 'hover:opacity-90'}
        ${className}
      `}
      style={getVariantStyles()}
    >
      {isLoading && (
        <LoadingSpinner variant="spinner" size="sm" color="currentColor" />
      )}
      <span>{children}</span>
    </button>
  )
}

// 渐进式图片加载
interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
  onLoad?: () => void
  onError?: () => void
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { elementRef, animate } = useAnimation()

  const handleLoad = async () => {
    setIsLoaded(true)
    await animate('fadeIn', { duration: 300 })
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 占位符或加载动画 */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder ? (
            <img
              src={placeholder}
              alt=""
              className="w-full h-full object-cover filter blur-sm"
            />
          ) : (
            <LoadingSpinner variant="pulse" size="md" />
          )}
        </div>
      )}

      {/* 实际图片 */}
      <img
        ref={elementRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          w-full h-full object-cover transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* 错误状态 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">图片加载失败</p>
          </div>
        </div>
      )}
    </div>
  )
}

// 自定义动画样式
export const LoadingAnimationStyles = () => (
  <style jsx global>{`
    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    @keyframes wave {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.5); }
    }
    
    .animate-heartbeat {
      animation: heartbeat 1.2s ease-in-out infinite;
    }
    
    .animate-wave {
      animation: wave 1s ease-in-out infinite;
    }
  `}</style>
)

export default LoadingSpinner