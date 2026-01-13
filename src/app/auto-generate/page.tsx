'use client'

import { useState } from 'react'

export default function AutoGeneratePage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const generatePresets = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const response = await fetch('/api/generate-presets', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResults(data)
      
    } catch (error: any) {
      setResults({
        success: false,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">自动生成预设图片</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-800">
          点击下面的按钮，系统将自动生成三种伴侣类型的预设图片并保存到项目文件夹中。
        </p>
      </div>
      
      <button
        onClick={generatePresets}
        disabled={loading}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
      >
        {loading ? '生成中，请稍候...' : '🎨 一键生成所有预设图片'}
      </button>
      
      {loading && (
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
            <p className="text-yellow-800">正在生成图片，这可能需要1-2分钟...</p>
          </div>
        </div>
      )}
      
      {results && (
        <div className="mt-6">
          <div className={`p-4 rounded-lg ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h2 className={`text-lg font-semibold mb-3 ${results.success ? 'text-green-800' : 'text-red-800'}`}>
              {results.success ? '✅ 生成完成！' : '❌ 生成失败'}
            </h2>
            
            {results.results && (
              <div className="space-y-3">
                {Object.entries(results.results).map(([key, result]: [string, any]) => (
                  <div key={key} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.status === 'success' ? 'bg-green-100 text-green-700' :
                        result.status === 'exists' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {result.status === 'success' ? '生成成功' :
                         result.status === 'exists' ? '已存在' : '失败'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.path && (
                      <p className="text-xs text-gray-500 mt-1">保存路径: {result.path}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {results.error && (
              <p className="text-red-700">{results.error}</p>
            )}
          </div>
          
          {results.success && (
            <div className="mt-4 bg-green-50 p-4 rounded-lg">
              <p className="text-green-800 font-medium">🎉 完成！</p>
              <p className="text-green-700 text-sm mt-1">
                现在可以访问 <a href="/" className="underline hover:text-green-800">主页</a> 查看效果了！
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">说明：</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 系统将自动生成三种伴侣类型的高质量图片</li>
          <li>• 图片将保存到 public/images/presets/ 目录</li>
          <li>• 如果图片已存在，将跳过生成</li>
          <li>• 生成完成后，主页将自动显示这些图片</li>
        </ul>
      </div>
    </div>
  )
}