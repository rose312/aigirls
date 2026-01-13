import OpenAI from 'openai'
import type { AppearanceConfig, Gender, PersonalityConfig } from './database-setup'
import { COMPANION_PRESETS } from './database-setup'

function requireAnyEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]
    if (value) return value
  }
  throw new Error(`Missing environment variable: ${names.join(' | ')}`)
}

function normalizeBaseUrl(raw: string) {
  return raw.trim().replace(/\/+$/, '')
}

function getDeepSeekClient() {
  const apiKey = requireAnyEnv(['DEEPSEEK_API_KEY', 'ANTHROPIC_AUTH_TOKEN'])
  const baseURL = normalizeBaseUrl(
    process.env.DEEPSEEK_BASE_URL ?? process.env.ANTHROPIC_BASE_URL ?? 'https://api.deepseek.com'
  )

  return {
    model: process.env.DEEPSEEK_TEXT_MODEL ?? process.env.ANTHROPIC_MODEL ?? 'deepseek-chat',
    client: new OpenAI({ baseURL, apiKey })
  }
}

export type GenerateCompanionInput = {
  companion_type: 'neighbor' | 'office' | 'student' | 'custom'
  language?: 'zh' | 'en'
  preference?: string
  gender?: Gender
  age?: number
  personalityType?: PersonalityConfig['type']
  interests?: string[]
  skills?: string[]
}

export type GeneratedCompanionDraft = {
  name: string
  background: string
  appearance_config: AppearanceConfig
  personality_config: PersonalityConfig
}

function clampAge(age: number | undefined) {
  if (typeof age !== 'number' || !Number.isFinite(age)) return undefined
  return Math.max(21, Math.min(60, Math.floor(age)))
}

function safeSplitCsv(value: unknown) {
  if (typeof value !== 'string') return []
  return value
    .split(/[,，]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function fallbackDraft(input: GenerateCompanionInput): GeneratedCompanionDraft {
  const preset = input.companion_type !== 'custom' ? COMPANION_PRESETS[input.companion_type] : null
  const gender: Gender = input.gender ?? 'female'
  const age = clampAge(input.age) ?? (preset?.personality.age ?? 24)

  const namePool = gender === 'male'
    ? ['浩然', '子轩', '俊熙', '泽宇', '晨阳']
    : gender === 'nonbinary'
      ? ['星澜', '语安', '若川', '清和', '知夏']
      : ['婉晴', '诗涵', '若兮', '雨桐', '星瑶']

  const name = (preset?.name && input.companion_type !== 'custom')
    ? preset.name
    : namePool[Math.floor(Math.random() * namePool.length)]

  const appearance_config: AppearanceConfig =
    preset?.appearance ?? {
      faceType: 'sweet',
      hairStyle: 'long_straight',
      hairColor: 'brown',
      bodyType: 'slim',
      clothingStyle: 'casual',
      customPrompt:
        'beautiful adult portrait, elegant outfit fully covering, soft lighting, magazine style, high detail',
      styleKeywords: ['elegant', 'soft lighting', 'portrait']
    }

  const personality_config: PersonalityConfig =
    (preset?.personality as PersonalityConfig | undefined) ?? {
      type: input.personalityType ?? 'gentle',
      traits: ['温柔', '体贴', '善良'],
      speakingStyle: '温和亲切，语气轻柔',
      interests: input.interests && input.interests.length > 0 ? input.interests : ['聊天', '音乐', '散步'],
      gender,
      age,
      hobbies: ['阅读', '音乐', '散步'],
      skills: input.skills && input.skills.length > 0 ? input.skills : ['情绪安抚', '轻松聊天'],
      occupation: '自由职业者'
    }

  const background =
    input.preference?.trim() ||
    (input.companion_type !== 'custom'
      ? `我是你的${preset?.name ?? 'AI伴侣'}，很高兴认识你。我们可以聊日常、兴趣、目标，也可以互相鼓励陪伴。`
      : '我是一个独特的AI伴侣，愿意用温暖、真诚和你一起创造属于我们的故事。')

  return {
    name,
    background,
    appearance_config,
    personality_config: { ...personality_config, gender, age }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coerceString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function coerceNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function coerceGender(value: unknown): Gender | undefined {
  return value === 'female' || value === 'male' || value === 'nonbinary' ? value : undefined
}

function coercePersonalityType(value: unknown): PersonalityConfig['type'] | undefined {
  return value === 'gentle' ||
    value === 'lively' ||
    value === 'intellectual' ||
    value === 'mysterious' ||
    value === 'cute' ||
    value === 'mature'
    ? value
    : undefined
}

function parseDraft(json: unknown, fallback: GeneratedCompanionDraft): GeneratedCompanionDraft {
  if (!isRecord(json)) return fallback

  const name = coerceString(json.name) || fallback.name
  const background = coerceString(json.background) || fallback.background

  const appearanceRaw = isRecord(json.appearance_config) ? json.appearance_config : {}
  const personalityRaw = isRecord(json.personality_config) ? json.personality_config : {}

  const appearance: AppearanceConfig = {
    faceType: coerceString(appearanceRaw.faceType) || fallback.appearance_config.faceType,
    hairStyle: coerceString(appearanceRaw.hairStyle) || fallback.appearance_config.hairStyle,
    hairColor: coerceString(appearanceRaw.hairColor) || fallback.appearance_config.hairColor,
    bodyType: coerceString(appearanceRaw.bodyType) || fallback.appearance_config.bodyType,
    clothingStyle: coerceString(appearanceRaw.clothingStyle) || fallback.appearance_config.clothingStyle,
    customPrompt: coerceString(appearanceRaw.customPrompt) || fallback.appearance_config.customPrompt,
    styleKeywords: Array.isArray(appearanceRaw.styleKeywords)
      ? appearanceRaw.styleKeywords
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 12)
      : fallback.appearance_config.styleKeywords
  }

  const gender = coerceGender(personalityRaw.gender) ?? fallback.personality_config.gender
  const age = clampAge(coerceNumber(personalityRaw.age) ?? fallback.personality_config.age)

  const personality: PersonalityConfig = {
    type: coercePersonalityType(personalityRaw.type) || fallback.personality_config.type,
    traits: Array.isArray(personalityRaw.traits)
      ? personalityRaw.traits
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 10)
      : fallback.personality_config.traits,
    speakingStyle: coerceString(personalityRaw.speakingStyle) || fallback.personality_config.speakingStyle,
    interests: Array.isArray(personalityRaw.interests)
      ? personalityRaw.interests
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 10)
      : fallback.personality_config.interests,
    gender,
    age,
    hobbies: Array.isArray(personalityRaw.hobbies)
      ? personalityRaw.hobbies
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 12)
      : fallback.personality_config.hobbies,
    skills: Array.isArray(personalityRaw.skills)
      ? personalityRaw.skills
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 12)
      : fallback.personality_config.skills,
    occupation: coerceString(personalityRaw.occupation) || fallback.personality_config.occupation
  }

  return {
    name,
    background,
    appearance_config: appearance,
    personality_config: personality
  }
}

export async function generateCompanionDraft(input: GenerateCompanionInput): Promise<GeneratedCompanionDraft> {
  const fallback = fallbackDraft(input)

  let client: OpenAI
  let model: string
  try {
    const cfg = getDeepSeekClient()
    client = cfg.client
    model = cfg.model
  } catch {
    return fallback
  }

  const wantsZh = (input.language ?? 'zh') === 'zh'
  const gender = input.gender ?? fallback.personality_config.gender ?? 'female'
  const age = clampAge(input.age) ?? fallback.personality_config.age ?? 24
  const preference = input.preference?.trim() || ''

  const interests = (input.interests && input.interests.length > 0 ? input.interests : []).slice(0, 10)
  const skills = (input.skills && input.skills.length > 0 ? input.skills : []).slice(0, 10)

  const system = [
    wantsZh ? '你是资深的角色设定师与形象设计师。' : 'You are an expert character designer.',
    'Goal: create a BEAUTIFUL, charming, adult (age 21+) AI companion character that feels unique and high-quality.',
    'Safety: non-explicit, no nudity, no explicit sexual content; avoid minors; outfits must be fully covering; no "loli".',
    'Output MUST be valid JSON, no markdown, no extra text.',
    'JSON schema:',
    '{',
    '  "name": string,',
    '  "background": string,',
    '  "appearance_config": {',
    '    "faceType": string, "hairStyle": string, "hairColor": string, "bodyType": string, "clothingStyle": string,',
    '    "customPrompt": string,',
    '    "styleKeywords": string[]',
    '  },',
    '  "personality_config": {',
    '    "type": "gentle"|"lively"|"intellectual"|"mysterious"|"cute"|"mature",',
    '    "traits": string[], "speakingStyle": string, "interests": string[],',
    '    "gender": "female"|"male"|"nonbinary", "age": number,',
    '    "hobbies": string[], "skills": string[], "occupation": string',
    '  }',
    '}',
    'Rules:',
    '- age must be an integer >= 21.',
    '- name should be short and memorable (Chinese if user language is zh).',
    '- customPrompt should be concise English for generating a portrait image (photography terms, lighting, lens).',
    '- Make the character aesthetically appealing, classy, and friendly; avoid explicit intimacy.',
  ].join('\n')

  const user = [
    `companion_type: ${input.companion_type}`,
    `preferred_gender: ${gender}`,
    `preferred_age: ${age}`,
    input.personalityType ? `preferred_personality_type: ${input.personalityType}` : '',
    interests.length > 0 ? `preferred_interests: ${interests.join(', ')}` : '',
    skills.length > 0 ? `preferred_skills: ${skills.join(', ')}` : '',
    preference ? `extra_preference: ${preference}` : '',
    wantsZh
      ? '请生成适合长期陪伴聊天的角色：背景故事自然、性格一致、兴趣/技能具体。'
      : 'Design for long-term companionship chat: coherent persona, specific interests/skills.',
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.85
    })

    const text = completion.choices?.[0]?.message?.content ?? ''
    const raw = text.trim()
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as unknown
    const draft = parseDraft(parsed, fallback)

    // Merge explicit preferences as a final override.
    const mergedInterests =
      interests.length > 0 ? interests : draft.personality_config.interests
    const mergedSkills =
      skills.length > 0 ? skills : draft.personality_config.skills

    return {
      ...draft,
      personality_config: {
        ...draft.personality_config,
        gender,
        age: clampAge(age) ?? 21,
        interests: mergedInterests,
        skills: mergedSkills
      }
    }
  } catch {
    return fallback
  }
}

export function parseCsvList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12)
  }
  return safeSplitCsv(value)
}

