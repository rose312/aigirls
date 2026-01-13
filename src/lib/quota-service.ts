// 用户配额管理服务
import { createSupabaseClient } from './supabase-types'

export interface UserQuota {
  userId: string
  date: string
  messageCount: number
  dailyLimit: number
  isUnlimited: boolean
}

export async function getUserQuota(userId: string): Promise<UserQuota> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  
  // 获取用户订阅信息
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  const isUnlimited = subscription?.type === 'premium'
  const dailyLimit = subscription?.daily_message_limit || 20
  
  // 获取今日消息配额
  const { data: quota } = await supabase
    .from('daily_message_quotas')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()
  
  return {
    userId,
    date: today,
    messageCount: quota?.message_count || 0,
    dailyLimit,
    isUnlimited
  }
}

export async function incrementMessageCount(userId: string): Promise<UserQuota> {
  const supabase = createSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  
  // 使用 upsert 更新或创建配额记录
  const { error } = await supabase
    .from('daily_message_quotas')
    .upsert({
      user_id: userId,
      date: today,
      message_count: 1,
      last_reset_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,date',
      ignoreDuplicates: false
    })
  
  if (error) {
    // 如果 upsert 失败，尝试增量更新
    await supabase.rpc('increment_message_count', {
      p_user_id: userId,
      p_date: today
    })
  }
  
  return getUserQuota(userId)
}

export async function canSendMessage(userId: string): Promise<boolean> {
  const quota = await getUserQuota(userId)
  return quota.isUnlimited || quota.messageCount < quota.dailyLimit
}

export async function getRemainingMessages(userId: string): Promise<number> {
  const quota = await getUserQuota(userId)
  if (quota.isUnlimited) return -1 // 无限制
  return Math.max(0, quota.dailyLimit - quota.messageCount)
}