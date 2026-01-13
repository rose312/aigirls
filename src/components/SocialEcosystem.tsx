'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocialEcosystem } from '@/lib/social-ecosystem'

interface SocialEcosystemProps {
  userId: string
}

export default function SocialEcosystem({ userId }: SocialEcosystemProps) {
  const [activeTab, setActiveTab] = useState('feed')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostType, setNewPostType] = useState('companion_share')

  const {
    profile,
    feed,
    activeGames,
    friends,
    notifications,
    createPost,
    likePost,
    commentPost,
    joinGame,
    addFriend
  } = useSocialEcosystem(userId)

  const tabs = [
    { id: 'feed', name: '动态', icon: '📱', count: feed?.length || 0 },
    { id: 'games', name: '游戏', icon: '🎮', count: activeGames?.length || 0 },
    { id: 'friends', name: '好友', icon: '👥', count: friends?.length || 0 },
    { id: 'profile', name: '我的', icon: '👤', count: profile?.badges?.length || 0 }
  ]

  const postTypes = [
    { id: 'companion_share', name: '伴侣分享', icon: '💝', description: '分享你的AI伴侣' },
    { id: 'conversation_highlight', name: '精彩对话', icon: '💬', description: '分享有趣的对话' },
    { id: 'achievement', name: '成就展示', icon: '🏆', description: '展示你的成就' },
    { id: 'tip', name: '使用技巧', icon: '💡', description: '分享使用心得' }
  ]

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPost(newPostType as any, { text: newPostContent }, newPostContent)
      setNewPostContent('')
      setShowCreatePost(false)
    }
  }

  const renderFeedTab = () => (
    <div className="space-y-4">
      {/* 创建帖子按钮 */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowCreatePost(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 transition-colors"
      >
        <div className="flex items-center justify-center space-x-2">
          <span className="text-xl">✨</span>
          <span className="font-medium">分享你的精彩时刻</span>
        </div>
      </motion.button>

      {/* 动态列表 */}
      <div className="space-y-4">
        {feed?.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            {/* 帖子头部 */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {post.userId.slice(-2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">用户{post.userId.slice(-4)}</div>
                <div className="text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {postTypes.find(t => t.id === post.type)?.name || post.type}
              </div>
            </div>

            {/* 帖子内容 */}
            <div className="mb-3">
              <p className="text-gray-800">{post.caption}</p>
              {post.content && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(post.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 互动按钮 */}
            <div className="flex items-center space-x-6 pt-3 border-t border-gray-100">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => likePost(post.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <span>❤️</span>
                <span className="text-sm">{post.likes}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
              >
                <span>💬</span>
                <span className="text-sm">{post.comments?.length || 0}</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
              >
                <span>🔄</span>
                <span className="text-sm">{post.shares}</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderGamesTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎮</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">社交游戏</h3>
        <p className="text-gray-600 mb-6">参与有趣的社交游戏，赢取奖励和徽章</p>
      </div>

      {activeGames?.map((game, index) => (
        <motion.div
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-900">{game.name}</h4>
              <p className="text-gray-600 mt-1">{game.description}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              game.status === 'active' ? 'bg-green-100 text-green-800' :
              game.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {game.status === 'active' ? '进行中' : 
               game.status === 'upcoming' ? '即将开始' : '已结束'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">参与人数</div>
              <div className="text-lg font-bold text-gray-900">
                {game.participants?.length || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">游戏类型</div>
              <div className="text-lg font-bold text-gray-900">
                {game.type === 'daily_challenge' ? '每日挑战' :
                 game.type === 'weekly_event' ? '周活动' : '季节赛'}
              </div>
            </div>
          </div>

          {game.rewards && game.rewards.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">奖励</div>
              <div className="flex flex-wrap gap-2">
                {game.rewards.map((reward, rewardIndex) => (
                  <div
                    key={rewardIndex}
                    className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs"
                  >
                    <span>🏆</span>
                    <span>{reward.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {game.status === 'active' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => joinGame(game.id)}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              参与游戏
            </motion.button>
          )}
        </motion.div>
      ))}
    </div>
  )

  const renderFriendsTab = () => (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">我的好友</h3>
        <p className="text-gray-600 mb-6">与其他用户建立友谊，分享精彩时刻</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {friends?.map((friend, index) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {friend.username?.slice(0, 2) || friend.id.slice(-2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {friend.username || `用户${friend.id.slice(-4)}`}
                </div>
                <div className="text-sm text-gray-500">
                  等级 {friend.level} • {friend.socialStats?.friendsCount || 0} 好友
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">获赞</div>
                <div className="text-sm font-bold text-gray-900">
                  {friend.socialStats?.likesReceived || 0}
                </div>
              </div>
            </div>

            {friend.badges && friend.badges.length > 0 && (
              <div className="flex space-x-1 mt-3">
                {friend.badges.slice(0, 3).map((badge, badgeIndex) => (
                  <div
                    key={badgeIndex}
                    className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-xs"
                    title={badge.name}
                  >
                    {badge.icon}
                  </div>
                ))}
                {friend.badges.length > 3 && (
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-600">
                    +{friend.badges.length - 3}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">
              {profile?.username?.slice(0, 2) || profile?.id.slice(-2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold">
              {profile?.username || `用户${profile?.id.slice(-4)}`}
            </h3>
            <p className="text-purple-100">
              等级 {profile?.level} • 经验值 {profile?.experience}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{profile?.socialStats?.friendsCount || 0}</div>
            <div className="text-sm text-purple-100">好友</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile?.socialStats?.likesReceived || 0}</div>
            <div className="text-sm text-purple-100">获赞</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{profile?.socialStats?.totalShares || 0}</div>
            <div className="text-sm text-purple-100">分享</div>
          </div>
        </div>
      </div>

      {/* 徽章收集 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">徽章收集</h4>
        {profile?.badges && profile.badges.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {profile.badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-4 rounded-lg border-2 ${
                  badge.rarity === 'legendary' ? 'border-yellow-400 bg-yellow-50' :
                  badge.rarity === 'epic' ? 'border-purple-400 bg-purple-50' :
                  badge.rarity === 'rare' ? 'border-blue-400 bg-blue-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="text-sm font-medium text-gray-900">{badge.name}</div>
                <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏆</div>
            <p>还没有获得徽章，快去参与活动吧！</p>
          </div>
        )}
      </div>

      {/* 等级进度 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-bold text-gray-900 mb-4">等级进度</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">当前等级</span>
            <span className="font-bold text-purple-600">Lv.{profile?.level || 1}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${((profile?.experience || 0) % 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{(profile?.experience || 0) % 100}/100 EXP</span>
            <span>下一级: Lv.{(profile?.level || 1) + 1}</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 通知栏 */}
      <AnimatePresence>
        {notifications && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">🔔</span>
              <span className="text-sm text-blue-800">
                {notifications[0].title || notifications[0].type}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 标签导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-4 text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xl">{tab.icon}</span>
                <span className="font-medium">{tab.name}</span>
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'feed' && renderFeedTab()}
          {activeTab === 'games' && renderGamesTab()}
          {activeTab === 'friends' && renderFriendsTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </motion.div>
      </AnimatePresence>

      {/* 创建帖子弹窗 */}
      <AnimatePresence>
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">创建新帖子</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    帖子类型
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {postTypes.map((type) => (
                      <motion.button
                        key={type.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setNewPostType(type.id)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          newPostType === type.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-medium">{type.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="分享你的想法..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim()}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    newPostContent.trim()
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  发布
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}