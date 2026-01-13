import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkAuth } from '@/lib/auth'
import { apiMonitor } from '@/lib/api-monitor'
import { globalCache, apiCache, queryCache } from '@/lib/cache-manager'
import { recommendationEngine } from '@/lib/recommendation-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await checkAuth(supabase)
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    
    if (type === 'api') {
      // API性能统计
      const stats = apiMonitor.getOverallStats()
      const endpointStats = apiMonitor.getEndpointStats()
      const recentMetrics = apiMonitor.getRecentMetrics(20)
      const slowRequests = apiMonitor.getSlowRequests(1000)
      const errorRequests = apiMonitor.getErrorRequests()
      
      return NextResponse.json({
        success: true,
        data: {
          overall: stats,
          endpoints: endpointStats,
          recent: recentMetrics,
          slow: slowRequests,
          errors: errorRequests
        }
      })
    } else if (type === 'cache') {
      // 缓存性能统计
      const globalStats = globalCache.getStats()
      const apiStats = apiCache.getStats()
      const queryStats = queryCache.getStats()
      
      const globalSize = globalCache.getSizeInfo()
      const apiSize = apiCache.getSizeInfo()
      const querySize = queryCache.getSizeInfo()
      
      return NextResponse.json({
        success: true,
        data: {
          global: { ...globalStats, ...globalSize },
          api: { ...apiStats, ...apiSize },
          query: { ...queryStats, ...querySize }
        }
      })
    } else if (type === 'recommendations') {
      // 推荐系统统计
      const stats = recommendationEngine.getRecommendationStats()
      
      return NextResponse.json({
        success: true,
        data: stats
      })
    } else {
      // 综合概览
      const apiStats = apiMonitor.getOverallStats()
      const cacheStats = globalCache.getStats()
      const recommendationStats = recommendationEngine.getRecommendationStats()
      
      return NextResponse.json({
        success: true,
        data: {
          api: {
            totalRequests: apiStats.totalRequests,
            averageResponseTime: apiStats.averageResponseTime,
            errorRate: apiStats.errorRate
          },
          cache: {
            hitRate: cacheStats.hitRate,
            size: cacheStats.size
          },
          recommendations: {
            totalProfiles: recommendationStats.totalProfiles,
            averageConfidence: recommendationStats.averageConfidence
          }
        }
      })
    }
  } catch (error) {
    console.error('获取性能数据失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取性能数据失败' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await checkAuth(supabase)
    
    const body = await request.json()
    const { action } = body
    
    if (action === 'clear_cache') {
      // 清理缓存
      globalCache.clear()
      apiCache.clear()
      queryCache.clear()
      
      return NextResponse.json({
        success: true,
        message: '缓存已清理'
      })
    } else if (action === 'cleanup_cache') {
      // 清理过期缓存
      const globalCleaned = globalCache.cleanup()
      const apiCleaned = apiCache.cleanup()
      const queryCleaned = queryCache.cleanup()
      
      return NextResponse.json({
        success: true,
        message: `已清理 ${globalCleaned + apiCleaned + queryCleaned} 个过期缓存项`
      })
    } else if (action === 'clear_metrics') {
      // 清理性能指标
      apiMonitor.clearMetrics()
      
      return NextResponse.json({
        success: true,
        message: '性能指标已清理'
      })
    }
    
    return NextResponse.json(
      { success: false, error: '无效的操作类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('性能操作失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '操作失败' 
      },
      { status: 500 }
    )
  }
}