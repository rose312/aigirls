'use client'

import { useState } from 'react'

// 预设图片生成工具
const PRESET_PROMPTS = {
  'neighbor-girl': 'beautiful young Asian woman, girl next door style, casual clothing, sweet smile, natural makeup, soft lighting, friendly expression, approachable, warm atmosphere',
  'office-lady': 'professional beautiful Asian businesswoman, elegant office attire, confident pose, sophisticated makeup, modern office background, intelligent eyes, professional smile',
  'student-girl': 'cute young Asian student girl, school uniform or casual student clothing, bright smile, youthful appearance, energetic pose, campus background, innocent eyes'
}

export default function GeneratePresetsPage() {
  const [generating, setGenerating] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, string>>({})

  const generatePresetImage = async (type: string, prompt: string) => {
    setGenerating(prev => ({ ...prev, [type]: true }))
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          styleId: 'meizitu',
          size: '1024x1024',
          quality: 'high',
          n: 1,
          tagKeys: ['beautiful', 'portrait'],
          safetyLevel: 'standard'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.images && result.images.length > 0) {
          setResults(prev => ({ ...prev, [type]: result.images[0].url }))
        }
      } else {
        console.error(`生成${type}失败:`, await response.text())
      }
    } catch (error) {
      console.error(`生成${type}失败:`, error)
    } finally {
      setGenerating(prev => ({ ...prev, [type]: false }))
    }
  }

  const generateAll = async () => {
    for (const [type, prompt] of Object.entries(PRESET_PROMPTS)) {
      await generatePresetImage(type, prompt)
      // 等待1秒避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">预设伴侣图片生成工具</h1>
      
      <div className="mb-6">
        <button
          onClick={generateAll}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          生成所有预设图片
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PRESET_PROMPTS).map(([type, prompt]) => (
          <div key={type} className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2 capitalize">
              {type.replace('-', ' ')}
            </h3>
            
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              {results[type] ? (
                <img
                  src={results[type]}
                  alt={type}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : generating[type] ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-2"></div>
                  <p className="text-sm text-gray-600">生成中...</p>
                </div>
              ) : (
                <div className="text-gray-400 text-4xl">📷</div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{prompt}</p>
            
            <button
              onClick={() => generatePresetImage(type, prompt)}
              disabled={generating[type]}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {generating[type] ? '生成中...' : '生成图片'}
            </button>
            
            {results[type] && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">下载链接：</p>
                <a
                  href={results[type]}
                  download={`${type}.jpg`}
                  className="text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  下载 {type}.jpg
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">使用说明：</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>点击"生成所有预设图片"或单独生成每张图片</li>
          <li>生成完成后，点击下载链接保存图片</li>
          <li>将下载的图片重命名并放置到 <code>public/images/presets/</code> 目录</li>
          <li>文件名应为：neighbor-girl.jpg, office-lady.jpg, student-girl.jpg</li>
          <li>完成后即可在主页看到预设图片</li>
        </ol>
      </div>
    </div>
  )
}