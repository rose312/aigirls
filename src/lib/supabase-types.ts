// 简化的Supabase类型定义，避免复杂的类型推断问题
import { createClient } from '@supabase/supabase-js'

// 基础数据类型
export interface Profile {
  id: string
  username: string
  username_lower: string
  avatar_url?: string
  language: 'zh' | 'en'
  referral_code: string
  referred_by?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  type: 'free' | 'premium'
  plan?: 'monthly' | 'yearly'
  start_date?: string
  end_date?: string
  daily_message_limit: number
  features: string[]
  created_at: string
  updated_at: string
}

export interface Companion {
  id: string
  user_id: string
  name: string
  companion_type: 'neighbor' | 'office' | 'student' | 'custom'
  appearance_config: any
  personality_config: any
  background?: string
  avatar_url?: string
  is_public: boolean
  intimacy_level: number
  intimacy_points: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  companion_id: string
  sender_type: 'user' | 'companion'
  content: string
  message_type: 'text' | 'voice' | 'image'
  metadata?: any
  created_at: string
}

export interface DailyMessageQuota {
  id: string
  user_id: string
  date: string
  message_count: number
  last_reset_at: string
}

export interface PaymentOrder {
  id: string
  user_id: string
  plan: 'monthly' | 'yearly'
  amount: number
  currency: string
  payment_method?: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  external_order_id?: string
  external_transaction_id?: string
  paid_at?: string
  created_at: string
}

// 创建不带类型约束的Supabase客户端
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createSupabaseServerClient(token?: string) {
  if (token) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    client.auth.setSession({ access_token: token, refresh_token: '' } as any)
    return client
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}