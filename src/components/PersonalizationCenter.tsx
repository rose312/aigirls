'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePersonalization } from '@/lib/personalization-center'

interface PersonalizationCenterProps {
  userId: string
  onClose?: () => void
}

export default function PersonalizationCenter({ userId, onClose }: PersonalizationCenterProps) {
  const [activeCategory, setActiveCategory] = useState('companion')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewConfig, setPreviewConfig] = useState<any>({})
  
  const { profile, setPreference, getPreference } = usePersonalization(userId)

  const categories = [
    {
      id: 'companion',
      name: '伴侣偏好',
      icon: '💝',
      description: '定制你的AI伴侣性格和对话风格'
    },
    {
      id: 'interface',
      name: '界面风格',
      icon: '🎨',
      description: '个性化界面主题和布局'
    },
    {
      id: 'content',
      name: '内容偏好',
      icon: '📚',
      description: '设置感兴趣的话题和内容类型'
    },
    {
      id: 'notification',
      name: '通知设置',
      icon: '🔔',
      description: '管理推送通知和提醒'
    }
  ]

  const companionPreferences = [
    {
      key: 'personality_type',
      name: '性格类型',
      type: 'select',
      options: [
        { value: '温柔', label: '温柔体贴', description: '善解人意，温暖贴心' },
        { value: '活泼', label: '活泼开朗', description: '充满活力，积极向上' },
        { value: '成熟', label: '成熟稳重', description: '理性睿智，值得依靠' },
        { value: '可爱', label: '天真可爱', description: '纯真烂漫，惹人怜爱' }
      ]
    },
    {
      key: 'conversation_style',
      name: '对话风格',
      type: 'select',
      options: [
        { value: '轻松幽默', label: '轻松幽默', description: '风趣幽默，轻松愉快' },
        { value: '深度交流', label: '深度交流', description: '思辨深刻，富有内涵' },
        { value: '日常陪伴', label: '日常陪伴', description: '温馨日常，贴心陪伴' },
        { value: '专业建议', label: '专业建议', description: '理性分析，专业指导' }
      ]
    },
    {
      key: 'response_length',
      name: '回复长度',
      type: 'slider',
      min: 1,
      max: 5,
      labels: ['简短', '适中', '详细', '丰富', '深入']
    },
    {
      key: 'emoji_usage',
      name: '表情使用',
      type: 'toggle',
      description: '是否在对话中使用表情符号'
    }
  ]

  const interfacePreferences = [
    {
      key: 'theme',
      name: '主题风格',
      type: 'theme_select',
      options: [
        { value: '浪漫', label: '浪漫粉', colors: ['#FFE4E6', '#FF69B4', '#FF1493'] },
        { value: '优雅', label: '优雅紫', colors: ['#F3E8FF', '#A855F7', '#7C3AED'] },
        { value: '活泼', label: '活泼橙', colors: ['#FFF7ED', '#FB923C', '#EA580C'] },
        { value: '宁静', label: '宁静蓝', colors: ['#EFF6FF', '#3B82F6', '#1D4ED8'] }
      ]
    },
    {
      key: 'dark_mode',
      name: '深色模式',
      type: 'toggle',
      description: '启用深色主题界面'
    },
    {
      key: 'animation_level',
      name: '动画效果',
      type: 'select',
      options: [
        { value: '关闭', label: '关闭', description: '无动画效果' },
        { value: '简单', label: '简单', description: '基础过渡动画' },
        { value: '丰富', label: '丰富', description: '完整动画体验' }
      ]
    },
    {
      key: 'font_size',
      name: '字体大小',
      type: 'slider',
      min: 12,
      max: 20,
      labels: ['很小', '小', '标准', '大', '很大']
    }
  ]

  const contentPreferences = [
    {
      key: 'content_type',
      name: '内容类型',
      type: 'multi_select',
      options: [
        { value: '日常聊天', label: '日常聊天', icon: '💬' },
        { value: '情感支持', label: '情感支持', icon: '💝' },
        { value: '学习讨论', label: '学习讨论', icon: '📚' },
        { value: '娱乐互动', label: '娱乐互动', icon: '🎮' }
      ]
    },
    {
      key: 'topic_interests',
      name: '话题兴趣',
      type: 'multi_select',
      options: [
        { value: '科技', label: '科技', icon: '💻' },
        { value: '艺术', label: '艺术', icon: '🎨' },
        { value: '音乐', label: '音乐', icon: '🎵' },
        { value: '电影', label: '电影', icon: '🎬' },
        { value: '旅行', label: '旅行', icon: '✈️' },
        { value: '美食', label: '美食', icon: '🍽️' }
      ]
    },
    {
      key: 'language_style',
      name: '语言风格',
      type: 'select',
      options: [
        { value: '正式', label: '正式', description: '规范严谨的表达' },
        { value: '随意', label: '随意', description: '轻松自然的交流' },
        { value: '亲密', label: '亲密', description: '温馨亲近的语调' },
        { value: '专业', label: '专业', description: '专业术语和表达' }
      ]
    }
  ]

  const handlePreferenceChange = (key: string, value: any) => {
    setPreference(activeCategory, key, value)
    
    // 实时预览
    if (isPreviewMode) {
      setPreviewConfig(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }

  const renderPreferenceControl = (pref: any) => {
    const currentValue = getPreference(activeCategory, pref.key)

    switch (pref.type) {
      case 'select':
        return (
          <div className="space-y-2">
            {pref.options.map((option: any) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePreferenceChange(pref.key, option.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  currentValue === option.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )

      case 'theme_select':
        return (
          <div className="grid grid-cols-2 gap-4">
            {pref.options.map((theme: any) => (
              <motion.button
                key={theme.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePreferenceChange(pref.key, theme.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentValue === theme.value
                    ? 'border-purple-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex space-x-2 mb-2">
                  {theme.colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="text-sm font-medium text-gray-900">{theme.label}</div>
              </motion.button>
            ))}
          </div>
        )

      case 'multi_select':
        const selectedValues = currentValue || []
        return (
          <div className="grid grid-cols-2 gap-3">
            {pref.options.map((option: any) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const newValues = selectedValues.includes(option.value)
                    ? selectedValues.filter((v: string) => v !== option.value)
                    : [...selectedValues, option.value]
                  handlePreferenceChange(pref.key, newValues)
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedValues.includes(option.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-sm font-medium text-gray-900">{option.label}</div>
              </motion.button>
            ))}
          </div>
        )

      case 'slider':
        return (
          <div className="space-y-4">
            <input
              type="range"
              min={pref.min}
              max={pref.max}
              value={currentValue || pref.min}
              onChange={(e) => handlePreferenceChange(pref.key, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500">
              {pref.labels?.map((label: string, index: number) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          </div>
        )

      case 'toggle':
        return (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{pref.description}</span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePreferenceChange(pref.key, !currentValue)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                currentValue ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <motion.span
                animate={{ x: currentValue ? 20 : 2 }}
                className="inline-block h-4 w-4 transform rounded-full bg-white transition"
              />
            </motion.button>
          </div>
        )

      default:
        return null
    }
  }

  const getCurrentPreferences = () => {
    switch (activeCategory) {
      case 'companion':
        return companionPreferences
      case 'interface':
        return interfacePreferences
      case 'content':
        return contentPreferences
      default:
        return []
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">个性化定制中心</h2>
              <p className="text-purple-100 mt-1">打造专属于你的AI伴侣体验</p>
            </div>
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isPreviewMode 
                    ? 'bg-white text-purple-600' 
                    : 'bg-purple-500 hover:bg-purple-400'
                }`}
              >
                {isPreviewMode ? '退出预览' : '实时预览'}
              </motion.button>
              {onClose && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-purple-500 rounded-lg transition-colors"
                >
                  ✕
                </motion.button>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 侧边栏 */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    activeCategory === category.id
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'bg-white border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{category.description}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {getCurrentPreferences().map((pref) => (
                  <div key={pref.key} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{pref.name}</h3>
                      {pref.description && (
                        <p className="text-sm text-gray-600 mt-1">{pref.description}</p>
                      )}
                    </div>
                    {renderPreferenceControl(pref)}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              设置会自动保存并立即生效
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                重置默认
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                保存设置
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}