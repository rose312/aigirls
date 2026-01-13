import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { generateCompanionDraft, parseCsvList } from '@/lib/companion-generator'
import type { Gender, PersonalityConfig } from '@/lib/database-setup'

export const runtime = 'nodejs'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceCompanionType(value: unknown) {
  return value === 'neighbor' || value === 'office' || value === 'student' || value === 'custom'
    ? value
    : null
}

function coerceGender(value: unknown): Gender | undefined {
  return value === 'female' || value === 'male' || value === 'nonbinary' ? value : undefined
}

function coercePersonalityType(value: unknown): PersonalityConfig['type'] | undefined {
  return value === 'gentle' ||
    value === 'lively' ||
    value === 'intellectual' ||
    value === 'mysterious' ||
    value === 'cute' ||
    value === 'mature'
    ? value
    : undefined
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

    const body = (await request.json()) as unknown
    if (!isRecord(body)) {
      return NextResponse.json({ error: '无效请求' }, { status: 400 })
    }

    const companion_type = coerceCompanionType(body.companion_type)
    if (!companion_type) {
      return NextResponse.json({ error: '无效的 companion_type' }, { status: 400 })
    }

    const gender = coerceGender(body.gender)
    const age = typeof body.age === 'number' && Number.isFinite(body.age) ? body.age : undefined
    const personalityType = coercePersonalityType(body.personalityType)
    const preference = typeof body.preference === 'string' ? body.preference : undefined
    const interests = parseCsvList((body as any).interests)
    const skills = parseCsvList((body as any).skills)

    const draft = await generateCompanionDraft({
      companion_type,
      language: 'zh',
      preference,
      gender,
      age,
      personalityType,
      interests,
      skills
    })

    return NextResponse.json({ draft })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

