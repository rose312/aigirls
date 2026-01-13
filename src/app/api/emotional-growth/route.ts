import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkAuth } from '@/lib/auth'
import { emotionalGrowthSystem } from '@/lib/emotional-growth'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const user = await checkAuth(supabase)
    
    const { searchParams } = new URL(request.url)
    const companionId = searchParams.get('companionId')
    
    if (!companionId) {
      return NextResponse.json(
        { success: false, error: '缺少伴侣ID' },
        { status: 400 }
      )
    }
    
    // 获取关系进展
    const progress = await emotionalGrowthSystem.getRelationshipProgress(
      supabase,
      user.id,
      companionId
    )
    
    // 获取里程碑
    const milestones = emotionalGrowthSystem.getMilestones()
    
    // 获取回忆
    const memories = emotionalGrowthSystem.getUserMemories(user.id)
      .filter(memory => memory.companionId === companionId)
    
    return NextResponse.json({
      success: true,
      data: {
        progress,
        milestones,
        memories
      }
    })
  } catch (error) {
    console.error('获取情感成长数据失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '获取数据失败' 
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
    const { companionId, messageContent, responseContent, action } = body
    
    if (action === 'evaluate_interaction') {
      // 评估互动质量
      const interaction = await emotionalGrowthSystem.evaluateInteractionQuality(
        messageContent,
        responseContent,
        user.id,
        companionId
      )
      
      // 更新关系进展
      const progress = await emotionalGrowthSystem.updateRelationshipProgress(
        supabase,
        user.id,
        companionId,
        interaction
      )
      
      return NextResponse.json({
        success: true,
        data: {
          interaction,
          progress
        }
      })
    } else if (action === 'create_memory') {
      const { title, content, emotionalValue } = body
      
      // 创建对话回忆
      const memory = await emotionalGrowthSystem.createConversationMemory(
        user.id,
        companionId,
        title,
        content,
        emotionalValue
      )
      
      return NextResponse.json({
        success: true,
        data: memory
      })
    }
    
    return NextResponse.json(
      { success: false, error: '无效的操作类型' },
      { status: 400 }
    )
  } catch (error) {
    console.error('情感成长操作失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '操作失败' 
      },
      { status: 500 }
    )
  }
}