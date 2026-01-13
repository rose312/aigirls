import { NextRequest, NextResponse } from 'next/server'
import { sendMessageServer, getChatHistoryServer, deleteChatHistory } from '@/lib/chat-service-simple'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { emotionalGrowthSystem } from '@/lib/emotional-growth'
import { recommendationEngine } from '@/lib/recommendation-engine'

export const runtime = 'nodejs'

// GET /api/chat/[companionId] - 获取对话历史
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const messages = await getChatHistoryServer(supabase, user.id, companionId, limit)
    
    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('获取对话历史失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

// POST /api/chat/[companionId] - 发送消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    const body = await request.json()
    
    if (!body.content) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }
    
    // 记录聊天开始事件
    recommendationEngine.recordBehaviorEvent({
      userId: user.id,
      eventType: 'chat_start',
      companionId,
      metadata: {
        messageLength: body.content.length
      },
      timestamp: Date.now()
    })
    
    const result = await sendMessageServer(supabase, user.id, {
      companionId,
      content: body.content,
      messageType: body.messageType
    })
    
    // 评估互动质量并更新情感成长
    if (result.aiMessage) {
      try {
        const interaction = await emotionalGrowthSystem.evaluateInteractionQuality(
          body.content,
          result.aiMessage.content,
          user.id,
          companionId
        )
        
        const progress = await emotionalGrowthSystem.updateRelationshipProgress(
          supabase,
          user.id,
          companionId,
          interaction
        )
        
        // 记录消息发送事件
        recommendationEngine.recordBehaviorEvent({
          userId: user.id,
          eventType: 'message_send',
          companionId,
          metadata: {
            messageLength: body.content.length,
            qualityScore: interaction.qualityScore,
            intimacyLevel: progress.intimacyLevel
          },
          timestamp: Date.now()
        })
        
        // 将情感成长数据添加到响应中
        result.emotionalGrowth = {
          interaction,
          progress: {
            intimacyLevel: progress.intimacyLevel,
            intimacyPoints: progress.intimacyPoints,
            qualityScore: progress.qualityScore,
            growthTrend: progress.growthTrend
          }
        }
      } catch (growthError) {
        console.error('情感成长评估失败:', growthError)
        // 不影响主要聊天功能，继续返回结果
      }
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('发送消息失败:', error)
    
    // 特殊错误处理
    if (error.message.includes('配额') || error.message.includes('上限')) {
      return NextResponse.json(
        { error: error.message, code: 'QUOTA_EXCEEDED' },
        { status: 429 }
      )
    }
    
    if (error.message.includes('内容') || error.message.includes('规范')) {
      return NextResponse.json(
        { error: error.message, code: 'CONTENT_VIOLATION' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE /api/chat/[companionId] - 删除对话历史
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companionId: string }> }
) {
  try {
    const { companionId } = await params
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    await deleteChatHistory(supabase, user.id, companionId)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('删除对话历史失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}