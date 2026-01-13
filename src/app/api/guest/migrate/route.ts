import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

// POST /api/guest/migrate - 迁移临时用户数据到正式账户
export async function POST(request: NextRequest) {
  try {
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
    const { temporaryCompanion, conversationHistory, sessionStats } = body
    
    if (!temporaryCompanion || !conversationHistory) {
      return NextResponse.json({ error: '缺少必要数据' }, { status: 400 })
    }

    // 1. 创建正式伴侣（基于临时伴侣）
    const companionData = {
      user_id: user.id,
      name: temporaryCompanion.name,
      companion_type: temporaryCompanion.personality,
      background: temporaryCompanion.backstory,
      is_public: false,
      intimacy_level: 1,
      intimacy_points: Math.max(1, sessionStats?.messageCount || 0),
      appearance_config: {
        avatar: temporaryCompanion.avatar,
        style: temporaryCompanion.personality
      },
      personality_config: {
        type: temporaryCompanion.personality,
        traits: temporaryCompanion.traits,
        greeting: temporaryCompanion.greeting
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: companion, error: companionError } = await supabase
      .from('companions')
      .insert(companionData)
      .select('*')
      .single()

    if (companionError) {
      console.error('创建伴侣失败:', companionError)
      return NextResponse.json({ error: '创建伴侣失败' }, { status: 500 })
    }

    // 2. 迁移对话历史
    const chatMessages = conversationHistory.map((msg: any) => ({
      user_id: user.id,
      companion_id: companion.id,
      sender_type: msg.sender,
      content: msg.content,
      message_type: 'text',
      created_at: msg.timestamp
    }))

    const { error: messagesError } = await supabase
      .from('chat_messages')
      .insert(chatMessages)

    if (messagesError) {
      console.error('迁移对话历史失败:', messagesError)
      // 不阻断流程，只记录错误
    }

    // 3. 记录迁移统计
    const migrationRecord = {
      user_id: user.id,
      companion_id: companion.id,
      original_session_id: body.sessionId || 'unknown',
      messages_migrated: conversationHistory.length,
      session_duration: sessionStats?.timeSpent || 0,
      engagement_score: sessionStats?.engagementScore || 0,
      migrated_at: new Date().toISOString()
    }

    await supabase
      .from('guest_migrations')
      .insert(migrationRecord)
      .catch(error => {
        console.error('记录迁移统计失败:', error)
        // 不阻断流程
      })

    return NextResponse.json({
      success: true,
      companion: companion,
      migratedMessages: conversationHistory.length,
      message: '数据迁移成功！欢迎加入AI伴侣平台！'
    })

  } catch (error: any) {
    console.error('迁移数据失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}