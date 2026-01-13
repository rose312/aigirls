import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export const runtime = 'nodejs'

// 预设图片配置
const PRESET_CONFIGS = {
  'neighbor-girl': {
    name: '邻家女孩',
    prompt: 'beautiful young Asian woman, girl next door style, casual clothing, sweet smile, natural makeup, soft lighting, friendly expression, approachable, warm atmosphere'
  },
  'office-lady': {
    name: '职场精英', 
    prompt: 'professional beautiful Asian businesswoman, elegant office attire, confident pose, sophisticated makeup, modern office background, intelligent eyes, professional smile'
  },
  'student-girl': {
    name: '学生妹妹',
    prompt: 'cute young Asian student girl, school uniform or casual student clothing, bright smile, youthful appearance, energetic pose, campus background, innocent eyes'
  }
}

async function generateImage(prompt: string) {
  // 直接调用图片生成逻辑，而不是通过HTTP请求
  const { generateImages } = await import('@/lib/image-generation')
  const { buildFinalPromptWithTags } = await import('@/lib/build-image-prompt')
  const { checkPromptSafety } = await import('@/lib/prompt-safety')
  
  // 检查提示词安全性
  const safety = checkPromptSafety(prompt, 'standard')
  if (!safety.ok) {
    throw new Error(`提示词不安全: ${safety.message}`)
  }
  
  // 构建最终提示词
  const finalPrompt = buildFinalPromptWithTags(prompt, 'meizitu', ['beautiful', 'portrait'])
  
  // 生成图片
  const result = await generateImages({
    prompt: finalPrompt,
    n: 1,
    size: '1024x1024',
    quality: 'high'
  })
  
  if (!result.b64Images || result.b64Images.length === 0) {
    throw new Error('没有生成图片')
  }
  
  // 返回base64数据URL
  return `data:${result.mime};base64,${result.b64Images[0]}`
}

async function saveImageFromUrl(imageUrl: string, filename: string) {
  // 确保目录存在
  const publicDir = join(process.cwd(), 'public')
  const imagesDir = join(publicDir, 'images')
  const presetsDir = join(imagesDir, 'presets')
  
  if (!existsSync(imagesDir)) {
    await mkdir(imagesDir, { recursive: true })
  }
  if (!existsSync(presetsDir)) {
    await mkdir(presetsDir, { recursive: true })
  }

  // 下载图片
  let imageBuffer: Buffer
  
  if (imageUrl.startsWith('data:')) {
    // 处理 base64 数据URL
    const base64Data = imageUrl.split(',')[1]
    imageBuffer = Buffer.from(base64Data, 'base64')
  } else {
    // 处理普通URL
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`下载图片失败: ${imageResponse.statusText}`)
    }
    imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
  }

  // 保存文件
  const filePath = join(presetsDir, filename)
  await writeFile(filePath, imageBuffer)
  
  return filePath
}

export async function POST() {
  try {
    const results: Record<string, any> = {}
    
    for (const [key, config] of Object.entries(PRESET_CONFIGS)) {
      const filename = `${key}.jpg`
      const filePath = join(process.cwd(), 'public', 'images', 'presets', filename)
      
      // 检查文件是否已存在
      if (existsSync(filePath)) {
        results[key] = {
          name: config.name,
          status: 'exists',
          message: '文件已存在，跳过生成'
        }
        continue
      }

      try {
        console.log(`开始生成 ${config.name} 图片...`)
        
        // 生成图片
        const imageUrl = await generateImage(config.prompt)
        
        // 保存图片
        await saveImageFromUrl(imageUrl, filename)
        
        results[key] = {
          name: config.name,
          status: 'success',
          message: '生成并保存成功',
          path: `/images/presets/${filename}`
        }
        
        console.log(`${config.name} 图片生成完成`)
        
        // 等待1秒避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error: any) {
        console.error(`生成 ${config.name} 失败:`, error)
        results[key] = {
          name: config.name,
          status: 'error',
          message: error.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '预设图片生成完成',
      results
    })

  } catch (error: any) {
    console.error('生成预设图片失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || '生成失败' 
      },
      { status: 500 }
    )
  }
}