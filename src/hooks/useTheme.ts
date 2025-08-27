import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 从localStorage获取保存的主题设置
    const savedTheme = localStorage.getItem('theme') as Theme
    return savedTheme || 'system'
  })

  const [isDark, setIsDark] = useState(false)

  // 检测系统主题偏好
  const getSystemTheme = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  // 应用主题到DOM
  const applyTheme = (isDarkMode: boolean) => {
    const root = document.documentElement
    
    if (isDarkMode) {
      root.classList.add('dark')
      root.style.setProperty('--bg-primary', '#1a1a1a')
      root.style.setProperty('--bg-secondary', '#2d2d2d')
      root.style.setProperty('--bg-tertiary', '#404040')
      root.style.setProperty('--text-primary', '#ffffff')
      root.style.setProperty('--text-secondary', '#d1d5db')
      root.style.setProperty('--text-tertiary', '#9ca3af')
      root.style.setProperty('--border-color', '#404040')
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)')
    } else {
      root.classList.remove('dark')
      root.style.setProperty('--bg-primary', '#ffffff')
      root.style.setProperty('--bg-secondary', '#f9fafb')
      root.style.setProperty('--bg-tertiary', '#f3f4f6')
      root.style.setProperty('--text-primary', '#111827')
      root.style.setProperty('--text-secondary', '#374151')
      root.style.setProperty('--text-tertiary', '#6b7280')
      root.style.setProperty('--border-color', '#e5e7eb')
      root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)')
    }
  }

  // 计算实际的主题状态
  const calculateTheme = (themeMode: Theme): boolean => {
    if (themeMode === 'dark') return true
    if (themeMode === 'light') return false
    return getSystemTheme() // system
  }

  // 切换主题
  const toggleTheme = () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(newTheme)
  }

  // 设置特定主题
  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  // 监听主题变化
  useEffect(() => {
    const newIsDark = calculateTheme(theme)
    setIsDark(newIsDark)
    applyTheme(newIsDark)
    
    // 保存到localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const newIsDark = getSystemTheme()
        setIsDark(newIsDark)
        applyTheme(newIsDark)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    
    // 初始化时应用主题
    const initialIsDark = calculateTheme(theme)
    setIsDark(initialIsDark)
    applyTheme(initialIsDark)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return {
    theme,
    isDark,
    toggleTheme,
    setThemeMode,
    getThemeLabel: () => {
      switch (theme) {
        case 'light': return '浅色模式'
        case 'dark': return '深色模式'
        case 'system': return '跟随系统'
        default: return '跟随系统'
      }
    }
  }
}