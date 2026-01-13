// 缓存管理系统 - 内存缓存 + localStorage持久化
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  clears: number
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0
  }
  private maxMemoryItems = 1000
  private defaultTTL = 5 * 60 * 1000 // 5分钟

  // 内存缓存操作
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // 如果内存缓存已满，删除最旧的项
    if (this.memoryCache.size >= this.maxMemoryItems) {
      const oldestKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(oldestKey)
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    }

    this.memoryCache.set(key, item)
    this.stats.sets++

    // 同时保存到localStorage（如果数据不太大）
    try {
      const serialized = JSON.stringify(item)
      if (serialized.length < 50000) { // 限制50KB
        localStorage.setItem(`cache_${key}`, serialized)
      }
    } catch (error) {
      // localStorage可能已满，忽略错误
    }
  }

  get<T>(key: string): T | null {
    // 首先检查内存缓存
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem) {
      if (Date.now() - memoryItem.timestamp <= memoryItem.ttl) {
        this.stats.hits++
        return memoryItem.data
      } else {
        this.memoryCache.delete(key)
      }
    }

    // 检查localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored)
        if (Date.now() - item.timestamp <= item.ttl) {
          // 重新加载到内存缓存
          this.memoryCache.set(key, item)
          this.stats.hits++
          return item.data
        } else {
          localStorage.removeItem(`cache_${key}`)
        }
      }
    } catch (error) {
      // 解析错误，删除损坏的缓存
      localStorage.removeItem(`cache_${key}`)
    }

    this.stats.misses++
    return null
  }

  delete(key: string): boolean {
    const memoryDeleted = this.memoryCache.delete(key)
    
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (error) {
      // 忽略localStorage错误
    }

    if (memoryDeleted) {
      this.stats.deletes++
    }

    return memoryDeleted
  }

  clear(): void {
    this.memoryCache.clear()
    
    // 清理localStorage中的缓存项
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      // 忽略localStorage错误
    }

    this.stats.clears++
  }

  // 获取缓存统计
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      size: this.memoryCache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    }
  }

  // 清理过期项
  cleanup(): number {
    let cleaned = 0
    const now = Date.now()

    // 清理内存缓存
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key)
        cleaned++
      }
    }

    // 清理localStorage
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const item = JSON.parse(stored)
              if (now - item.timestamp > item.ttl) {
                localStorage.removeItem(key)
                cleaned++
              }
            }
          } catch (error) {
            // 删除损坏的缓存项
            localStorage.removeItem(key)
            cleaned++
          }
        }
      })
    } catch (error) {
      // 忽略localStorage错误
    }

    return cleaned
  }

  // 获取缓存大小信息
  getSizeInfo() {
    let localStorageSize = 0
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const item = localStorage.getItem(key)
          if (item) {
            localStorageSize += item.length
          }
        }
      })
    } catch (error) {
      // 忽略错误
    }

    return {
      memoryItems: this.memoryCache.size,
      localStorageSize: Math.round(localStorageSize / 1024), // KB
      maxMemoryItems: this.maxMemoryItems
    }
  }
}

// 专门的API响应缓存
class APICache extends CacheManager {
  constructor() {
    super()
  }

  // 缓存API响应
  cacheResponse<T>(url: string, method: string, params: any, response: T, ttl?: number): void {
    const key = this.generateAPIKey(url, method, params)
    this.set(key, response, ttl)
  }

  // 获取缓存的API响应
  getCachedResponse<T>(url: string, method: string, params: any): T | null {
    const key = this.generateAPIKey(url, method, params)
    return this.get<T>(key)
  }

  // 生成API缓存键
  private generateAPIKey(url: string, method: string, params: any): string {
    const paramString = JSON.stringify(params || {})
    return `api_${method}_${url}_${btoa(paramString).slice(0, 20)}`
  }

  // 缓存用户数据
  cacheUserData(userId: string, data: any, ttl: number = 10 * 60 * 1000): void {
    this.set(`user_${userId}`, data, ttl)
  }

  // 获取缓存的用户数据
  getCachedUserData(userId: string): any | null {
    return this.get(`user_${userId}`)
  }

  // 缓存伴侣数据
  cacheCompanionData(companionId: string, data: any, ttl: number = 15 * 60 * 1000): void {
    this.set(`companion_${companionId}`, data, ttl)
  }

  // 获取缓存的伴侣数据
  getCachedCompanionData(companionId: string): any | null {
    return this.get(`companion_${companionId}`)
  }

  // 缓存聊天历史
  cacheChatHistory(userId: string, companionId: string, messages: any[], ttl: number = 5 * 60 * 1000): void {
    this.set(`chat_${userId}_${companionId}`, messages, ttl)
  }

  // 获取缓存的聊天历史
  getCachedChatHistory(userId: string, companionId: string): any[] | null {
    return this.get(`chat_${userId}_${companionId}`)
  }

  // 清除用户相关缓存
  clearUserCache(userId: string): void {
    const keys = Array.from(this.memoryCache.keys())
    keys.forEach(key => {
      if (key.includes(userId)) {
        this.delete(key)
      }
    })
  }
}

// 数据库查询优化缓存
class QueryCache extends CacheManager {
  constructor() {
    super()
  }

  // 缓存查询结果
  cacheQuery<T>(query: string, params: any[], result: T, ttl: number = 2 * 60 * 1000): void {
    const key = this.generateQueryKey(query, params)
    this.set(key, result, ttl)
  }

  // 获取缓存的查询结果
  getCachedQuery<T>(query: string, params: any[]): T | null {
    const key = this.generateQueryKey(query, params)
    return this.get<T>(key)
  }

  // 生成查询缓存键
  private generateQueryKey(query: string, params: any[]): string {
    const paramString = JSON.stringify(params)
    const queryHash = btoa(query + paramString).slice(0, 32)
    return `query_${queryHash}`
  }

  // 清除相关查询缓存
  clearQueriesForTable(tableName: string): void {
    const keys = Array.from(this.memoryCache.keys())
    keys.forEach(key => {
      if (key.startsWith('query_')) {
        const item = this.memoryCache.get(key)
        if (item && item.key.includes(tableName)) {
          this.delete(key)
        }
      }
    })
  }
}

// 创建全局缓存实例
export const globalCache = new CacheManager()
export const apiCache = new APICache()
export const queryCache = new QueryCache()

// 自动清理定时器
let cleanupInterval: NodeJS.Timeout | null = null

export const startCacheCleanup = (intervalMs: number = 10 * 60 * 1000) => { // 默认10分钟
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }

  cleanupInterval = setInterval(() => {
    const cleaned = globalCache.cleanup() + apiCache.cleanup() + queryCache.cleanup()
    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired items`)
    }
  }, intervalMs)
}

export const stopCacheCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

// 缓存装饰器函数
export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = 5 * 60 * 1000
) => {
  return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyGenerator(...args)
    
    // 尝试从缓存获取
    const cached = globalCache.get(key)
    if (cached !== null) {
      return cached
    }

    // 执行原函数
    const result = await fn(...args)
    
    // 缓存结果
    globalCache.set(key, result, ttl)
    
    return result
  }
}

// React Hook for cache
import { useState, useEffect } from 'react'

export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 尝试从缓存获取
        const cached = globalCache.get<T>(key)
        if (cached !== null) {
          setData(cached)
          setLoading(false)
          return
        }

        // 从源获取数据
        const result = await fetcher()
        globalCache.set(key, result, ttl)
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [key, ttl])

  const refresh = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetcher()
      globalCache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refresh }
}

// 启动自动清理
if (typeof window !== 'undefined') {
  startCacheCleanup()
}