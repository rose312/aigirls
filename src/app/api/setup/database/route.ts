import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-types'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const supabase = createSupabaseServerClient()
    
    // 简单测试数据库连接
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: '数据库表不存在，请在Supabase控制台手动运行SQL schema',
          error: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: '数据库已经设置完成！' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: '请在Supabase控制台手动运行SQL schema',
        error: error.message 
      },
      { status: 500 }
    )
  }
}