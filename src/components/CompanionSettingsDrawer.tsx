'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import type { Companion, Gender, PersonalityConfig } from '@/lib/database-setup'
import { deleteCompanion, updateCompanion } from '@/lib/companion-service'

type Draft = {
  name: string
  background: string
  is_public: boolean
  appearance_config: any
  personality_config: any
}

type AvatarVariant = 'studio' | 'cinematic' | 'outdoor' | 'street' | 'anime'

type AvatarCandidate = {
  url: string
  key?: string
  expiresAt?: number
}

function parseCsvList(value: string) {
  return value
    .split(/[,，]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function formatCsvList(value: unknown) {
  return Array.isArray(value) ? value.filter((x) => typeof x === 'string').join('，') : ''
}

function clampAge(age: number) {
  if (!Number.isFinite(age)) return 21
  return Math.max(21, Math.min(60, Math.floor(age)))
}

export default function CompanionSettingsDrawer({
  open,
  onClose,
  companion,
  onCompanionUpdated,
  onChatCleared
}: {
  open: boolean
  onClose: () => void
  companion: Companion
  onCompanionUpdated: (next: Companion) => void
  onChatCleared: () => void
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [regenAvatarLoading, setRegenAvatarLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiPreference, setAiPreference] = useState('')
  const [avatarVariant, setAvatarVariant] = useState<AvatarVariant>('studio')
  const [avatarCandidates, setAvatarCandidates] = useState<AvatarCandidate[]>([])
  const [avatarPrompt, setAvatarPrompt] = useState<string | null>(null)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [selectingAvatar, setSelectingAvatar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initialDraft = useMemo<Draft>(() => {
    return {
      name: companion.name,
      background: companion.background || '',
      is_public: Boolean(companion.is_public),
      appearance_config: (companion as any).appearance_config || {},
      personality_config: (companion as any).personality_config || {}
    }
  }, [companion])

  const [draft, setDraft] = useState<Draft>(initialDraft)

  useEffect(() => {
    setDraft(initialDraft)
    const v = (initialDraft.appearance_config?.avatarVariant as AvatarVariant | undefined) ?? 'studio'
    setAvatarVariant(v)
    setAvatarCandidates([])
    setAvatarPrompt(null)
  }, [initialDraft])

  if (!open) return null

  const gender = (draft.personality_config?.gender as Gender) || 'female'
  const age = clampAge(Number(draft.personality_config?.age ?? 23))

  const setPersonality = (patch: Record<string, unknown>) => {
    setDraft((prev) => ({
      ...prev,
      personality_config: { ...(prev.personality_config || {}), ...patch }
    }))
  }

  const setAppearance = (patch: Record<string, unknown>) => {
    setDraft((prev) => ({
      ...prev,
      appearance_config: { ...(prev.appearance_config || {}), ...patch }
    }))
  }

  const withToken = async () => {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('用户未登录')
    return session.access_token
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateCompanion(companion.id, {
        name: draft.name,
        background: draft.background,
        is_public: draft.is_public,
        appearance_config: draft.appearance_config,
        personality_config: {
          ...(draft.personality_config || {}),
          gender,
          age
        }
      } as any)
      onCompanionUpdated(updated)
      onClose()
    } catch (e: any) {
      setError(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerateAvatar = async () => {
    setRegenAvatarLoading(true)
    setError(null)
    try {
      const token = await withToken()
      const res = await fetch(`/api/companions/${encodeURIComponent(companion.id)}/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '头像生成失败')
      if (payload?.companion) {
        onCompanionUpdated(payload.companion as Companion)
      }
    } catch (e: any) {
      setError(e?.message || '头像生成失败')
    } finally {
      setRegenAvatarLoading(false)
    }
  }

  const handleGenerateAvatarCandidates = async () => {
    setAvatarLoading(true)
    setError(null)
    try {
      const token = await withToken()
      const res = await fetch(
        `/api/companions/${encodeURIComponent(companion.id)}/avatar/candidates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ n: 4, variant: avatarVariant })
        }
      )
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '生成候选失败')

      const items = Array.isArray(payload?.items) ? payload.items : []
      const mapped: AvatarCandidate[] = items
        .map((x: any) => ({
          url: typeof x?.avatarUrl === 'string' ? x.avatarUrl : '',
          key: typeof x?.avatarKey === 'string' ? x.avatarKey : undefined,
          expiresAt: typeof x?.avatarUrlExpiresAt === 'number' ? x.avatarUrlExpiresAt : undefined
        }))
        .filter((x: AvatarCandidate) => x.url)
        .slice(0, 4)

      setAvatarCandidates(mapped)
      setAvatarPrompt(typeof payload?.prompt === 'string' ? payload.prompt : null)
    } catch (e: any) {
      setError(e?.message || '生成候选失败')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSelectAvatar = async (candidate: AvatarCandidate) => {
    setSelectingAvatar(candidate.key ?? candidate.url)
    setError(null)
    try {
      const token = await withToken()
      const res = await fetch(
        `/api/companions/${encodeURIComponent(companion.id)}/avatar/select`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(
            candidate.key
              ? { key: candidate.key }
              : { dataUrl: candidate.url }
          )
        }
      )
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '设置头像失败')
      if (payload?.companion) onCompanionUpdated(payload.companion as Companion)

      // Persist selected variant (non-blocking).
      try {
        const nextAppearance = { ...(draft.appearance_config || {}), avatarVariant }
        const updated = await updateCompanion(companion.id, { appearance_config: nextAppearance } as any)
        onCompanionUpdated(updated)
        setDraft((p) => ({ ...p, appearance_config: nextAppearance }))
      } catch {
        // ignore
      }
    } catch (e: any) {
      setError(e?.message || '设置头像失败')
    } finally {
      setSelectingAvatar(null)
    }
  }

  const handleAiGenerateProfile = async () => {
    setAiGenerating(true)
    setError(null)
    try {
      const token = await withToken()
      const res = await fetch('/api/companions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companion_type: (companion as any).companion_type,
          gender,
          age,
          personalityType: draft.personality_config?.type,
          interests: draft.personality_config?.interests,
          skills: draft.personality_config?.skills,
          preference: aiPreference
        })
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '生成失败')
      const d = payload?.draft
      if (!d) throw new Error('生成结果为空')
      setDraft((prev) => ({
        ...prev,
        name: d.name || prev.name,
        background: d.background || prev.background,
        appearance_config: d.appearance_config || prev.appearance_config,
        personality_config: d.personality_config || prev.personality_config
      }))
    } catch (e: any) {
      setError(e?.message || '生成失败')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleClearChat = async () => {
    setSaving(true)
    setError(null)
    try {
      const token = await withToken()
      const res = await fetch(`/api/chat/${encodeURIComponent(companion.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload?.error || '清空失败')
      onChatCleared()
    } catch (e: any) {
      setError(e?.message || '清空失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCompanion = async () => {
    if (!confirm('确认删除这个伴侣吗？此操作不可恢复。')) return
    setSaving(true)
    setError(null)
    try {
      await deleteCompanion(companion.id)
      router.push('/')
    } catch (e: any) {
      setError(e?.message || '删除失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-bold text-gray-800">角色设置</div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              {companion.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companion.avatar_url} alt={companion.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">✨</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-800 truncate">{companion.name}</div>
              <div className="text-xs text-gray-500">亲密度 Lv.{companion.intimacy_level}</div>
            </div>
            <button
              type="button"
              onClick={handleRegenerateAvatar}
              disabled={regenAvatarLoading}
              className="px-3 py-2 text-sm rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-50"
            >
              {regenAvatarLoading ? '生成中...' : '重生成头像'}
            </button>
          </div>

          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold text-gray-800">头像候选（选一张最好看的）</div>
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
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleGenerateAvatarCandidates}
                disabled={avatarLoading}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:border-gray-400 disabled:opacity-50"
              >
                {avatarLoading ? '生成中...' : '生成 4 张候选'}
              </button>
              {avatarCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarCandidates([])
                    setAvatarPrompt(null)
                  }}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:border-gray-400"
                >
                  清空候选
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
                {avatarCandidates.map((c) => {
                  const id = c.key ?? c.url
                  const busy = selectingAvatar === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectAvatar(c)}
                      disabled={busy}
                      className="group relative overflow-hidden rounded-lg border border-gray-200 hover:border-pink-300"
                      title="点击设为头像"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.url} alt="avatar candidate" className="h-40 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/40 text-white text-xs px-2 py-1 flex items-center justify-between">
                        <span>{busy ? '设置中...' : '设为头像'}</span>
                        <span className="opacity-80 group-hover:opacity-100">✓</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 bg-gradient-to-r from-pink-50 to-purple-50">
            <div className="font-semibold text-gray-800 mb-2">AI 优化人物设定</div>
            <textarea
              value={aiPreference}
              onChange={(e) => setAiPreference(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
              placeholder="可选：描述你想要的风格/设定，比如：高冷但会撒娇、短发、擅长健身与摄影…"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleAiGenerateProfile}
                disabled={aiGenerating}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-white border border-pink-200 hover:border-pink-300 disabled:opacity-50"
              >
                {aiGenerating ? '生成中...' : '生成并填充'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-3 py-2 text-sm rounded-md bg-gradient-to-r from-pink-500 to-purple-600 text-white disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名字</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                <select
                  value={gender}
                  onChange={(e) => setPersonality({ gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="female">女性</option>
                  <option value="male">男性</option>
                  <option value="nonbinary">非二元</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年龄（21+）</label>
                <input
                  type="number"
                  min={21}
                  max={60}
                  value={age}
                  onChange={(e) => setPersonality({ age: clampAge(Number(e.target.value)) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">性格模板</label>
              <select
                value={(draft.personality_config?.type as PersonalityConfig['type']) || 'gentle'}
                onChange={(e) => setPersonality({ type: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">特质（逗号分隔）</label>
              <input
                value={formatCsvList(draft.personality_config?.traits)}
                onChange={(e) => setPersonality({ traits: parseCsvList(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">兴趣（逗号分隔）</label>
              <input
                value={formatCsvList(draft.personality_config?.interests)}
                onChange={(e) => setPersonality({ interests: parseCsvList(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">爱好（逗号分隔）</label>
              <input
                value={formatCsvList(draft.personality_config?.hobbies)}
                onChange={(e) => setPersonality({ hobbies: parseCsvList(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">技能（逗号分隔）</label>
              <input
                value={formatCsvList(draft.personality_config?.skills)}
                onChange={(e) => setPersonality({ skills: parseCsvList(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职业</label>
                <input
                  value={(draft.personality_config?.occupation as string) || ''}
                  onChange={(e) => setPersonality({ occupation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={draft.is_public}
                    onChange={(e) => setDraft((p) => ({ ...p, is_public: e.target.checked }))}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  公开到广场
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">背景故事</label>
              <textarea
                value={draft.background}
                onChange={(e) => setDraft((p) => ({ ...p, background: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">头像提示词（英文）</label>
              <textarea
                value={(draft.appearance_config?.customPrompt as string) || ''}
                onChange={(e) => setAppearance({ customPrompt: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="e.g. beautiful adult portrait, classy outfit, soft light, 85mm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearChat}
                disabled={saving}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 hover:border-gray-400 disabled:opacity-50"
              >
                清空聊天记录
              </button>
              <button
                type="button"
                onClick={handleDeleteCompanion}
                disabled={saving}
                className="flex-1 px-3 py-2 text-sm rounded-md border border-red-200 text-red-700 hover:border-red-300 disabled:opacity-50"
              >
                删除伴侣
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
