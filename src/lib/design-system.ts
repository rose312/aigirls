// 高级设计系统 - 情感化视觉主题和色彩系统
interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  shadow: string
  gradient: string
}

interface EmotionalTheme {
  name: string
  emotion: string
  colors: {
    light: ColorPalette
    dark: ColorPalette
  }
  typography: {
    fontFamily: string
    headingWeight: number
    bodyWeight: number
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

// 情感化主题定义
export const emotionalThemes: Record<string, EmotionalTheme> = {
  romantic: {
    name: '浪漫',
    emotion: 'romantic',
    colors: {
      light: {
        primary: '#FF6B9D',
        secondary: '#FFB3D1',
        accent: '#FF8FA3',
        background: '#FFF8FB',
        surface: '#FFFFFF',
        text: '#2D1B2E',
        textSecondary: '#8B5A6B',
        border: '#F0D0DC',
        shadow: 'rgba(255, 107, 157, 0.15)',
        gradient: 'linear-gradient(135deg, #FF6B9D 0%, #FFB3D1 100%)'
      },
      dark: {
        primary: '#FF6B9D',
        secondary: '#8B4A6B',
        accent: '#FF8FA3',
        background: '#1A0E14',
        surface: '#2D1B2E',
        text: '#F5E6ED',
        textSecondary: '#C4A4B0',
        border: '#4A2E3A',
        shadow: 'rgba(255, 107, 157, 0.25)',
        gradient: 'linear-gradient(135deg, #FF6B9D 0%, #8B4A6B 100%)'
      }
    },
    typography: {
      fontFamily: '"Inter", "Noto Sans SC", sans-serif',
      headingWeight: 600,
      bodyWeight: 400
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px rgba(255, 107, 157, 0.1)',
      md: '0 4px 6px rgba(255, 107, 157, 0.15)',
      lg: '0 10px 15px rgba(255, 107, 157, 0.2)',
      xl: '0 20px 25px rgba(255, 107, 157, 0.25)'
    }
  },
  
  elegant: {
    name: '优雅',
    emotion: 'elegant',
    colors: {
      light: {
        primary: '#8B5CF6',
        secondary: '#C4B5FD',
        accent: '#A78BFA',
        background: '#FAFAFA',
        surface: '#FFFFFF',
        text: '#1F2937',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        shadow: 'rgba(139, 92, 246, 0.15)',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)'
      },
      dark: {
        primary: '#8B5CF6',
        secondary: '#5B21B6',
        accent: '#A78BFA',
        background: '#0F0F23',
        surface: '#1E1B4B',
        text: '#F3F4F6',
        textSecondary: '#D1D5DB',
        border: '#374151',
        shadow: 'rgba(139, 92, 246, 0.25)',
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)'
      }
    },
    typography: {
      fontFamily: '"Playfair Display", "Noto Serif SC", serif',
      headingWeight: 700,
      bodyWeight: 400
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px rgba(139, 92, 246, 0.1)',
      md: '0 4px 6px rgba(139, 92, 246, 0.15)',
      lg: '0 10px 15px rgba(139, 92, 246, 0.2)',
      xl: '0 20px 25px rgba(139, 92, 246, 0.25)'
    }
  },

  playful: {
    name: '活泼',
    emotion: 'playful',
    colors: {
      light: {
        primary: '#F59E0B',
        secondary: '#FCD34D',
        accent: '#FBBF24',
        background: '#FFFBEB',
        surface: '#FFFFFF',
        text: '#1F2937',
        textSecondary: '#6B7280',
        border: '#FEF3C7',
        shadow: 'rgba(245, 158, 11, 0.15)',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)'
      },
      dark: {
        primary: '#F59E0B',
        secondary: '#92400E',
        accent: '#FBBF24',
        background: '#1C1917',
        surface: '#292524',
        text: '#F5F5F4',
        textSecondary: '#D6D3D1',
        border: '#44403C',
        shadow: 'rgba(245, 158, 11, 0.25)',
        gradient: 'linear-gradient(135deg, #F59E0B 0%, #92400E 100%)'
      }
    },
    typography: {
      fontFamily: '"Poppins", "Noto Sans SC", sans-serif',
      headingWeight: 700,
      bodyWeight: 500
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px rgba(245, 158, 11, 0.1)',
      md: '0 4px 6px rgba(245, 158, 11, 0.15)',
      lg: '0 10px 15px rgba(245, 158, 11, 0.2)',
      xl: '0 20px 25px rgba(245, 158, 11, 0.25)'
    }
  },

  serene: {
    name: '宁静',
    emotion: 'serene',
    colors: {
      light: {
        primary: '#06B6D4',
        secondary: '#67E8F9',
        accent: '#22D3EE',
        background: '#F0FDFF',
        surface: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#475569',
        border: '#E0F2FE',
        shadow: 'rgba(6, 182, 212, 0.15)',
        gradient: 'linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)'
      },
      dark: {
        primary: '#06B6D4',
        secondary: '#0E7490',
        accent: '#22D3EE',
        background: '#0C1821',
        surface: '#164E63',
        text: '#F1F5F9',
        textSecondary: '#CBD5E1',
        border: '#334155',
        shadow: 'rgba(6, 182, 212, 0.25)',
        gradient: 'linear-gradient(135deg, #06B6D4 0%, #0E7490 100%)'
      }
    },
    typography: {
      fontFamily: '"Source Sans Pro", "Noto Sans SC", sans-serif',
      headingWeight: 600,
      bodyWeight: 400
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.75rem',
      lg: '1rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px rgba(6, 182, 212, 0.1)',
      md: '0 4px 6px rgba(6, 182, 212, 0.15)',
      lg: '0 10px 15px rgba(6, 182, 212, 0.2)',
      xl: '0 20px 25px rgba(6, 182, 212, 0.25)'
    }
  }
}

// 设计系统管理器
class DesignSystemManager {
  private currentTheme: string = 'romantic'
  private isDarkMode: boolean = false
  private listeners: ((theme: EmotionalTheme, isDark: boolean) => void)[] = []

  constructor() {
    // 从localStorage加载主题设置
    this.loadThemeFromStorage()
    
    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        if (!this.hasUserPreference()) {
          this.setDarkMode(e.matches)
        }
      })
    }
  }

  // 设置主题
  setTheme(themeName: string): void {
    if (emotionalThemes[themeName]) {
      this.currentTheme = themeName
      this.saveThemeToStorage()
      this.notifyListeners()
      this.applyThemeToDOM()
    }
  }

  // 设置深色模式
  setDarkMode(isDark: boolean): void {
    this.isDarkMode = isDark
    this.saveThemeToStorage()
    this.notifyListeners()
    this.applyThemeToDOM()
  }

  // 切换深色模式
  toggleDarkMode(): void {
    this.setDarkMode(!this.isDarkMode)
  }

  // 获取当前主题
  getCurrentTheme(): EmotionalTheme {
    return emotionalThemes[this.currentTheme]
  }

  // 获取当前颜色调色板
  getCurrentColors(): ColorPalette {
    const theme = this.getCurrentTheme()
    return this.isDarkMode ? theme.colors.dark : theme.colors.light
  }

  // 获取主题名称
  getCurrentThemeName(): string {
    return this.currentTheme
  }

  // 是否为深色模式
  getIsDarkMode(): boolean {
    return this.isDarkMode
  }

  // 应用主题到DOM
  private applyThemeToDOM(): void {
    if (typeof document === 'undefined') return

    const theme = this.getCurrentTheme()
    const colors = this.getCurrentColors()
    const root = document.documentElement

    // 设置CSS变量
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-shadow', colors.shadow)
    root.style.setProperty('--gradient-primary', colors.gradient)

    // 设置字体
    root.style.setProperty('--font-family', theme.typography.fontFamily)
    root.style.setProperty('--font-weight-heading', theme.typography.headingWeight.toString())
    root.style.setProperty('--font-weight-body', theme.typography.bodyWeight.toString())

    // 设置间距
    root.style.setProperty('--spacing-xs', theme.spacing.xs)
    root.style.setProperty('--spacing-sm', theme.spacing.sm)
    root.style.setProperty('--spacing-md', theme.spacing.md)
    root.style.setProperty('--spacing-lg', theme.spacing.lg)
    root.style.setProperty('--spacing-xl', theme.spacing.xl)

    // 设置圆角
    root.style.setProperty('--border-radius-sm', theme.borderRadius.sm)
    root.style.setProperty('--border-radius-md', theme.borderRadius.md)
    root.style.setProperty('--border-radius-lg', theme.borderRadius.lg)
    root.style.setProperty('--border-radius-full', theme.borderRadius.full)

    // 设置阴影
    root.style.setProperty('--shadow-sm', theme.shadows.sm)
    root.style.setProperty('--shadow-md', theme.shadows.md)
    root.style.setProperty('--shadow-lg', theme.shadows.lg)
    root.style.setProperty('--shadow-xl', theme.shadows.xl)

    // 设置主题类名
    root.className = root.className.replace(/theme-\w+/g, '')
    root.classList.add(`theme-${this.currentTheme}`)
    
    if (this.isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // 保存主题到localStorage
  private saveThemeToStorage(): void {
    try {
      localStorage.setItem('design-theme', JSON.stringify({
        theme: this.currentTheme,
        isDarkMode: this.isDarkMode,
        timestamp: Date.now()
      }))
    } catch (error) {
      // 忽略localStorage错误
    }
  }

  // 从localStorage加载主题
  private loadThemeFromStorage(): void {
    try {
      const stored = localStorage.getItem('design-theme')
      if (stored) {
        const { theme, isDarkMode } = JSON.parse(stored)
        if (emotionalThemes[theme]) {
          this.currentTheme = theme
          this.isDarkMode = isDarkMode
          return
        }
      }
    } catch (error) {
      // 解析错误，使用默认主题
    }

    // 如果没有存储的主题，检查系统偏好
    if (typeof window !== 'undefined') {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  // 检查是否有用户偏好设置
  private hasUserPreference(): boolean {
    try {
      return localStorage.getItem('design-theme') !== null
    } catch (error) {
      return false
    }
  }

  // 添加监听器
  addListener(listener: (theme: EmotionalTheme, isDark: boolean) => void): void {
    this.listeners.push(listener)
  }

  // 移除监听器
  removeListener(listener: (theme: EmotionalTheme, isDark: boolean) => void): void {
    const index = this.listeners.indexOf(listener)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  // 通知监听器
  private notifyListeners(): void {
    const theme = this.getCurrentTheme()
    this.listeners.forEach(listener => listener(theme, this.isDarkMode))
  }

  // 获取所有可用主题
  getAvailableThemes(): { name: string; emotion: string; displayName: string }[] {
    return Object.entries(emotionalThemes).map(([key, theme]) => ({
      name: key,
      emotion: theme.emotion,
      displayName: theme.name
    }))
  }

  // 根据情绪推荐主题
  recommendThemeByEmotion(emotion: string): string {
    const emotionMap: Record<string, string> = {
      'happy': 'playful',
      'romantic': 'romantic',
      'calm': 'serene',
      'sophisticated': 'elegant',
      'energetic': 'playful',
      'peaceful': 'serene',
      'passionate': 'romantic',
      'professional': 'elegant'
    }

    return emotionMap[emotion] || 'romantic'
  }

  // 生成主题预览
  generateThemePreview(themeName: string, isDark: boolean = false): {
    colors: ColorPalette
    preview: string
  } {
    const theme = emotionalThemes[themeName]
    if (!theme) {
      throw new Error(`Theme ${themeName} not found`)
    }

    const colors = isDark ? theme.colors.dark : theme.colors.light
    
    return {
      colors,
      preview: `
        <div style="
          background: ${colors.gradient};
          padding: 16px;
          border-radius: ${theme.borderRadius.lg};
          box-shadow: ${theme.shadows.lg};
          font-family: ${theme.typography.fontFamily};
          color: ${colors.text};
        ">
          <h3 style="margin: 0 0 8px 0; font-weight: ${theme.typography.headingWeight};">
            ${theme.name}主题
          </h3>
          <p style="margin: 0; color: ${colors.textSecondary}; font-weight: ${theme.typography.bodyWeight};">
            体验${theme.name}风格的视觉设计
          </p>
        </div>
      `
    }
  }
}

// 创建全局设计系统实例
export const designSystem = new DesignSystemManager()

// React Hook for design system
import { useState, useEffect } from 'react'

export const useDesignSystem = () => {
  const [theme, setTheme] = useState(designSystem.getCurrentTheme())
  const [isDarkMode, setIsDarkMode] = useState(designSystem.getIsDarkMode())
  const [colors, setColors] = useState(designSystem.getCurrentColors())

  useEffect(() => {
    const updateTheme = (newTheme: EmotionalTheme, newIsDark: boolean) => {
      setTheme(newTheme)
      setIsDarkMode(newIsDark)
      setColors(designSystem.getCurrentColors())
    }

    designSystem.addListener(updateTheme)

    return () => {
      designSystem.removeListener(updateTheme)
    }
  }, [])

  return {
    theme,
    isDarkMode,
    colors,
    setTheme: designSystem.setTheme.bind(designSystem),
    setDarkMode: designSystem.setDarkMode.bind(designSystem),
    toggleDarkMode: designSystem.toggleDarkMode.bind(designSystem),
    availableThemes: designSystem.getAvailableThemes(),
    recommendTheme: designSystem.recommendThemeByEmotion.bind(designSystem)
  }
}

// 主题切换组件
export const ThemeSelector = () => {
  const { theme, isDarkMode, setTheme, toggleDarkMode, availableThemes } = useDesignSystem()

  return (
    <div className="theme-selector p-4 bg-surface rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-text">选择主题</h3>
      
      {/* 主题选择 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {availableThemes.map((themeOption) => (
          <button
            key={themeOption.name}
            onClick={() => setTheme(themeOption.name)}
            className={`
              p-3 rounded-lg border-2 transition-all duration-200
              ${theme.emotion === themeOption.emotion
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
              }
            `}
          >
            <div className="text-sm font-medium text-text">
              {themeOption.displayName}
            </div>
          </button>
        ))}
      </div>

      {/* 深色模式切换 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">深色模式</span>
        <button
          onClick={toggleDarkMode}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${isDarkMode ? 'bg-primary' : 'bg-border'}
          `}
        >
          <div
            className={`
              absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
              ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  )
}

// 初始化设计系统
if (typeof window !== 'undefined') {
  // 应用初始主题
  designSystem.setTheme(designSystem.getCurrentThemeName())
}

export default designSystem