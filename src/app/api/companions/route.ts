import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { createCompanionServer, getUserCompanionsServer } from '@/lib/companion-service-simple'
import { recommendationEngine } from '@/lib/recommendation-engine'

export const runtime = 'nodejs'

// GET /api/companions - 获取用户伴侣列表
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    // 使用带缓存的服务函数
    const companions = await getUserCompanionsServer(supabase, user.id)

    return NextResponse.json({ companions })
  } catch (error: any) {
    console.error('获取伴侣列表失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

// POST /api/companions - 创建新伴侣
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
      console.error('认证错误:', authError)
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // 验证请求数据
    if (!body.name || !body.companion_type) {
      return NextResponse.json(
        { error: '缺少必要参数：name, companion_type' },
        { status: 400 }
      )
    }

    const allowedTypes = new Set(['neighbor', 'office', 'student', 'custom'])
    if (!allowedTypes.has(body.companion_type)) {
      return NextResponse.json(
        { error: '无效的 companion_type' },
        { status: 400 }
      )
    }

    const companion = await createCompanionServer(supabase, user.id, {
      name: String(body.name),
      companion_type: body.companion_type,
      appearance_config: body.appearance_config || {},
      personality_config: body.personality_config || {},
      background: body.background,
      is_public: body.is_public || false
    })

    // 记录用户行为事件
    recommendationEngine.recordBehaviorEvent({
      userId: user.id,
      eventType: 'companion_create',
      companionId: companion.id,
      metadata: {
        companionType: companion.companion_type,
        isPublic: companion.is_public
      },
      timestamp: Date.now()
    })

    return NextResponse.json({ companion })
  } catch (error: any) {
    console.error('创建伴侣失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}