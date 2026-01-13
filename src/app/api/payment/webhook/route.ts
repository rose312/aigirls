import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-types'

export const runtime = 'nodejs'

// 支付回调处理
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, status, transaction_id } = body

    // 在实际应用中，这里需要验证回调的签名和来源
    // 确保回调来自可信的支付服务提供商

    const supabase = createSupabaseServerClient()

    // 获取订单信息
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('external_order_id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '订单状态异常' }, { status: 400 })
    }

    // 更新订单状态
    const { error: updateError } = await supabase
      .from('payment_orders')
      .update({
        status: status === 'success' ? 'paid' : 'failed',
        paid_at: status === 'success' ? new Date().toISOString() : null,
        external_transaction_id: transaction_id
      })
      .eq('id', order.id)

    if (updateError) {
      return NextResponse.json({ error: '更新订单失败' }, { status: 500 })
    }

    // 如果支付成功，更新用户订阅
    if (status === 'success') {
      const planDuration = {
        monthly: 30,
        yearly: 365
      }

      const duration = planDuration[order.plan as keyof typeof planDuration] || 30
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + duration)

      // 更新用户订阅为Premium
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          type: 'premium',
          plan: order.plan,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          daily_message_limit: -1, // 无限制
          features: ['unlimited_chat', 'voice_messages', 'exclusive_content'],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', order.user_id)

      if (subscriptionError) {
        console.error('更新订阅失败:', subscriptionError)
        // 这里可以记录错误日志，但不影响支付回调的响应
      }
    }

    return NextResponse.json({ 
      success: true,
      message: '回调处理成功'
    })
  } catch (error: any) {
    console.error('支付回调处理失败:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}