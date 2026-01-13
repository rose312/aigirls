// 数据库设置和类型定义
import { createClient } from '@supabase/supabase-js'

// 数据库类型定义
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
  appearance_config: AppearanceConfig
  personality_config: PersonalityConfig
  background?: string
  avatar_url?: string
  is_public: boolean
  intimacy_level: number
  intimacy_points: number
  created_at: string
  updated_at: string
}

export interface AppearanceConfig {
  faceType: string
  hairStyle: string
  hairColor: string
  bodyType: string
  clothingStyle: string
  customPrompt?: string
  styleKeywords?: string[]
  avatarKey?: string
  avatarVariant?: 'studio' | 'cinematic' | 'outdoor' | 'street' | 'anime'
}

export type Gender = 'female' | 'male' | 'nonbinary'

export interface PersonalityConfig {
  type: 'gentle' | 'lively' | 'intellectual' | 'mysterious' | 'cute' | 'mature'
  traits: string[]
  speakingStyle: string
  interests: string[]
  gender?: Gender
  age?: number
  hobbies?: string[]
  skills?: string[]
  occupation?: string
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

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  reward_type: string
  reward_value: number
  is_claimed: boolean
  created_at: string
}

export interface PaymentOrder {
  id: string
  user_id: string
  plan: string
  amount: number
  currency: string
  payment_method: string
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  external_order_id?: string
  paid_at?: string
  created_at: string
}

// 数据库类型映射
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: []
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at'>>
        Relationships: []
      }
      companions: {
        Row: Companion
        Insert: Omit<Companion, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Companion, 'id' | 'created_at'>>
        Relationships: []
      }
      chat_messages: {
        Row: ChatMessage
        Insert: Omit<ChatMessage, 'id' | 'created_at'>
        Update: Partial<Omit<ChatMessage, 'id' | 'created_at'>>
        Relationships: []
      }
      daily_message_quotas: {
        Row: DailyMessageQuota
        Insert: Omit<DailyMessageQuota, 'id' | 'last_reset_at'>
        Update: Partial<Omit<DailyMessageQuota, 'id'>>
        Relationships: []
      }
      referrals: {
        Row: Referral
        Insert: Omit<Referral, 'id' | 'created_at'>
        Update: Partial<Omit<Referral, 'id' | 'created_at'>>
        Relationships: []
      }
      payment_orders: {
        Row: PaymentOrder
        Insert: Omit<PaymentOrder, 'id' | 'created_at'>
        Update: Partial<Omit<PaymentOrder, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      check_message_quota: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      update_intimacy_points: {
        Args: { 
          p_user_id: string
          p_companion_id: string
          p_points?: number
        }
        Returns: number
      }
    }
  }
}

// 创建类型化的Supabase客户端
export const createTypedSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 服务端客户端（使用service role key）
export const createSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// 预设伴侣类型配置
export const COMPANION_PRESETS = {
  neighbor: {
    name: '邻家女孩',
    appearance: {
      faceType: 'sweet',
      hairStyle: 'long_straight',
      hairColor: 'brown',
      bodyType: 'slim',
      clothingStyle: 'casual'
    },
    personality: {
      type: 'gentle' as const,
      traits: ['温柔', '体贴', '善良', '天真'],
      speakingStyle: '温和亲切，语气轻柔',
      interests: ['看书', '听音乐', '散步', '烘焙'],
      gender: 'female' as const,
      age: 23,
      hobbies: ['烘焙', '拍照', '种花'],
      skills: ['情绪安抚', '生活建议', '轻松聊天'],
      occupation: '自由职业者'
    }
  },
  office: {
    name: '职场精英',
    appearance: {
      faceType: 'mature',
      hairStyle: 'short_bob',
      hairColor: 'black',
      bodyType: 'athletic',
      clothingStyle: 'business'
    },
    personality: {
      type: 'intellectual' as const,
      traits: ['聪明', '独立', '自信', '理性'],
      speakingStyle: '专业干练，逻辑清晰',
      interests: ['工作', '学习', '健身', '投资'],
      gender: 'female' as const,
      age: 27,
      hobbies: ['健身', '咖啡', '阅读'],
      skills: ['目标规划', '学习陪伴', '理性分析'],
      occupation: '产品经理'
    }
  },
  student: {
    name: '学生妹妹',
    appearance: {
      faceType: 'youthful',
      hairStyle: 'twin_tails',
      hairColor: 'light_brown',
      bodyType: 'petite',
      clothingStyle: 'school_uniform'
    },
    personality: {
      type: 'cute' as const,
      traits: ['活泼', '好奇', '纯真', '热情'],
      speakingStyle: '活泼可爱，充满活力',
      interests: ['学习', '动漫', '游戏', '交友'],
      gender: 'female' as const,
      age: 21,
      hobbies: ['动漫', '拍vlog', '逛街'],
      skills: ['活跃气氛', '聊天接梗', '陪伴学习'],
      occupation: '大学生'
    }
  }
}

// 数据库初始化检查
export async function checkDatabaseSetup() {
  const supabase = createTypedSupabaseClient()
  
  try {
    // 检查表是否存在
    const { data: profiles } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    const { data: companions } = await supabase
      .from('companions')
      .select('count')
      .limit(1)
    
    console.log('✅ 数据库连接正常')
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', error)
    return false
  }
}
