'use client'

import { useState, useEffect } from 'react'
import { useEmotionalGrowth } from '@/lib/emotional-growth'
import type { RelationshipProgress, RelationshipMilestone, MemoryFragment } from '@/lib/emotional-growth'

interface EmotionalGrowthDisplayProps {
  userId: string
  companionId: string
  companionName: string
}

export default function EmotionalGrowthDisplay({ userId, companionId, companionName }: EmotionalGrowthDisplayProps) {
  const { progress, milestones, memories, loading } = useEmotionalGrowth(userId, companionId)
  const [activeTab, setActiveTab] = useState<'progress' | 'milestones' | 'memories'>('progress')

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!progress) {
    return null
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈'
      case 'decreasing': return '📉'
      default: return '📊'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600'
      case 'decreasing': return 'text-red-600'
      default: return 'text-blue-600'
    }
  }

  const getIntimacyLevelName = (level: number) => {
    const levels = ['初识', '熟悉', '亲近', '深交', '知己', '灵魂伴侣']
    return levels[level - 1] || '未知'
  }

  const completedMilestones = milestones.filter(m => progress.milestones.includes(m.id))
  const nextMilestone = milestones.find(m => !progress.milestones.includes(m.id))

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💕</span>
          <h3 className="text-xl font-bold">与{companionName}的情感成长</h3>
        </div>
        <p className="text-pink-100 text-sm">记录你们关系的每一个美好时刻</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'progress', label: '成长进度', icon: '📊' },
          { key: 'milestones', label: '里程碑', icon: '🏆' },
          { key: 'memories', label: '美好回忆', icon: '💭' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* 亲密度等级 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl px-6 py-4">
                <span className="text-3xl">💖</span>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    Lv.{progress.intimacyLevel} {getIntimacyLevelName(progress.intimacyLevel)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {progress.intimacyPoints} 亲密度积分
                  </div>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">距离下一等级</span>
                <span className="text-sm text-gray-500">
                  {progress.intimacyPoints % 100}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.intimacyPoints % 100)}%` }}
                ></div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{progress.totalInteractions}</div>
                <div className="text-sm text-gray-600">总互动次数</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-pink-600">{Math.round(progress.qualityScore)}</div>
                <div className="text-sm text-gray-600">互动质量</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{progress.relationshipDays}</div>
                <div className="text-sm text-gray-600">相识天数</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className={`text-2xl font-bold ${getTrendColor(progress.growthTrend)}`}>
                  {getTrendIcon(progress.growthTrend)}
                </div>
                <div className="text-sm text-gray-600">成长趋势</div>
              </div>
            </div>

            {/* 下一个里程碑 */}
            {nextMilestone && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{nextMilestone.icon}</span>
                  <h4 className="font-bold text-gray-800">下一个里程碑：{nextMilestone.name}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">{nextMilestone.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>亲密度等级</span>
                    <span className={progress.intimacyLevel >= nextMilestone.requiredIntimacyLevel ? 'text-green-600' : 'text-gray-500'}>
                      {progress.intimacyLevel}/{nextMilestone.requiredIntimacyLevel}
                      {progress.intimacyLevel >= nextMilestone.requiredIntimacyLevel && ' ✓'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>互动次数</span>
                    <span className={progress.totalInteractions >= nextMilestone.requiredInteractions ? 'text-green-600' : 'text-gray-500'}>
                      {progress.totalInteractions}/{nextMilestone.requiredInteractions}
                      {progress.totalInteractions >= nextMilestone.requiredInteractions && ' ✓'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>相识天数</span>
                    <span className={progress.relationshipDays >= nextMilestone.requiredDays ? 'text-green-600' : 'text-gray-500'}>
                      {progress.relationshipDays}/{nextMilestone.requiredDays}
                      {progress.relationshipDays >= nextMilestone.requiredDays && ' ✓'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-4">
            {milestones.map((milestone) => {
              const isCompleted = progress.milestones.includes(milestone.id)
              const isCurrent = milestone.id === nextMilestone?.id
              
              return (
                <div
                  key={milestone.id}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    isCompleted
                      ? 'border-green-200 bg-green-50'
                      : isCurrent
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* 状态图标 */}
                  <div className="absolute top-4 right-4">
                    {isCompleted ? (
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    ) : isCurrent ? (
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">⏳</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-sm">○</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-4 pr-12">
                    <span className="text-3xl">{milestone.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{milestone.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                      
                      {/* 奖励信息 */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                          +{milestone.rewards.intimacyPoints} 亲密度
                        </span>
                        {milestone.rewards.specialFeatures?.map((feature, i) => (
                          <span key={i} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                            {feature}
                          </span>
                        ))}
                        {milestone.rewards.unlockContent?.map((content, i) => (
                          <span key={i} className="inline-block bg-pink-100 text-pink-700 text-xs px-2 py-1 rounded-full">
                            解锁：{content}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4">
            {memories.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">📝</span>
                <p className="text-gray-600">还没有记录任何回忆</p>
                <p className="text-sm text-gray-500 mt-2">继续与{companionName}聊天，创造更多美好回忆吧！</p>
              </div>
            ) : (
              memories.map((memory) => (
                <div
                  key={memory.id}
                  className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {memory.type === 'milestone' ? '🏆' : memory.type === 'conversation' ? '💬' : '✨'}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800">{memory.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(memory.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{memory.content}</p>
                      
                      {/* 标签 */}
                      <div className="flex flex-wrap gap-1">
                        {memory.tags.map((tag, i) => (
                          <span key={i} className="inline-block bg-white/50 text-gray-700 text-xs px-2 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* 情感价值 */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">情感价值：</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${
                                i < Math.round(memory.emotionalValue / 20) ? 'text-red-400' : 'text-gray-300'
                              }`}
                            >
                              ❤️
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}