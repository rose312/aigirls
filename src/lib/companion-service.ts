// 前端伴侣服务（通过 Next.js API Routes）
import { createSupabaseClient } from './supabase-types'
import { apiCache } from './cache-manager'
import { monitoredFetch } from './api-monitor'
import type { Companion } from './supabase-types'

export interface AppearanceConfig {
  faceType: string
  hairStyle: string
  hairColor: string
  bodyType: string
  clothingStyle: string
  customPrompt?: string
  styleKeywords?: string[]
  avatarKey?: string
}

export interface PersonalityConfig {
  type: 'gentle' | 'lively' | 'intellectual' | 'mysterious' | 'cute' | 'mature'
  traits: string[]
  speakingStyle: string
  interests: string[]
  gender?: 'female' | 'male' | 'nonbinary'
  age?: number
  hobbies?: string[]
  skills?: string[]
  occupation?: string
}

export interface CreateCompanionRequest {
  name: string
  companion_type: 'neighbor' | 'office' | 'student' | 'custom'
  appearance_config?: AppearanceConfig
  personality_config?: PersonalityConfig
  background?: string
  is_public?: boolean
  generate_avatar?: boolean
  avatar_data_url?: string
}

async function requireAccessToken() {
  const supabase = createSupabaseClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  if (!session?.access_token) throw new Error('用户未登录')
  return session.access_token
}

export async function createCompanion(
  userId: string,
  request: CreateCompanionRequest
): Promise<Companion> {
  const token = await requireAccessToken()

  const response = await fetch('/api/companions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(request)
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '创建伴侣失败')
  }

  return payload.companion as Companion
}

export async function getUserCompanions(userId: string): Promise<Companion[]> {
  const token = await requireAccessToken()

  const response = await fetch('/api/companions', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '获取伴侣列表失败')
  }

  return (payload.companions || []) as Companion[]
}

export async function getCompanion(companionId: string, userId?: string): Promise<Companion | null> {
  const token = await requireAccessToken()

  const response = await fetch(`/api/companions/${encodeURIComponent(companionId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const payload = await response.json().catch(() => ({}))
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(payload?.error || '获取伴侣失败')
  }

  return (payload.companion || null) as Companion | null
}

export async function updateCompanion(
  companionId: string,
  updates: Partial<CreateCompanionRequest> & {
    avatar_url?: string | null
  }
): Promise<Companion> {
  const token = await requireAccessToken()

  const response = await fetch(`/api/companions/${encodeURIComponent(companionId)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '更新伴侣失败')
  }

  return payload.companion as Companion
}

export async function deleteCompanion(companionId: string): Promise<void> {
  const token = await requireAccessToken()

  const response = await fetch(`/api/companions/${encodeURIComponent(companionId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || '删除伴侣失败')
  }
}
