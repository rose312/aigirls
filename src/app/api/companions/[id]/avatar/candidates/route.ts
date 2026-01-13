import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { generateCompanionAvatarCandidates, type AvatarVariant } from '@/lib/companion-avatar'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceVariant(value: unknown): AvatarVariant | undefined {
  return value === 'studio' || value === 'cinematic' || value === 'outdoor' || value === 'street' || value === 'anime'
    ? value
    : undefined
}

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

    const body = (await request.json().catch(() => ({}))) as unknown
    const n =
      isRecord(body) && typeof body.n === 'number' && Number.isFinite(body.n)
        ? Math.max(1, Math.min(4, Math.floor(body.n)))
        : 4
    const variant = isRecord(body) ? coerceVariant(body.variant) : undefined

    const result = await generateCompanionAvatarCandidates(companion as any, { n, variant })
    return NextResponse.json({ prompt: result.prompt, items: result.items })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

