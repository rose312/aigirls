import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getQiniuPublicUrlForKey, isQiniuConfigured, isQiniuPrivateBucket, signQiniuGetUrlForKey } from '@/lib/qiniu-s3'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function looksLikeDataImageUrl(value: string) {
  return value.startsWith('data:image/')
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
    if (!isRecord(body)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 })
    }

    const key = typeof body.key === 'string' ? body.key.trim() : ''
    const dataUrl = typeof body.dataUrl === 'string' ? body.dataUrl.trim() : ''

    let avatar_url: string | null = null
    let avatarKey: string | null = null

    if (key) {
      const prefix = `companions/${id}/`
      if (!key.startsWith(prefix)) {
        return NextResponse.json({ error: '非法 key' }, { status: 400 })
      }
      if (!isQiniuConfigured()) {
        return NextResponse.json({ error: '未配置七牛，无法使用 key 设头像' }, { status: 400 })
      }

      avatarKey = key
      if (isQiniuPrivateBucket()) {
        const signed = await signQiniuGetUrlForKey(key)
        avatar_url = signed.url
      } else {
        avatar_url = getQiniuPublicUrlForKey(key)
      }
    } else if (dataUrl) {
      if (!looksLikeDataImageUrl(dataUrl)) {
        return NextResponse.json({ error: '非法 dataUrl' }, { status: 400 })
      }
      // Avoid accidental giant writes.
      if (dataUrl.length > 2_000_000) {
        return NextResponse.json({ error: '图片过大，请配置七牛存储' }, { status: 400 })
      }
      avatar_url = dataUrl
      avatarKey = null
    } else {
      return NextResponse.json({ error: '缺少 key 或 dataUrl' }, { status: 400 })
    }

    const nextAppearance = {
      ...(companion as any).appearance_config,
      avatarKey: avatarKey ?? undefined
    }

    const { data: updated, error: upErr } = await supabase
      .from('companions')
      .update({
        avatar_url,
        appearance_config: nextAppearance,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (upErr) throw upErr
    return NextResponse.json({ companion: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

