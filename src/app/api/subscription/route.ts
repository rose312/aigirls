import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-types'

export const runtime = 'nodejs'

// 获取用户订阅信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = createSupabaseServerClient(token)
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 })
    }

    // 获取订阅信息
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json({ error: '获取订阅信息失败' }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// 更新订阅
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = createSupabaseServerClient(token)
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '用户未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { type, plan, end_date } = body

    // 计算订阅参数
    let daily_message_limit = 20 // 免费用户默认
    let features: string[] = []

    if (type === 'premium') {
      daily_message_limit = -1 // 无限制
      features = ['unlimited_chat', 'voice_messages', 'exclusive_content']
    }

    // 更新订阅
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        type,
        plan,
        end_date,
        daily_message_limit,
        features,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '更新订阅失败' }, { status: 500 })
    }

    return NextResponse.json({ subscription })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}