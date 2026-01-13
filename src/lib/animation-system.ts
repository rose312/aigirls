// 高级动画系统 - 流畅转场和微交互
interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none'
}

interface SpringConfig {
  tension: number
  friction: number
  mass?: number
}

interface PhysicsConfig {
  velocity: number
  acceleration: number
  friction: number
}

// 预定义的缓动函数
export const easingFunctions = {
  // 基础缓动
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  
  // 弹性缓动
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // 弹跳缓动
  easeInBounce: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutBounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // 自定义情感化缓动
  romantic: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  playful: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elegant: 'cubic-bezier(0.23, 1, 0.32, 1)',
  serene: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
}

// 动画预设
export const animationPresets = {
  // 淡入淡出
  fadeIn: {
    duration: 300,
    easing: easingFunctions.easeOut,
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ]
  },
  
  fadeOut: {
    duration: 200,
    easing: easingFunctions.easeIn,
    keyframes: [
      { opacity: 1 },
      { opacity: 0 }
    ]
  },

  // 滑动动画
  slideInUp: {
    duration: 400,
    easing: easingFunctions.easeOutBack,
    keyframes: [
      { transform: 'translateY(100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ]
  },

  slideInDown: {
    duration: 400,
    easing: easingFunctions.easeOutBack,
    keyframes: [
      { transform: 'translateY(-100%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ]
  },

  slideInLeft: {
    duration: 400,
    easing: easingFunctions.easeOutBack,
    keyframes: [
      { transform: 'translateX(-100%)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ]
  },

  slideInRight: {
    duration: 400,
    easing: easingFunctions.easeOutBack,
    keyframes: [
      { transform: 'translateX(100%)', opacity: 0 },
      { transform: 'translateX(0)', opacity: 1 }
    ]
  },

  // 缩放动画
  scaleIn: {
    duration: 300,
    easing: easingFunctions.easeOutBack,
    keyframes: [
      { transform: 'scale(0.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ]
  },

  scaleOut: {
    duration: 200,
    easing: easingFunctions.easeIn,
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(0.8)', opacity: 0 }
    ]
  },

  // 弹跳动画
  bounce: {
    duration: 600,
    easing: easingFunctions.easeOutBounce,
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1)' }
    ]
  },

  // 摇摆动画
  shake: {
    duration: 500,
    easing: easingFunctions.easeInOut,
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ]
  },

  // 脉冲动画
  pulse: {
    duration: 1000,
    easing: easingFunctions.easeInOut,
    keyframes: [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 0.8 },
      { transform: 'scale(1)', opacity: 1 }
    ]
  },

  // 旋转动画
  rotate: {
    duration: 1000,
    easing: easingFunctions.linear,
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ]
  },

  // 心跳动画
  heartbeat: {
    duration: 1200,
    easing: easingFunctions.romantic,
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ]
  },

  // 呼吸动画
  breathe: {
    duration: 2000,
    easing: easingFunctions.serene,
    keyframes: [
      { transform: 'scale(1)', opacity: 0.8 },
      { transform: 'scale(1.02)', opacity: 1 },
      { transform: 'scale(1)', opacity: 0.8 }
    ]
  }
}

// 页面转场动画
export const pageTransitions = {
  slideLeft: {
    enter: {
      duration: 400,
      easing: easingFunctions.easeOut,
      keyframes: [
        { transform: 'translateX(100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ]
    },
    exit: {
      duration: 400,
      easing: easingFunctions.easeIn,
      keyframes: [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(-100%)', opacity: 0 }
      ]
    }
  },

  slideRight: {
    enter: {
      duration: 400,
      easing: easingFunctions.easeOut,
      keyframes: [
        { transform: 'translateX(-100%)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ]
    },
    exit: {
      duration: 400,
      easing: easingFunctions.easeIn,
      keyframes: [
        { transform: 'translateX(0)', opacity: 1 },
        { transform: 'translateX(100%)', opacity: 0 }
      ]
    }
  },

  fade: {
    enter: {
      duration: 300,
      easing: easingFunctions.easeOut,
      keyframes: [
        { opacity: 0 },
        { opacity: 1 }
      ]
    },
    exit: {
      duration: 200,
      easing: easingFunctions.easeIn,
      keyframes: [
        { opacity: 1 },
        { opacity: 0 }
      ]
    }
  },

  scale: {
    enter: {
      duration: 400,
      easing: easingFunctions.easeOutBack,
      keyframes: [
        { transform: 'scale(0.9)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ]
    },
    exit: {
      duration: 200,
      easing: easingFunctions.easeIn,
      keyframes: [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 0 }
      ]
    }
  }
}

// 动画管理器
class AnimationManager {
  private runningAnimations = new Map<string, Animation>()
  private animationQueue: Array<() => Promise<void>> = []
  private isProcessingQueue = false

  // 执行动画
  animate(
    element: HTMLElement,
    preset: keyof typeof animationPresets | { keyframes: Keyframe[]; duration: number; easing: string },
    options?: Partial<AnimationConfig>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const animationConfig = typeof preset === 'string' 
          ? animationPresets[preset]
          : preset

        if (!animationConfig) {
          reject(new Error(`Animation preset '${preset}' not found`))
          return
        }

        const config: AnimationConfig = {
          duration: animationConfig.duration,
          easing: animationConfig.easing,
          fillMode: 'both',
          ...options
        }

        const animation = element.animate(animationConfig.keyframes, {
          duration: config.duration,
          easing: config.easing,
          delay: config.delay || 0,
          fill: config.fillMode
        })

        // 存储动画引用
        const animationId = `${element.id || 'element'}-${Date.now()}`
        this.runningAnimations.set(animationId, animation)

        animation.addEventListener('finish', () => {
          this.runningAnimations.delete(animationId)
          resolve()
        })

        animation.addEventListener('cancel', () => {
          this.runningAnimations.delete(animationId)
          reject(new Error('Animation was cancelled'))
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  // 执行序列动画
  async animateSequence(
    animations: Array<{
      element: HTMLElement
      preset: keyof typeof animationPresets
      options?: Partial<AnimationConfig>
    }>
  ): Promise<void> {
    for (const { element, preset, options } of animations) {
      await this.animate(element, preset, options)
    }
  }

  // 执行并行动画
  async animateParallel(
    animations: Array<{
      element: HTMLElement
      preset: keyof typeof animationPresets
      options?: Partial<AnimationConfig>
    }>
  ): Promise<void> {
    const promises = animations.map(({ element, preset, options }) =>
      this.animate(element, preset, options)
    )
    await Promise.all(promises)
  }

  // 添加到动画队列
  queueAnimation(animationFn: () => Promise<void>): void {
    this.animationQueue.push(animationFn)
    this.processQueue()
  }

  // 处理动画队列
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.animationQueue.length > 0) {
      const animationFn = this.animationQueue.shift()
      if (animationFn) {
        try {
          await animationFn()
        } catch (error) {
          console.error('Animation queue error:', error)
        }
      }
    }

    this.isProcessingQueue = false
  }

  // 停止所有动画
  stopAllAnimations(): void {
    this.runningAnimations.forEach(animation => {
      animation.cancel()
    })
    this.runningAnimations.clear()
    this.animationQueue.length = 0
  }

  // 停止特定元素的动画
  stopElementAnimations(element: HTMLElement): void {
    this.runningAnimations.forEach((animation, id) => {
      if (animation.effect?.target === element) {
        animation.cancel()
        this.runningAnimations.delete(id)
      }
    })
  }

  // 暂停所有动画
  pauseAllAnimations(): void {
    this.runningAnimations.forEach(animation => {
      animation.pause()
    })
  }

  // 恢复所有动画
  resumeAllAnimations(): void {
    this.runningAnimations.forEach(animation => {
      animation.play()
    })
  }

  // 获取运行中的动画数量
  getRunningAnimationsCount(): number {
    return this.runningAnimations.size
  }
}

// 物理动画系统
class PhysicsAnimationSystem {
  // 弹簧动画
  spring(
    element: HTMLElement,
    targetValue: number,
    property: string = 'translateY',
    config: SpringConfig = { tension: 170, friction: 26, mass: 1 }
  ): Promise<void> {
    return new Promise((resolve) => {
      const { tension, friction, mass = 1 } = config
      let currentValue = 0
      let velocity = 0
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const deltaTime = (currentTime - startTime) / 1000
        
        // 弹簧物理计算
        const springForce = -tension * (currentValue - targetValue)
        const dampingForce = -friction * velocity
        const acceleration = (springForce + dampingForce) / mass
        
        velocity += acceleration * deltaTime
        currentValue += velocity * deltaTime

        // 应用变换
        if (property.startsWith('translate')) {
          element.style.transform = `${property}(${currentValue}px)`
        } else if (property === 'scale') {
          element.style.transform = `scale(${currentValue})`
        } else if (property === 'rotate') {
          element.style.transform = `rotate(${currentValue}deg)`
        } else {
          (element.style as any)[property] = currentValue
        }

        // 检查是否达到稳定状态
        if (Math.abs(velocity) < 0.01 && Math.abs(currentValue - targetValue) < 0.01) {
          resolve()
        } else {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // 惯性滚动
  inertiaScroll(
    element: HTMLElement,
    initialVelocity: number,
    config: PhysicsConfig = { velocity: initialVelocity, acceleration: 0, friction: 0.95 }
  ): Promise<void> {
    return new Promise((resolve) => {
      let { velocity, friction } = config
      let position = 0

      const animate = () => {
        velocity *= friction
        position += velocity

        element.scrollTop = position

        if (Math.abs(velocity) < 0.1) {
          resolve()
        } else {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    })
  }
}

// 微交互动画
export const microInteractions = {
  // 按钮点击反馈
  buttonPress: (element: HTMLElement) => {
    return animationManager.animate(element, 'scaleIn', { duration: 150 })
  },

  // 悬停效果
  hover: (element: HTMLElement) => {
    return animationManager.animate(element, {
      keyframes: [
        { transform: 'scale(1)' },
        { transform: 'scale(1.05)' }
      ],
      duration: 200,
      easing: easingFunctions.easeOut
    })
  },

  // 取消悬停
  unhover: (element: HTMLElement) => {
    return animationManager.animate(element, {
      keyframes: [
        { transform: 'scale(1.05)' },
        { transform: 'scale(1)' }
      ],
      duration: 200,
      easing: easingFunctions.easeOut
    })
  },

  // 输入框聚焦
  inputFocus: (element: HTMLElement) => {
    return animationManager.animate(element, {
      keyframes: [
        { boxShadow: '0 0 0 0 var(--color-primary)' },
        { boxShadow: '0 0 0 3px rgba(var(--color-primary), 0.1)' }
      ],
      duration: 200,
      easing: easingFunctions.easeOut
    })
  },

  // 输入框失焦
  inputBlur: (element: HTMLElement) => {
    return animationManager.animate(element, {
      keyframes: [
        { boxShadow: '0 0 0 3px rgba(var(--color-primary), 0.1)' },
        { boxShadow: '0 0 0 0 var(--color-primary)' }
      ],
      duration: 200,
      easing: easingFunctions.easeIn
    })
  },

  // 成功反馈
  success: (element: HTMLElement) => {
    return animationManager.animate(element, 'bounce', { duration: 400 })
  },

  // 错误反馈
  error: (element: HTMLElement) => {
    return animationManager.animate(element, 'shake', { duration: 300 })
  },

  // 加载动画
  loading: (element: HTMLElement) => {
    return animationManager.animate(element, 'rotate', { duration: 1000 })
  }
}

// 创建全局实例
export const animationManager = new AnimationManager()
export const physicsAnimations = new PhysicsAnimationSystem()

// React Hook for animations
import { useRef, useCallback } from 'react'

export const useAnimation = () => {
  const elementRef = useRef<HTMLElement>(null)

  const animate = useCallback(
    (preset: keyof typeof animationPresets, options?: Partial<AnimationConfig>) => {
      if (elementRef.current) {
        return animationManager.animate(elementRef.current, preset, options)
      }
      return Promise.resolve()
    },
    []
  )

  const microInteract = useCallback(
    (interaction: keyof typeof microInteractions) => {
      if (elementRef.current && microInteractions[interaction]) {
        return microInteractions[interaction](elementRef.current)
      }
      return Promise.resolve()
    },
    []
  )

  return {
    elementRef,
    animate,
    microInteract,
    animationManager,
    physicsAnimations
  }
}

// 页面转场Hook
export const usePageTransition = (transitionType: keyof typeof pageTransitions = 'fade') => {
  const pageRef = useRef<HTMLElement>(null)

  const enterPage = useCallback(async () => {
    if (pageRef.current) {
      const transition = pageTransitions[transitionType]
      await animationManager.animate(pageRef.current, transition.enter)
    }
  }, [transitionType])

  const exitPage = useCallback(async () => {
    if (pageRef.current) {
      const transition = pageTransitions[transitionType]
      await animationManager.animate(pageRef.current, transition.exit)
    }
  }, [transitionType])

  return {
    pageRef,
    enterPage,
    exitPage
  }
}

// 自动清理动画
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    animationManager.stopAllAnimations()
  })
}

export default animationManager