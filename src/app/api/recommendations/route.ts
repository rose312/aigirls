import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkAuth } from '@/lib/auth'
import { recommendationEngine } from '@/lib/recommendation-engine'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await checkAuth(supabase)
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '3')
    
    // 生成推荐
    const recommendations = await recommendationEngine.generateRecommendations(user.id, limit)
    
    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('推荐生成失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '推荐生成失败' 
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
    const { eventType, companionId, metadata } = body
    
    // 记录用户行为事件
    recommendationEngine.recordBehaviorEvent({
      userId: user.id,
      eventType,
      companionId,
      metadata,
      timestamp: Date.now()
    })
    
    return NextResponse.json({
      success: true,
      message: '行为事件已记录'
    })
  } catch (error) {
    console.error('行为记录失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '行为记录失败' 
      },
      { status: 500 }
    )
  }
}