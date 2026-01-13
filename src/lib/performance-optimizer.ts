// 前端性能优化工具库
import { lazy, ComponentType, ReactElement } from 'react'

// 组件懒加载工具
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactElement
) => {
  const LazyComponent = lazy(importFunc)
  
  return (props: any) => (
    <div>
      {fallback && (
        <div className="animate-pulse">
          {fallback}
        </div>
      )}
      <LazyComponent {...props} />
    </div>
  )
}

// 图片懒加载和优化
export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError
}: OptimizedImageProps) => {
  const handleLoad = () => {
    onLoad?.()
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    // 设置默认占位图
    img.src = '/images/placeholder.jpg'
    onError?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {placeholder === 'blur' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: 'cover',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto'
        }}
      />
    </div>
  )
}

// 虚拟滚动组件
export interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => ReactElement
  overscan?: number
  className?: string
}

export function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  const visibleItems = items.slice(startIndex, endIndex + 1)
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }
  
  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 代码分割和动态导入工具
export const loadComponentAsync = async (componentPath: string) => {
  try {
    const module = await import(componentPath)
    return module.default
  } catch (error) {
    console.error(`Failed to load component: ${componentPath}`, error)
    throw error
  }
}

// 预加载关键资源
export const preloadResource = (href: string, as: string = 'script') => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

// 预连接到外部域名
export const preconnectToDomain = (domain: string) => {
  if (typeof window === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = domain
  document.head.appendChild(link)
}

// 缓存管理
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  delete(key: string) {
    this.cache.delete(key)
  }
}

export const cacheManager = new CacheManager()

// 防抖和节流工具
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// 性能监控
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance() {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startTiming(label: string) {
    if (typeof window === 'undefined') return
    performance.mark(`${label}-start`)
  }
  
  endTiming(label: string) {
    if (typeof window === 'undefined') return
    
    performance.mark(`${label}-end`)
    performance.measure(label, `${label}-start`, `${label}-end`)
    
    const measure = performance.getEntriesByName(label)[0]
    if (measure) {
      const times = this.metrics.get(label) || []
      times.push(measure.duration)
      this.metrics.set(label, times)
    }
  }
  
  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || []
    if (times.length === 0) return 0
    
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }
  
  getMetrics() {
    const result: Record<string, { average: number; count: number }> = {}
    
    for (const [label, times] of this.metrics.entries()) {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length
      }
    }
    
    return result
  }
  
  clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// 内存优化工具
export const cleanupUnusedResources = () => {
  // 清理缓存
  cacheManager.clear()
  
  // 清理性能指标
  performanceMonitor.clearMetrics()
  
  // 清理DOM中的事件监听器（如果有的话）
  if (typeof window !== 'undefined') {
    // 可以在这里添加更多清理逻辑
  }
}

// 自动清理定时器
let cleanupInterval: NodeJS.Timeout | null = null

export const startAutoCleanup = (intervalMs: number = 30 * 60 * 1000) => { // 默认30分钟
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  
  cleanupInterval = setInterval(() => {
    cleanupUnusedResources()
  }, intervalMs)
}

export const stopAutoCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

// React Hook for performance monitoring
import { useEffect, useState } from 'react'

export const usePerformanceMonitor = (label: string) => {
  useEffect(() => {
    performanceMonitor.startTiming(label)
    
    return () => {
      performanceMonitor.endTiming(label)
    }
  }, [label])
}

// React Hook for debounced value
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

// React Hook for throttled callback
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  )
  
  return throttledCallback
}

import { useMemo } from 'react'