// 前端对话服务（通过 Next.js API Routes）
import { getSupabase } from './supabase'
import type { ChatMessage } from './database-setup'

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

async function requireAccessToken() {
  const supabase = getSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session?.access_token) throw new Error('用户未登录')
  return session.access_token
}

export async function getChatHistory(
  userId: string,
  companionId: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  const token = await requireAccessToken()

  const response = await fetch(`/api/chat/${encodeURIComponent(companionId)}?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '获取对话历史失败')
  }

  return (payload.messages || []) as ChatMessage[]
}

export async function sendMessage(
  userId: string,
  request: SendMessageRequest
): Promise<SendMessageResponse> {
  const token = await requireAccessToken()

  const response = await fetch(`/api/chat/${encodeURIComponent(request.companionId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      content: request.content,
      messageType: request.messageType
    })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '发送消息失败')
  }

  return payload as SendMessageResponse
}
