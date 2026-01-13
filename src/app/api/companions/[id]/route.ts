import { NextRequest, NextResponse } from 'next/server'
import {
  getCompanionServer,
  updateCompanionServer,
  deleteCompanionServer
} from '@/lib/companion-service-simple'
import { createSupabaseServerClient } from '@/lib/supabase-types'
import { isQiniuConfigured, isQiniuPrivateBucket, signQiniuGetUrlForKey } from '@/lib/qiniu-s3'

export const runtime = 'nodejs'

// GET /api/companions/[id] - 获取单个伴侣
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get('authorization')

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      
      // 使用 supabase-server.ts 中的函数
      const { getSupabaseServerClient } = await import('@/lib/supabase-server')
      const supabase = getSupabaseServerClient(token)
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('认证错误:', authError)
        return NextResponse.json({ error: '用户未找到' }, { status: 401 })
      }

      let companion: any = await getCompanionServer(supabase, id, user.id)
      if (!companion) {
        return NextResponse.json({ error: '伴侣未找到' }, { status: 404 })
      }

      if (isQiniuConfigured() && isQiniuPrivateBucket()) {
        const avatarKey = companion?.appearance_config?.avatarKey
        if (avatarKey) {
          try {
            const signed = await signQiniuGetUrlForKey(String(avatarKey))
            companion = { ...companion, avatar_url: signed.url }
          } catch {
            // ignore
          }
        }
      }

      return NextResponse.json({ companion })
    }

    // 无认证的公开访问
    const { getSupabaseServiceRoleClient } = await import('@/lib/supabase-server')
    const supabase = getSupabaseServiceRoleClient()
    
    let companion: any = await getCompanionServer(supabase, id, undefined)
    
    if (!companion) {
      return NextResponse.json({ error: '伴侣未找到' }, { status: 404 })
    }

    if (isQiniuConfigured() && isQiniuPrivateBucket()) {
      const avatarKey = companion?.appearance_config?.avatarKey
      if (avatarKey) {
        try {
          const signed = await signQiniuGetUrlForKey(String(avatarKey))
          companion = { ...companion, avatar_url: signed.url }
        } catch {
          // ignore
        }
      }
    }
    
    return NextResponse.json({ companion })
  } catch (error: any) {
    console.error('获取伴侣失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

// PUT /api/companions/[id] - 更新伴侣
export async function PUT(
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
    
    // 使用 supabase-server.ts 中的函数
    const { getSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    const body = await request.json()
    const companion = await updateCompanionServer(supabase, id, user.id, body)
    
    return NextResponse.json({ companion })
  } catch (error: any) {
    console.error('更新伴侣失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}

// DELETE /api/companions/[id] - 删除伴侣
export async function DELETE(
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
    
    // 使用 supabase-server.ts 中的函数
    const { getSupabaseServerClient } = await import('@/lib/supabase-server')
    const supabase = getSupabaseServerClient(token)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json({ error: '用户未找到' }, { status: 401 })
    }
    
    await deleteCompanionServer(supabase, id, user.id)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('删除伴侣失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器错误' },
      { status: 500 }
    )
  }
}