'use client'

import { useState, useEffect, useRef, useMemo, ReactElement } from 'react'
import { motion } from 'framer-motion'

interface VirtualScrollListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => ReactElement
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  loadMoreThreshold?: number
}

function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadMoreThreshold = 100
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isScrolling = useRef(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const totalHeight = items.length * itemHeight
  
  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1)
    }
  }, [items, scrollTop, itemHeight, containerHeight, overscan])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
    
    // Set scrolling state
    isScrolling.current = true
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false
    }, 150)

    // Check if we need to load more items
    if (hasMore && onLoadMore && !loading) {
      const scrollHeight = e.currentTarget.scrollHeight
      const clientHeight = e.currentTarget.clientHeight
      const scrollPosition = newScrollTop + clientHeight
      
      if (scrollHeight - scrollPosition <= loadMoreThreshold) {
        onLoadMore()
      }
    }
  }

  // Smooth scroll to index
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      const targetScrollTop = index * itemHeight
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior
      })
    }
  }

  // Scroll to top
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    scrollToIndex(0, behavior)
  }

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: totalHeight,
        behavior
      })
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={containerRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-gray-100"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible Items */}
          <div
            style={{
              transform: `translateY(${startIndex * itemHeight}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map((item, index) => (
              <motion.div
                key={startIndex + index}
                style={{ height: itemHeight }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {renderItem(item, startIndex + index)}
              </motion.div>
            ))}
          </div>

          {/* Loading More Indicator */}
          {loading && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">加载更多...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        {scrollTop > containerHeight && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToTop()}
            className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:shadow-xl transition-all duration-200"
            title="回到顶部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
        
        {hasMore && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center text-gray-600 hover:text-pink-600 hover:shadow-xl transition-all duration-200"
            title="到底部"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Scroll Progress Indicator */}
      {items.length > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-200"
            style={{
              width: `${Math.min(100, (scrollTop / Math.max(1, totalHeight - containerHeight)) * 100)}%`
            }}
          />
        </div>
      )}
    </div>
  )
}

export default VirtualScrollList

// Hook for virtual scroll list
export const useVirtualScrollList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const overscan = 5
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1)
    }
  }, [items, scrollTop, itemHeight, containerHeight])
  
  return {
    ...visibleRange,
    scrollTop,
    setScrollTop,
    totalHeight: items.length * itemHeight
  }
}