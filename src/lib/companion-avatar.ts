import { checkPromptSafety } from './prompt-safety'
import { generateImages, getImageProvider, getMissingImageProviderEnv } from './image-generation'
import {
  isQiniuConfigured,
  isQiniuPrivateBucket,
  signQiniuGetUrlForKey,
  uploadToQiniuS3
} from './qiniu-s3'
import type { AppearanceConfig, Companion, Gender } from './database-setup'

function extensionFromMime(mime: string) {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

function clampAge(age: unknown) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return undefined
  return Math.max(21, Math.min(60, Math.floor(age)))
}

function coerceGender(value: unknown): Gender | undefined {
  return value === 'female' || value === 'male' || value === 'nonbinary' ? value : undefined
}

export function buildCompanionAvatarPrompt(companion: Companion) {
  const appearance = (companion.appearance_config || {}) as AppearanceConfig
  const personality: any = companion.personality_config || {}

  const gender = coerceGender(personality.gender) ?? 'female'
  const age = clampAge(personality.age) ?? 23
  const occupation = typeof personality.occupation === 'string' ? personality.occupation : ''
  const hobbies: string[] = Array.isArray(personality.hobbies) ? personality.hobbies.filter((x: any) => typeof x === 'string') : []
  const styleKeywords: string[] = Array.isArray(appearance.styleKeywords)
    ? appearance.styleKeywords.filter((x: any) => typeof x === 'string')
    : []

  const variantHint = (variant?: AvatarVariant) => {
    const v = variant ?? 'studio'
    const hints: Record<AvatarVariant, string> = {
      studio: 'studio portrait, clean seamless background, premium beauty lighting',
      cinematic: 'cinematic portrait, dramatic rim light, film color grading, premium look',
      outdoor: 'outdoor portrait, golden hour, natural light, bokeh background, candid elegance',
      street: 'fashion street portrait, urban background, stylish outfit, editorial vibe',
      anime: 'anime illustration portrait, high detail, soft shading, beautiful character design'
    }
    return hints[v] ?? hints.studio
  }

  const base = [
    // Keep it naturally descriptive; do not add "no nudity" style instructions.
    `high-quality ${gender === 'male' ? 'handsome adult man' : gender === 'nonbinary' ? 'androgynous adult portrait' : 'beautiful adult woman'} portrait`,
    `age ${age}`,
    'fully covered outfit, non see-through, classy fashion',
    occupation ? `occupation vibe: ${occupation}` : '',
    hobbies.length > 0 ? `hobby vibe: ${hobbies.slice(0, 3).join(', ')}` : '',
    variantHint((appearance as any).avatarVariant as AvatarVariant | undefined),
    'soft cinematic lighting, premium magazine look, natural skin texture',
    '85mm lens, shallow depth of field, clean background, sharp focus, high detail'
  ]
    .filter(Boolean)
    .join(', ')

  const custom = typeof appearance.customPrompt === 'string' ? appearance.customPrompt.trim() : ''
  const merged = [custom, styleKeywords.length > 0 ? styleKeywords.join(', ') : '', base]
    .filter(Boolean)
    .join(', ')

  return merged.length > 1200 ? merged.slice(0, 1200) : merged
}

export type AvatarVariant = 'studio' | 'cinematic' | 'outdoor' | 'street' | 'anime'

export type GenerateAvatarResult = {
  avatarUrl: string
  avatarKey?: string
  avatarUrlExpiresAt?: number
  provider: ReturnType<typeof getImageProvider>
  model: string
}

export async function generateCompanionAvatar(companion: Companion): Promise<GenerateAvatarResult> {
  return (await generateCompanionAvatarCandidates(companion, { n: 1 })).items[0]!
}

export async function generateCompanionAvatarCandidates(
  companion: Companion,
  input: { n: number; variant?: AvatarVariant }
): Promise<{ prompt: string; items: GenerateAvatarResult[] }> {
  const provider = getImageProvider()
  const missing = getMissingImageProviderEnv(provider)
  if (missing.length > 0) {
    throw new Error(`服务器未配置：${missing.join(', ')}。请在 .env.local 里设置后重试。`)
  }

  const appearance = ((companion as any).appearance_config || {}) as any
  const prompt = buildCompanionAvatarPrompt({
    ...(companion as any),
    appearance_config: { ...appearance, avatarVariant: input.variant ?? appearance.avatarVariant }
  } as Companion)
  const safety = checkPromptSafety(prompt, 'standard')
  if (!safety.ok) throw new Error(safety.message)

  const result = await generateImages({
    prompt,
    n: Math.max(1, Math.min(4, Math.floor(input.n))),
    size: '1024x1024',
    quality: 'auto'
  })

  const b64Images = result.b64Images.filter((x) => typeof x === 'string' && x.length > 0).slice(0, 4)
  if (b64Images.length === 0) throw new Error('头像生成失败：空图片')

  if (!isQiniuConfigured()) {
    return {
      prompt,
      items: b64Images.map((b64) => ({
        avatarUrl: `data:${result.mime};base64,${b64}`,
        provider: result.provider,
        model: result.model
      }))
    }
  }

  const ext = extensionFromMime(result.mime)
  const uploaded: Array<{ key: string; url: string }> = []
  for (const b64 of b64Images) {
    const buf = Buffer.from(b64, 'base64')
    const up = await uploadToQiniuS3({
      body: buf,
      contentType: result.mime,
      extension: ext,
      keyPrefix: `companions/${companion.id}`
    })
    uploaded.push(up)
  }

  if (isQiniuPrivateBucket()) {
    const signed = await Promise.all(
      uploaded.map(async (u) => {
        const s = await signQiniuGetUrlForKey(u.key)
        return {
          avatarUrl: s.url,
          avatarUrlExpiresAt: s.expiresAt,
          avatarKey: u.key,
          provider: result.provider,
          model: result.model
        } satisfies GenerateAvatarResult
      })
    )

    return { prompt, items: signed }
  }

  return {
    prompt,
    items: uploaded.map((u) => ({
      avatarUrl: u.url,
      avatarKey: u.key,
      provider: result.provider,
      model: result.model
    }))
  }
}
