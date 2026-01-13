// 服务端伴侣服务（用于 Next.js API Routes）
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Companion, AppearanceConfig, PersonalityConfig } from './database-setup'
import { COMPANION_PRESETS } from './database-setup'
import { apiCache, queryCache } from './cache-manager'
import { apiMonitor } from './api-monitor'

export type CreateCompanionRequest = {
  name: string
  companion_type: 'neighbor' | 'office' | 'student' | 'custom'
  appearance_config?: AppearanceConfig
  personality_config?: PersonalityConfig
  background?: string
  is_public?: boolean
}

function defaultBackground(type: CreateCompanionRequest['companion_type']) {
  const backgrounds: Record<CreateCompanionRequest['companion_type'], string> = {
    neighbor:
      '我住在你隔壁，是个温柔可爱的邻家女孩。喜欢安静的生活，也很享受和你聊天的时光。',
    office:
      '我是一名职场精英，工作忙碌但热爱成长。希望在忙碌之外，能和你分享彼此的日常与想法。',
    student:
      '我是一名大学生，对世界充满好奇。学习之余喜欢动漫、音乐和交朋友，和你聊天让我很开心！',
    custom:
      '我是一个独特的存在，有着自己的故事和个性。希望能了解你，也希望你能了解我。'
  }
  return backgrounds[type] ?? backgrounds.custom
}

function defaultCustomAppearance(): AppearanceConfig {
  return {
    faceType: 'sweet',
    hairStyle: 'long_straight',
    hairColor: 'brown',
    bodyType: 'slim',
    clothingStyle: 'casual'
  }
}

function defaultCustomPersonality(): PersonalityConfig {
  return {
    type: 'gentle',
    traits: ['温柔', '体贴', '善良'],
    speakingStyle: '温和亲切，语气轻柔',
    interests: ['聊天', '音乐', '散步']
  }
}

function resolveConfigs(request: CreateCompanionRequest): {
  appearance_config: AppearanceConfig
  personality_config: PersonalityConfig
} {
  const base =
    request.companion_type !== 'custom'
      ? {
          appearance: COMPANION_PRESETS[request.companion_type].appearance,
          personality: COMPANION_PRESETS[request.companion_type].personality as PersonalityConfig
        }
      : {
          appearance: defaultCustomAppearance(),
          personality: defaultCustomPersonality()
        }

  const appearance_config: AppearanceConfig = {
    ...base.appearance,
    ...(request.appearance_config ?? {})
  }

  const mergedTraits =
    request.personality_config?.traits && Array.isArray(request.personality_config.traits)
      ? request.personality_config.traits
      : base.personality.traits

  const mergedInterests =
    request.personality_config?.interests && Array.isArray(request.personality_config.interests)
      ? request.personality_config.interests
      : base.personality.interests

  const mergedHobbies =
    request.personality_config?.hobbies && Array.isArray(request.personality_config.hobbies)
      ? request.personality_config.hobbies
      : base.personality.hobbies

  const mergedSkills =
    request.personality_config?.skills && Array.isArray(request.personality_config.skills)
      ? request.personality_config.skills
      : base.personality.skills

  const rawAge = request.personality_config?.age ?? base.personality.age
  const age = typeof rawAge === 'number' && Number.isFinite(rawAge) ? Math.max(21, Math.min(60, Math.floor(rawAge))) : undefined

  const personality_config: PersonalityConfig = {
    ...base.personality,
    ...(request.personality_config ?? {}),
    traits: mergedTraits,
    interests: mergedInterests,
    hobbies: mergedHobbies,
    skills: mergedSkills,
    age
  }

  return { appearance_config, personality_config }
}

export async function createCompanionServer(
  supabase: SupabaseClient,
  userId: string,
  request: CreateCompanionRequest
): Promise<Companion> {
  const startTime = Date.now()
  
  try {
    const name = request.name?.trim()
    if (!name) throw new Error('伴侣名称不能为空')

    const { appearance_config, personality_config } = resolveConfigs(request)
    const background = (request.background ?? '').trim() || defaultBackground(request.companion_type)
    const is_public = Boolean(request.is_public)

    const { data, error } = await supabase
      .from('companions')
      .insert({
        user_id: userId,
        name,
        companion_type: request.companion_type,
        appearance_config,
        personality_config,
        background,
        is_public,
        intimacy_level: 1,
        intimacy_points: 0
      })
      .select('*')
      .single()

    if (error) throw error
    
    const companion = data as Companion
    
    // 缓存新创建的伴侣数据
    apiCache.cacheCompanionData(companion.id, companion, 15 * 60 * 1000)
    
    // 清除用户伴侣列表缓存
    apiCache.delete(`user_companions_${userId}`)
    
    // 记录API性能
    apiMonitor.recordAPICall(
      '/api/companions',
      'POST',
      Date.now() - startTime,
      200
    )
    
    return companion
  } catch (error) {
    // 记录错误
    apiMonitor.recordAPICall(
      '/api/companions',
      'POST',
      Date.now() - startTime,
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  }
}

export async function getCompanionServer(
  supabase: SupabaseClient,
  companionId: string,
  userId?: string
): Promise<Companion | null> {
  const startTime = Date.now()
  
  try {
    // 尝试从缓存获取
    const cached = apiCache.getCachedCompanionData(companionId)
    if (cached) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'GET',
        Date.now() - startTime,
        200
      )
      return cached
    }

    let query = supabase.from('companions').select('*').eq('id', companionId)

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query.maybeSingle()
    
    if (error) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'GET',
        Date.now() - startTime,
        500,
        error.message
      )
      return null
    }
    
    if (!data) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'GET',
        Date.now() - startTime,
        404,
        'Companion not found'
      )
      return null
    }
    
    const companion = data as Companion
    
    // 缓存结果
    apiCache.cacheCompanionData(companionId, companion, 15 * 60 * 1000)
    
    apiMonitor.recordAPICall(
      `/api/companions/${companionId}`,
      'GET',
      Date.now() - startTime,
      200
    )
    
    return companion
  } catch (error) {
    apiMonitor.recordAPICall(
      `/api/companions/${companionId}`,
      'GET',
      Date.now() - startTime,
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
    return null
  }
}

export async function updateCompanionServer(
  supabase: SupabaseClient,
  companionId: string,
  userId: string,
  updates: Partial<CreateCompanionRequest> & {
    avatar_url?: string | null
    intimacy_level?: number
    intimacy_points?: number
  }
): Promise<Companion> {
  const startTime = Date.now()
  
  try {
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (typeof updates.name === 'string') patch.name = updates.name.trim()
    if (typeof updates.background === 'string') patch.background = updates.background
    if (typeof updates.is_public === 'boolean') patch.is_public = updates.is_public
    if (updates.appearance_config) patch.appearance_config = updates.appearance_config
    if (updates.personality_config) {
      const rawAge = (updates.personality_config as any)?.age
      const age =
        typeof rawAge === 'number' && Number.isFinite(rawAge)
          ? Math.max(21, Math.min(60, Math.floor(rawAge)))
          : rawAge
      patch.personality_config = { ...(updates.personality_config as any), ...(age ? { age } : {}) }
    }
    if ('avatar_url' in updates) {
      // Table column允许 NULL，但类型里是 string | undefined；这里做一次窄化/兼容。
      patch.avatar_url = (updates.avatar_url ?? undefined) as any
    }
    if (typeof updates.intimacy_level === 'number') patch.intimacy_level = updates.intimacy_level
    if (typeof updates.intimacy_points === 'number') patch.intimacy_points = updates.intimacy_points

    const { data, error } = await supabase
      .from('companions')
      .update(patch)
      .eq('id', companionId)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()

    if (error) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'PUT',
        Date.now() - startTime,
        500,
        error.message
      )
      throw error
    }
    
    if (!data) {
      const errorMsg = '伴侣未找到或无权限'
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'PUT',
        Date.now() - startTime,
        404,
        errorMsg
      )
      throw new Error(errorMsg)
    }
    
    const companion = data as Companion
    
    // 更新缓存
    apiCache.cacheCompanionData(companionId, companion, 15 * 60 * 1000)
    
    // 清除用户伴侣列表缓存
    apiCache.delete(`user_companions_${userId}`)
    
    apiMonitor.recordAPICall(
      `/api/companions/${companionId}`,
      'PUT',
      Date.now() - startTime,
      200
    )
    
    return companion
  } catch (error) {
    if (!(error instanceof Error && error.message === '伴侣未找到或无权限')) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'PUT',
        Date.now() - startTime,
        500,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
    throw error
  }
}

export async function deleteCompanionServer(
  supabase: SupabaseClient,
  companionId: string,
  userId: string
): Promise<void> {
  const startTime = Date.now()
  
  try {
    const { error } = await supabase.from('companions').delete().eq('id', companionId).eq('user_id', userId)
    
    if (error) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'DELETE',
        Date.now() - startTime,
        500,
        error.message
      )
      throw error
    }
    
    // 清除相关缓存
    apiCache.delete(`companion_${companionId}`)
    apiCache.delete(`user_companions_${userId}`)
    
    apiMonitor.recordAPICall(
      `/api/companions/${companionId}`,
      'DELETE',
      Date.now() - startTime,
      200
    )
  } catch (error) {
    if (!(error instanceof Error)) {
      apiMonitor.recordAPICall(
        `/api/companions/${companionId}`,
        'DELETE',
        Date.now() - startTime,
        500,
        'Unknown error'
      )
    }
    throw error
  }
}

// 获取用户伴侣列表（带缓存）
export async function getUserCompanionsServer(
  supabase: SupabaseClient,
  userId: string
): Promise<Companion[]> {
  const startTime = Date.now()
  const cacheKey = `user_companions_${userId}`
  
  try {
    // 尝试从缓存获取
    const cached = apiCache.get<Companion[]>(cacheKey)
    if (cached) {
      apiMonitor.recordAPICall(
        '/api/companions',
        'GET',
        Date.now() - startTime,
        200
      )
      return cached
    }

    const { data, error } = await supabase
      .from('companions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      apiMonitor.recordAPICall(
        '/api/companions',
        'GET',
        Date.now() - startTime,
        500,
        error.message
      )
      throw error
    }

    const companions = (data || []) as Companion[]
    
    // 缓存结果
    apiCache.set(cacheKey, companions, 10 * 60 * 1000) // 10分钟缓存
    
    // 同时缓存每个伴侣的详细信息
    companions.forEach(companion => {
      apiCache.cacheCompanionData(companion.id, companion, 15 * 60 * 1000)
    })
    
    apiMonitor.recordAPICall(
      '/api/companions',
      'GET',
      Date.now() - startTime,
      200
    )
    
    return companions
  } catch (error) {
    apiMonitor.recordAPICall(
      '/api/companions',
      'GET',
      Date.now() - startTime,
      500,
      error instanceof Error ? error.message : 'Unknown error'
    )
    throw error
  }
}
