import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { checkPromptSafety } from '@/lib/prompt-safety'
import { generateImages, getImageProvider, getMissingImageProviderEnv } from '@/lib/image-generation'
import type { AvatarVariant } from '@/lib/companion-avatar'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceVariant(value: unknown): AvatarVariant | undefined {
  return value === 'studio' || value === 'cinematic' || value === 'outdoor' || value === 'street' || value === 'anime'
    ? value
    : undefined
}

function clampAge(age: unknown) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return undefined
  return Math.max(21, Math.min(60, Math.floor(age)))
}

function buildVariantHint(variant: AvatarVariant) {
  const hints: Record<AvatarVariant, string> = {
    studio: 'studio portrait, clean seamless background, premium beauty lighting',
    cinematic: 'cinematic portrait, dramatic rim light, film color grading, premium look',
    outdoor: 'outdoor portrait, golden hour, natural light, bokeh background, candid elegance',
    street: 'fashion street portrait, urban background, stylish outfit, editorial vibe',
    anime: 'anime illustration portrait, high detail, soft shading, beautiful character design'
  }
  return hints[variant] ?? hints.studio
}

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

    const body = (await request.json().catch(() => ({}))) as unknown
    if (!isRecord(body)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 })
    }

    const n =
      typeof body.n === 'number' && Number.isFinite(body.n)
        ? Math.max(1, Math.min(4, Math.floor(body.n)))
        : 4

    const variant = coerceVariant(body.variant) ?? 'studio'

    const appearance = isRecord(body.appearance_config) ? body.appearance_config : {}
    const personality = isRecord(body.personality_config) ? body.personality_config : {}
    const gender = typeof personality.gender === 'string' ? personality.gender : 'female'
    const age = clampAge(personality.age) ?? 23
    const occupation = typeof personality.occupation === 'string' ? personality.occupation : ''
    const hobbies = Array.isArray(personality.hobbies) ? personality.hobbies.filter((x) => typeof x === 'string').slice(0, 3) : []

    const styleKeywords = Array.isArray((appearance as any).styleKeywords)
      ? ((appearance as any).styleKeywords as unknown[]).filter((x) => typeof x === 'string').slice(0, 10)
      : []
    const customPrompt = typeof (appearance as any).customPrompt === 'string' ? String((appearance as any).customPrompt).trim() : ''

    const base = [
      `high-quality ${gender === 'male' ? 'handsome adult man' : gender === 'nonbinary' ? 'androgynous adult portrait' : 'beautiful adult woman'} portrait`,
      `age ${age}`,
      'fully covered outfit, non see-through, classy fashion',
      occupation ? `occupation vibe: ${occupation}` : '',
      hobbies.length > 0 ? `hobby vibe: ${hobbies.join(', ')}` : '',
      buildVariantHint(variant),
      'soft cinematic lighting, premium magazine look, natural skin texture',
      '85mm lens, shallow depth of field, clean background, sharp focus, high detail'
    ]
      .filter(Boolean)
      .join(', ')

    const prompt = [customPrompt, styleKeywords.length > 0 ? styleKeywords.join(', ') : '', base]
      .filter(Boolean)
      .join(', ')
      .slice(0, 1200)

    const safety = checkPromptSafety(prompt, 'standard')
    if (!safety.ok) {
      return NextResponse.json({ error: safety.message }, { status: 400 })
    }

    const provider = getImageProvider()
    const missing = getMissingImageProviderEnv(provider)
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `服务器未配置：${missing.join(', ')}。请在 .env.local 里设置后重试。` },
        { status: 501 }
      )
    }

    const result = await generateImages({
      prompt,
      n,
      size: '1024x1024',
      quality: 'auto'
    })

    const images = result.b64Images
      .filter((x) => typeof x === 'string' && x.length > 0)
      .slice(0, 4)
      .map((b64) => `data:${result.mime};base64,${b64}`)

    return NextResponse.json({
      prompt,
      items: images,
      provider: result.provider,
      model: result.model
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

