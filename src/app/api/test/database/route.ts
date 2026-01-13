import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // 尝试查询profiles表
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: '数据库表不存在，请运行SQL schema',
          error: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      status: 'success', 
      message: '数据库连接正常' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: '数据库连接失败',
        error: error.message 
      },
      { status: 500 }
    )
  }
}