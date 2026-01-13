// 服务端对话服务（用于 Next.js API Routes）
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatMessage, Companion } from './database-setup'
import { generateCompanionResponse, moderateContent } from './deepseek-chat'

export interface SendMessageRequest {
  companionId: string
  content: string
  messageType?: 'text' | 'voice' | 'image'
}

export interface SendMessageResponse {
  message: ChatMessage
  companionResponse: ChatMessage
  intimacyLevel: number
  quotaRemaining?: number
}

type SubscriptionInfo = {
  type: 'free' | 'premium'
  daily_message_limit: number
  end_date: string | null
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

async function getSubscriptionInfo(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionInfo> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { type: 'free', daily_message_limit: 20, end_date: null }
  }

  const row = data as unknown as {
    type?: unknown
    daily_message_limit?: unknown
    end_date?: unknown
  }

  return {
    type: (row.type as 'free' | 'premium') ?? 'free',
    daily_message_limit: typeof row.daily_message_limit === 'number' ? row.daily_message_limit : 20,
    end_date: (row.end_date as string | null) ?? null
  }
}

function isPremiumActive(sub: SubscriptionInfo) {
  if (sub.type !== 'premium') return false
  if (!sub.end_date) return true
  return new Date(sub.end_date).getTime() > Date.now()
}

async function getTodayQuotaCount(supabase: SupabaseClient, userId: string): Promise<number> {
  const today = todayIsoDate()
  const { data, error } = await supabase
    .from('daily_message_quotas')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle()

  if (error) return 0

  const row = data as unknown as { message_count?: unknown } | null
  return typeof row?.message_count === 'number' ? row.message_count : 0
}

async function setTodayQuotaCount(
  supabase: SupabaseClient,
  userId: string,
  count: number
) {
  const today = todayIsoDate()
  // NOTE: Supabase-js's generated typings can be brittle for upsert with partial selects.
  // Keep runtime correct while we iterate on schema typing.
  await (supabase.from('daily_message_quotas') as any).upsert(
    {
      user_id: userId,
      date: today,
      message_count: count
    },
    { onConflict: 'user_id,date' }
  )
}

async function getOwnedCompanionOrThrow(
  supabase: SupabaseClient,
  userId: string,
  companionId: string
): Promise<Companion> {
  const { data, error } = await supabase
    .from('companions')
    .select('*')
    .eq('id', companionId)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('伴侣不存在或无权限访问')
  return data as Companion
}

async function bumpIntimacy(
  supabase: SupabaseClient,
  userId: string,
  companion: Companion,
  points: number
) {
  const currentPoints = typeof companion.intimacy_points === 'number' ? companion.intimacy_points : 0
  const nextPoints = currentPoints + points
  const nextLevel = Math.max(1, Math.floor(nextPoints / 100) + 1)

  const { data, error } = await supabase
    .from('companions')
    .update({
      intimacy_points: nextPoints,
      intimacy_level: nextLevel,
      updated_at: new Date().toISOString()
    })
    .eq('id', companion.id)
    .eq('user_id', userId)
    .select('intimacy_level')
    .single()

  if (error) return companion.intimacy_level
  return (data?.intimacy_level as number) ?? nextLevel
}

export async function sendMessageServer(
  supabase: SupabaseClient,
  userId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const content = request.content?.trim()
  if (!content) throw new Error('消息内容不能为空')

  // 1) 消息配额检查
  const sub = await getSubscriptionInfo(supabase, userId)
  let quotaRemaining: number | undefined

  if (!isPremiumActive(sub)) {
    const used = await getTodayQuotaCount(supabase, userId)
    if (used >= sub.daily_message_limit) {
      throw new Error('今日消息数量已达上限，请升级到Premium获得无限对话')
    }
    quotaRemaining = Math.max(0, sub.daily_message_limit - (used + 1))
  }

  // 2) 内容安全检查
  if (!moderateContent(content)) {
    throw new Error('消息内容不符合社区规范，请修改后重试')
  }

  // 3) 获取伴侣信息（仅允许与自己创建的伴侣对话）
  const companion = await getOwnedCompanionOrThrow(supabase, userId, request.companionId)

  // 4) 获取对话历史（用于上下文）
  const chatHistory = await getChatHistoryServer(supabase, userId, request.companionId, 10)

  // 5) 保存用户消息
  const { data: userMessage, error: userError } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      companion_id: request.companionId,
      sender_type: 'user',
      content,
      message_type: request.messageType || 'text'
    })
    .select('*')
    .single()

  if (userError) throw userError

  // 6) 生成 AI 回复
  const aiResponse = await generateCompanionResponse(companion, content, chatHistory)

  // 7) 保存 AI 回复
  const { data: companionMessage, error: companionError } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      companion_id: request.companionId,
      sender_type: 'companion',
      content: aiResponse,
      message_type: 'text'
    })
    .select('*')
    .single()

  if (companionError) throw companionError

  // 8) 更新消息配额（免费用户）
  if (!isPremiumActive(sub)) {
    const used = await getTodayQuotaCount(supabase, userId)
    await setTodayQuotaCount(supabase, userId, used + 1)
  }

  // 9) 更新亲密度
  const newIntimacyLevel = await bumpIntimacy(supabase, userId, companion, 1)

  return {
    message: userMessage as ChatMessage,
    companionResponse: companionMessage as ChatMessage,
    intimacyLevel: newIntimacyLevel,
    quotaRemaining
  }
}

export async function getChatHistoryServer(
  supabase: SupabaseClient,
  userId: string,
  companionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('companion_id', companionId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).reverse() as ChatMessage[]
}

export async function deleteChatHistory(
  supabase: SupabaseClient,
  userId: string,
  companionId: string
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('user_id', userId)
    .eq('companion_id', companionId)

  if (error) throw error
}
