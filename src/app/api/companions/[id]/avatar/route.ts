import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { generateCompanionAvatar } from '@/lib/companion-avatar'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: companion, error } = await supabase
      .from('companions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !companion) {
      return NextResponse.json({ error: '伴侣不存在或无权限访问' }, { status: 404 })
    }

    const avatar = await generateCompanionAvatar(companion as any)
    const nextAppearance = {
      ...(companion as any).appearance_config,
      avatarKey: avatar.avatarKey
    }

    const { data: updated, error: upErr } = await supabase
      .from('companions')
      .update({
        avatar_url: avatar.avatarUrl,
        appearance_config: nextAppearance,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (upErr) throw upErr

    return NextResponse.json({ companion: updated, avatar })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

