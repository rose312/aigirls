'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRecommendations } from '@/lib/recommendation-engine'
import OptimizedImage from './OptimizedImage'
import type { RecommendationResult } from '@/lib/recommendation-engine'

interface IntelligentRecommendationsProps {
  userId: string
  onCreateCompanion: (type: string, config?: any) => void
}

// 伴侣类型信息
const COMPANION_INFO = {
  neighbor: {
    name: '邻家女孩',
    emoji: '🏠',
    description: '温柔体贴的邻家女孩，给你家的温暖',
    imageUrl: '/images/presets/neighbor-girl.jpg',
    color: 'from-pink-400 to-rose-500'
  },
  office: {
    name: '职场精英',
    emoji: '💼',
    description: '聪明自信的职场精英，与你分享成功智慧',
    imageUrl: '/images/presets/office-lady.jpg',
    color: 'from-purple-400 to-indigo-500'
  },
  student: {
    name: '学生妹妹',
    emoji: '📚',
    description: '活泼纯真的学生妹妹，带给你青春活力',
    imageUrl: '/images/presets/student-girl.jpg',
    color: 'from-blue-400 to-cyan-500'
  },
  custom: {
    name: '自定义伴侣',
    emoji: '🎨',
    description: '完全按照你的想法定制独特伴侣',
    imageUrl: '/images/presets/custom-placeholder.jpg',
    color: 'from-emerald-400 to-teal-500'
  }
}

export default function IntelligentRecommendations({ userId, onCreateCompanion }: IntelligentRecommendationsProps) {
  const { recommendations, loading, error, recordBehavior } = useRecommendations(userId)
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationResult | null>(null)
  const router = useRouter()

  const handleRecommendationClick = (recommendation: RecommendationResult) => {
    setSelectedRecommendation(recommendation)
    
    // 记录用户行为
    recordBehavior({
      eventType: 'feature_use',
      metadata: {
        feature: 'recommendation_click',
        companionType: recommendation.companionType,
        score: recommendation.score
      }
    })
  }

  const handleCreateFromRecommendation = (recommendation: RecommendationResult) => {
    // 记录转化行为
    recordBehavior({
      eventType: 'feature_use',
      metadata: {
        feature: 'recommendation_convert',
        companionType: recommendation.companionType,
        score: recommendation.score
      }
    })

    // 使用推荐的个性化配置创建伴侣
    onCreateCompanion(recommendation.companionType, recommendation.personalizedConfig)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800">AI智能推荐</h3>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || recommendations.length === 0) {
    return null // 不显示推荐组件
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">🤖</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">AI智能推荐</h3>
          <p className="text-sm text-gray-600">基于你的偏好为你推荐最适合的伴侣</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const info = COMPANION_INFO[recommendation.companionType as keyof typeof COMPANION_INFO]
          if (!info) return null

          return (
            <div
              key={recommendation.companionType}
              className={`relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                selectedRecommendation?.companionType === recommendation.companionType
                  ? 'border-purple-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
              onClick={() => handleRecommendationClick(recommendation)}
            >
              {/* 推荐排名标识 */}
              <div className="absolute top-3 left-3 z-10">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${info.color} flex items-center justify-center text-white font-bold text-sm`}>
                  {index + 1}
                </div>
              </div>

              {/* 置信度指示器 */}
              <div className="absolute top-3 right-3 z-10">
                <div className="bg-black/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white font-medium">
                  {Math.round(recommendation.confidence * 100)}% 匹配
                </div>
              </div>

              <div className="flex items-center gap-4 p-4">
                {/* 伴侣头像 */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <OptimizedImage
                    src={info.imageUrl}
                    alt={info.name}
                    className="w-full h-full object-cover"
                    fallbackSrc={`data:image/svg+xml;base64,${btoa(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#f3f4f6"/><text x="32" y="32" text-anchor="middle" dy=".3em" font-size="24">${info.emoji}</text></svg>`)}`}
                  />
                </div>

                {/* 推荐信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-gray-800 truncate">{info.name}</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < Math.round(recommendation.score / 20) ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{info.description}</p>
                  
                  {/* 推荐理由 */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {recommendation.reasons.slice(0, 2).map((reason, i) => (
                      <span
                        key={i}
                        className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateFromRecommendation(recommendation)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${info.color} hover:shadow-lg transition-all`}
                  >
                    立即创建
                  </button>
                  
                  <div className="text-center">
                    <span className="text-xs text-gray-500">
                      {Math.round(recommendation.score)}分推荐
                    </span>
                  </div>
                </div>
              </div>

              {/* 展开的详细信息 */}
              {selectedRecommendation?.companionType === recommendation.companionType && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 推荐理由详情 */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">推荐理由</h5>
                      <ul className="space-y-1">
                        {recommendation.reasons.map((reason, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 个性化配置预览 */}
                    {recommendation.personalizedConfig && (
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">个性化配置</h5>
                        <div className="space-y-2">
                          {recommendation.personalizedConfig.personality && (
                            <div className="text-sm">
                              <span className="text-gray-600">性格特点：</span>
                              <span className="text-gray-800">
                                {recommendation.personalizedConfig.personality.traits?.join('、') || '温和友善'}
                              </span>
                            </div>
                          )}
                          {recommendation.personalizedConfig.background && (
                            <div className="text-sm">
                              <span className="text-gray-600">背景设定：</span>
                              <span className="text-gray-800">{recommendation.personalizedConfig.background}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 快速操作 */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateFromRecommendation(recommendation)
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${info.color} hover:shadow-lg transition-all`}
                    >
                      使用推荐配置创建
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateCompanion(recommendation.companionType)
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 transition-all"
                    >
                      自定义创建
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 刷新推荐按钮 */}
      <div className="mt-6 text-center">
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          🔄 刷新推荐
        </button>
      </div>
    </div>
  )
}