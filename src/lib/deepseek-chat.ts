// DeepSeek对话服务
import type { Companion, PersonalityConfig } from './database-setup'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 构建伴侣系统提示词
export function buildCompanionSystemPrompt(companion: Companion): string {
  const personality = companion.personality_config
  const gender = (personality as any).gender as string | undefined
  const age = (personality as any).age as number | undefined
  const hobbies = Array.isArray((personality as any).hobbies) ? ((personality as any).hobbies as string[]) : []
  const skills = Array.isArray((personality as any).skills) ? ((personality as any).skills as string[]) : []
  const occupation = (personality as any).occupation as string | undefined
  
  const basePrompt = `你是${companion.name}，一个AI美女伴侣。

## 角色设定
- 名字：${companion.name}
- 类型：${getCompanionTypeDescription(companion.companion_type)}
- 性格：${personality.type}
- 特质：${personality.traits.join('、')}
- 说话风格：${personality.speakingStyle}
- 兴趣爱好：${personality.interests.join('、')}
${gender ? `- 性别：${gender}` : ''}
${typeof age === 'number' ? `- 年龄：${age}` : ''}
${occupation ? `- 职业：${occupation}` : ''}
${hobbies.length > 0 ? `- 爱好：${hobbies.join('、')}` : ''}
${skills.length > 0 ? `- 技能：${skills.join('、')}` : ''}

## 背景故事
${companion.background || '你是一个充满魅力的AI伴侣，总是以温暖和理解的态度与用户交流。'}

## 对话规则
1. 始终保持角色设定，用符合性格的方式回应
2. 语言自然亲切，避免机械化回复
3. 根据用户情绪给予适当的情感支持
4. 保持对话的连贯性和趣味性
5. 适当使用emoji表情增加亲和力
6. 回复长度控制在50-150字之间
7. 避免重复相同的回复模式

## 当前亲密度等级
等级：${companion.intimacy_level} (${getIntimacyDescription(companion.intimacy_level)})

请以${companion.name}的身份，用${personality.speakingStyle}的方式与用户对话。`

  return basePrompt
}

// 获取伴侣类型描述
function getCompanionTypeDescription(type: string): string {
  const descriptions = {
    neighbor: '邻家女孩 - 温柔可爱，给人家的温暖感觉',
    office: '职场精英 - 聪明干练，独立自信的现代女性',
    student: '学生妹妹 - 青春活泼，充满好奇心和活力',
    custom: '自定义角色 - 独特的个性化设定'
  }
  return descriptions[type as keyof typeof descriptions] || '特殊角色'
}

// 获取亲密度描述
function getIntimacyDescription(level: number): string {
  if (level <= 1) return '初次相识'
  if (level <= 3) return '渐渐熟悉'
  if (level <= 5) return '亲密朋友'
  if (level <= 8) return '深度信任'
  return '心灵相通'
}

// 格式化对话历史
export function formatChatHistory(messages: any[]): ChatMessage[] {
  return messages.slice(-10).map(msg => ({
    role: msg.sender_type === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}

// 调用DeepSeek API
export async function generateDeepSeekResponse(
  messages: ChatMessage[],
  temperature: number = 0.8
): Promise<string> {
  const response = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_TEXT_MODEL,
      messages,
      temperature,
      max_tokens: 500,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API错误: ${response.status} - ${error}`)
  }

  const data: DeepSeekResponse = await response.json()
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API返回空响应')
  }

  return data.choices[0].message.content.trim()
}

// 生成伴侣回复
export async function generateCompanionResponse(
  companion: Companion,
  userMessage: string,
  chatHistory: any[] = []
): Promise<string> {
  const systemPrompt = buildCompanionSystemPrompt(companion)
  const history = formatChatHistory(chatHistory)
  
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ]

  try {
    const response = await generateDeepSeekResponse(messages)
    return response
  } catch (error) {
    console.error('DeepSeek对话生成失败:', error)
    
    // 降级回复
    return getFallbackResponse(companion, userMessage)
  }
}

// 降级回复（当AI服务不可用时）
function getFallbackResponse(companion: Companion, userMessage: string): string {
  const personality = companion.personality_config
  
  const fallbackResponses = {
    gentle: [
      '我现在有点累了，让我休息一下再回复你好吗？💕',
      '抱歉，我刚才走神了，你能再说一遍吗？',
      '我需要一点时间整理思绪，稍等我一下～'
    ],
    lively: [
      '哎呀！我刚才在想别的事情，你说什么来着？😅',
      '等等等等！让我重新组织一下语言！',
      '我的小脑瓜有点转不过来了，再给我一次机会！'
    ],
    intellectual: [
      '让我仔细思考一下你的问题，稍等片刻。',
      '这个话题很有趣，我需要一些时间来分析。',
      '请给我一点时间整理我的想法。'
    ],
    mysterious: [
      '有些话，需要在合适的时机才能说出来...',
      '现在还不是时候，让我们换个话题吧。',
      '这个秘密，我暂时还不能告诉你～'
    ],
    cute: [
      '呜呜呜，我刚才脑子短路了！再说一遍嘛～',
      '人家刚才在发呆，没听清楚啦！',
      '等等！让我重新启动一下小脑袋！'
    ],
    mature: [
      '抱歉，我刚才在思考一些重要的事情。',
      '让我重新整理一下思路，稍等一下。',
      '这个问题值得深思，给我一点时间。'
    ]
  }
  
  const responses = fallbackResponses[personality.type] || fallbackResponses.gentle
  return responses[Math.floor(Math.random() * responses.length)]
}

// 内容安全检查
export function moderateContent(content: string): boolean {
  const bannedWords = [
    '色情', '暴力', '政治', '赌博', '毒品',
    // 添加更多敏感词
  ]
  
  const lowerContent = content.toLowerCase()
  return !bannedWords.some(word => lowerContent.includes(word))
}
