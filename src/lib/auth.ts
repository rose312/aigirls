// 认证服务
import { createSupabaseClient, createSupabaseServerClient } from './supabase-types'
import type { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  username?: string
  avatar_url?: string
  language: 'zh' | 'en'
  referral_code: string
}

// 注册用户
export async function signUp(email: string, password: string, username?: string, referralCode?: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        referred_by: referralCode
      }
    }
  })
  
  if (error) throw error
  return data
}

// 登录用户
export async function signIn(email: string, password: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

// 登出用户
export async function signOut() {
  const supabase = createSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// 获取用户档案
export async function getUserProfile(userId: string): Promise<AuthUser | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle() // 使用 maybeSingle() 而不是 single()
  
  if (error || !data) return null
  
  const profile = data as any
  
  return {
    id: profile.id,
    email: '', // 从auth.users获取
    username: profile.username,
    avatar_url: profile.avatar_url,
    language: profile.language,
    referral_code: profile.referral_code
  }
}

// 更新用户档案 - 暂时禁用
export async function updateUserProfile(userId: string, updates: Partial<AuthUser>) {
  throw new Error('功能开发中')
}

// 检查用户名是否可用
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle() // 使用 maybeSingle() 而不是 single()
  
  // 如果没有找到记录，说明用户名可用
  return !data
}

// 通过推荐码查找用户
export async function findUserByReferralCode(referralCode: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('referral_code', referralCode)
    .maybeSingle() // 使用 maybeSingle() 而不是 single()
  
  if (error || !data) return null
  return data
}

// 服务端获取用户（用于API路由）
export async function getServerUser(accessToken: string) {
  const supabase = createSupabaseServerClient(accessToken)
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  return user
}