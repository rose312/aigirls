import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-types'

export const runtime = 'nodejs'

// 创建支付订单
export async function POST(request: NextRequest) {
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
    const { plan, payment_method } = body

    // 验证计划
    const validPlans = {
      monthly: { amount: 39, currency: 'CNY', duration: 30 },
      yearly: { amount: 299, currency: 'CNY', duration: 365 }
    }

    if (!validPlans[plan as keyof typeof validPlans]) {
      return NextResponse.json({ error: '无效的订阅计划' }, { status: 400 })
    }

    const planInfo = validPlans[plan as keyof typeof validPlans]

    // 创建支付订单记录
    const { data: order, error } = await supabase
      .from('payment_orders')
      .insert({
        user_id: user.id,
        plan,
        amount: planInfo.amount,
        currency: planInfo.currency,
        payment_method,
        status: 'pending',
        external_order_id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
    }

    // 这里应该集成真实的支付服务（支付宝、微信支付等）
    // 目前返回模拟的支付信息
    const paymentInfo = {
      order_id: order.id,
      external_order_id: order.external_order_id,
      amount: planInfo.amount,
      currency: planInfo.currency,
      payment_url: `/payment/mock?order_id=${order.id}`, // 模拟支付页面
      qr_code: null // 实际应用中这里会是支付二维码
    }

    return NextResponse.json({ 
      order,
      payment_info: paymentInfo,
      message: '订单创建成功，请完成支付'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}