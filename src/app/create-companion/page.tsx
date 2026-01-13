'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createCompanion } from '@/lib/companion-service'
import { getSupabase } from '@/lib/supabase'
import { COMPANION_PRESETS } from '@/lib/database-setup'
import type { Gender, PersonalityConfig } from '@/lib/database-setup'
import type { CreateCompanionRequest } from '@/lib/companion-service'

type AvatarVariant = 'studio' | 'cinematic' | 'outdoor' | 'street' | 'anime'

function CreateCompanionContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [step, setStep] = useState(1)
  const [generateAvatar, setGenerateAvatar] = useState(true)
  const [avatarVariant, setAvatarVariant] = useState<AvatarVariant>('studio')
  const [avatarCandidates, setAvatarCandidates] = useState<string[]>([])
  const [avatarPrompt, setAvatarPrompt] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [companionData, setCompanionData] = useState<CreateCompanionRequest>({
    name: '',
    companion_type: 'neighbor',
    background: '',
    is_public: false,
    appearance_config: COMPANION_PRESETS.neighbor.appearance,
    personality_config: COMPANION_PRESETS.neighbor.personality,
    generate_avatar: true
  })
  const [aiPreference, setAiPreference] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetType = searchParams.get('type') as keyof typeof COMPANION_PRESETS

  useEffect(() => {
    checkAuth()
    if (presetType && COMPANION_PRESETS[presetType]) {
      setCompanionData(prev => ({
        ...prev,
        companion_type: presetType,
        name: COMPANION_PRESETS[presetType].name,
        appearance_config: COMPANION_PRESETS[presetType].appearance,
        personality_config: COMPANION_PRESETS[presetType].personality
      }))
    }
  }, [presetType])

  const checkAuth = async () => {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      router.push('/auth')
      return
    }
    setUser(currentUser)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const companion = await createCompanion(user.id, {
        ...companionData,
        generate_avatar: selectedAvatar ? false : generateAvatar,
        avatar_data_url: selectedAvatar || undefined
      })
      router.push(`/chat/${companion.id}`)
    } catch (error: any) {
      alert('创建失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCompanionData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCompanionTypeSelect = (type: string) => {
    if (type === 'custom') {
      setCompanionData(prev => ({
        ...prev,
        companion_type: 'custom',
        appearance_config: prev.appearance_config || COMPANION_PRESETS.neighbor.appearance,
        personality_config: prev.personality_config || COMPANION_PRESETS.neighbor.personality
      }))
      return
    }

    if (type in COMPANION_PRESETS) {
      const t = type as keyof typeof COMPANION_PRESETS
      setCompanionData(prev => ({
        ...prev,
        companion_type: t,
        name: prev.name || COMPANION_PRESETS[t].name,
        appearance_config: COMPANION_PRESETS[t].appearance,
        personality_config: COMPANION_PRESETS[t].personality
      }))
    }
  }

  const updatePersonality = (patch: Partial<PersonalityConfig>) => {
    setCompanionData(prev => ({
      ...prev,
      personality_config: {
        ...(prev.personality_config || ({} as any)),
        ...patch
      }
    }))
  }

  const parseCsvList = (value: string) => {
    return value
      .split(/[,，]/g)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 12)
  }

  const formatCsvList = (value: string[] | undefined) => {
    return Array.isArray(value) ? value.join('，') : ''
  }

  const handleGenerateAvatarCandidates = async () => {
    if (avatarLoading) return
    setAvatarLoading(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('用户未登录')

      const res = await fetch('/api/companions/avatar/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          n: 4,
          variant: avatarVariant,
          appearance_config: companionData.appearance_config,
          personality_config: companionData.personality_config
        })
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '生成失败')
      const items = Array.isArray(payload?.items) ? payload.items : []
      const urls = items
        .filter((x: any) => typeof x === 'string' && x.startsWith('data:image/'))
        .slice(0, 4)
      setAvatarCandidates(urls)
      setAvatarPrompt(typeof payload?.prompt === 'string' ? payload.prompt : null)
      setSelectedAvatar(null)
    } catch (e: any) {
      alert(e?.message || '生成失败')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (aiGenerating) return
    setAiGenerating(true)
    try {
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('用户未登录')
      }

      const resp = await fetch('/api/companions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          companion_type: companionData.companion_type,
          gender: (companionData.personality_config as any)?.gender,
          age: (companionData.personality_config as any)?.age,
          personalityType: companionData.personality_config?.type,
          interests: companionData.personality_config?.interests,
          skills: (companionData.personality_config as any)?.skills,
          preference: aiPreference
        })
      })

      const payload = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(payload?.error || '生成失败')
      const draft = payload.draft
      if (!draft) throw new Error('生成结果为空')

      setCompanionData(prev => ({
        ...prev,
        name: draft.name || prev.name,
        background: draft.background || prev.background,
        appearance_config: draft.appearance_config || prev.appearance_config,
        personality_config: draft.personality_config || prev.personality_config
      }))
      setAvatarCandidates([])
      setAvatarPrompt(null)
      setSelectedAvatar(null)
    } catch (e: any) {
      alert(e?.message || '生成失败')
    } finally {
      setAiGenerating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 返回首页
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            创建AI伴侣
          </h1>
          <div></div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <div className={`w-16 h-1 ${step >= 2 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <div className={`w-16 h-1 ${step >= 3 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}>
              3
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>选择类型</span>
            <span>基础设置</span>
            <span>完成创建</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: 选择类型 */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">选择伴侣类型</h2>
              <div className="grid gap-4">
                {Object.entries(COMPANION_PRESETS).map(([type, preset]) => (
                  <label
                    key={type}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      companionData.companion_type === type
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="companion_type"
                      value={type}
                      checked={companionData.companion_type === type}
                      onChange={(e) => handleCompanionTypeSelect(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">
                          {type === 'neighbor' && '🏠'}
                          {type === 'office' && '💼'}
                          {type === 'student' && '📚'}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{preset.name}</h3>
                          <p className="text-gray-600">{preset.personality.traits.join('、')}</p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
                
                <label
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    companionData.companion_type === 'custom'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="companion_type"
                    value="custom"
                    checked={companionData.companion_type === 'custom'}
                    onChange={(e) => handleCompanionTypeSelect(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">🎨</div>
                      <div>
                        <h3 className="font-bold text-lg">自定义创建</h3>
                        <p className="text-gray-600">完全自定义外观和性格</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: 基础设置 */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">基础设置</h2>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 mb-2">AI 一键生成人物设定</div>
                      <div className="text-sm text-gray-600 mb-2">
                        生成：性别/年龄/性格/爱好/技能/背景 + 更好看的头像提示词（可编辑）。
                      </div>
                      <textarea
                        value={aiPreference}
                        onChange={(e) => setAiPreference(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                        placeholder="可选：写下你想要的风格/设定，比如：甜酷、短发、理性但温柔、擅长健身和摄影…"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={aiGenerating}
                      className="shrink-0 px-4 py-2 rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiGenerating ? '生成中...' : '一键生成'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    伴侣名字 *
                  </label>
                  <input
                    type="text"
                    value={companionData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="给你的伴侣起个名字"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      性别
                    </label>
                    <select
                      value={((companionData.personality_config as any)?.gender as Gender) || 'female'}
                      onChange={(e) => updatePersonality({ gender: e.target.value as Gender })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="female">女性</option>
                      <option value="male">男性</option>
                      <option value="nonbinary">非二元</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      年龄（21+）
                    </label>
                    <input
                      type="number"
                      min={21}
                      max={60}
                      value={((companionData.personality_config as any)?.age as number) || 23}
                      onChange={(e) => updatePersonality({ age: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    性格模板
                  </label>
                  <select
                    value={companionData.personality_config?.type || 'gentle'}
                    onChange={(e) => updatePersonality({ type: e.target.value as PersonalityConfig['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="gentle">温柔</option>
                    <option value="lively">活泼</option>
                    <option value="intellectual">知性</option>
                    <option value="mysterious">神秘</option>
                    <option value="cute">可爱</option>
                    <option value="mature">成熟</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    兴趣（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={formatCsvList(companionData.personality_config?.interests)}
                    onChange={(e) => updatePersonality({ interests: parseCsvList(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="例如：电影，旅行，健身，咖啡"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    技能（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    value={formatCsvList(((companionData.personality_config as any)?.skills as string[]) || [])}
                    onChange={(e) => updatePersonality({ skills: parseCsvList(e.target.value) as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="例如：情绪安抚，学习陪伴，目标规划"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    爱好（用逗号分隔，可选）
                  </label>
                  <input
                    type="text"
                    value={formatCsvList(((companionData.personality_config as any)?.hobbies as string[]) || [])}
                    onChange={(e) => updatePersonality({ hobbies: parseCsvList(e.target.value) as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="例如：摄影，跳舞，阅读"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职业（可选）
                  </label>
                  <input
                    type="text"
                    value={((companionData.personality_config as any)?.occupation as string) || ''}
                    onChange={(e) => updatePersonality({ occupation: e.target.value } as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="例如：设计师 / 产品经理 / 大学生"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    头像提示词（英文，可选）
                  </label>
                  <textarea
                    value={(companionData.appearance_config as any)?.customPrompt || ''}
                    onChange={(e) =>
                      setCompanionData(prev => ({
                        ...prev,
                        appearance_config: {
                          ...(prev.appearance_config || ({} as any)),
                          customPrompt: e.target.value
                        }
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g. beautiful adult portrait, elegant outfit fully covering, soft lighting, 85mm, shallow depth of field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    背景故事（可选）
                  </label>
                  <textarea
                    value={companionData.background}
                    onChange={(e) => handleInputChange('background', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="描述一下你的伴侣的背景故事..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={companionData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    公开到伴侣广场（其他用户可以看到）
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="generate_avatar"
                    checked={generateAvatar}
                    onChange={(e) => setGenerateAvatar(e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generate_avatar" className="ml-2 block text-sm text-gray-700">
                    创建后自动生成头像（推荐）
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 预览确认 */}
          {step === 3 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">预览确认</h2>
              
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {selectedAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">👩</span>
                  )}
                </div>
                <h3 className="text-xl font-bold">{companionData.name}</h3>
                <p className="text-gray-600">
                  {COMPANION_PRESETS[companionData.companion_type as keyof typeof COMPANION_PRESETS]?.name || '自定义'}
                </p>
              </div>

              <div className="border rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="font-semibold text-gray-800">头像候选（可选）</div>
                  <select
                    value={avatarVariant}
                    onChange={(e) => setAvatarVariant(e.target.value as AvatarVariant)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                  >
                    <option value="studio">棚拍</option>
                    <option value="cinematic">电影感</option>
                    <option value="outdoor">户外</option>
                    <option value="street">街拍</option>
                    <option value="anime">二次元</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAvatarCandidates}
                    disabled={avatarLoading}
                    className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:border-gray-400 disabled:opacity-50"
                  >
                    {avatarLoading ? '生成中...' : '生成 4 张候选'}
                  </button>
                  {selectedAvatar && (
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar(null)}
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:border-gray-400"
                    >
                      取消选择
                    </button>
                  )}
                </div>

                {avatarPrompt && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">查看本次生成提示词</summary>
                    <div className="mt-2 text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-md p-2 whitespace-pre-wrap break-words">
                      {avatarPrompt}
                    </div>
                  </details>
                )}

                {avatarCandidates.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {avatarCandidates.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedAvatar(url)}
                        className={`relative overflow-hidden rounded-lg border ${
                          selectedAvatar === url ? 'border-pink-500' : 'border-gray-200 hover:border-pink-300'
                        }`}
                        title="点击选择"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="candidate" className="h-40 w-full object-cover" />
                        {selectedAvatar === url && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-sm font-semibold">
                            已选择
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-600">
                  未选择候选时，会按“自动生成头像”开关生成。
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">类型:</span>
                  <span>{COMPANION_PRESETS[companionData.companion_type as keyof typeof COMPANION_PRESETS]?.name || '自定义'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">名字:</span>
                  <span>{companionData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">性别 / 年龄:</span>
                  <span>
                    {(((companionData.personality_config as any)?.gender as string) || 'female')}
                    {' / '}
                    {(((companionData.personality_config as any)?.age as number) || 23)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">性格模板:</span>
                  <span>{companionData.personality_config?.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">兴趣:</span>
                  <p className="mt-1 text-gray-800">{(companionData.personality_config?.interests || []).join('、')}</p>
                </div>
                {((companionData.personality_config as any)?.skills as string[] | undefined)?.length ? (
                  <div>
                    <span className="text-gray-600">技能:</span>
                    <p className="mt-1 text-gray-800">{(((companionData.personality_config as any)?.skills as string[]) || []).join('、')}</p>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-gray-600">公开:</span>
                  <span>{companionData.is_public ? '是' : '否'}</span>
                </div>
                {companionData.background && (
                  <div>
                    <span className="text-gray-600">背景故事:</span>
                    <p className="mt-1 text-gray-800">{companionData.background}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一步
            </button>
            
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && !companionData.name.trim()}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '创建中...' : '创建伴侣'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreateCompanionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    }>
      <CreateCompanionContent />
    </Suspense>
  )
}
