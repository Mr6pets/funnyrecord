import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Home, PenTool, History, BarChart3, Settings, User } from 'lucide-react'

const Layout = () => {
  const { user, loading, initializeAuth } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    // 检查是否处于体验模式
    const experienceMode = localStorage.getItem('experience_mode')
    const localUser = localStorage.getItem('current_user')
    
    // 如果不是体验模式且没有用户登录，则跳转到认证页面
    if (!loading && !user && experienceMode !== 'true' && !localUser) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/record', icon: PenTool, label: '记录' },
    { path: '/history', icon: History, label: '历史' },
    { path: '/stats', icon: BarChart3, label: '统计' },
    { path: '/settings', icon: Settings, label: '设置' }
  ]

  const handleNavClick = (path: string) => {
    navigate(path)
  }

  const getUserDisplayName = () => {
    const experienceMode = localStorage.getItem('experience_mode')
    if (experienceMode === 'true') {
      return '体验用户'
    }
    
    const localUser = localStorage.getItem('current_user')
    if (localUser) {
      const user = JSON.parse(localUser)
      return user.username || user.email || '本地用户'
    }
    
    if (user) {
      return user.email || '用户'
    }
    
    return '未知用户'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="bg-white shadow-sm border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">{getUserDisplayName()}</span>
            {localStorage.getItem('experience_mode') === 'true' && (
              <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                体验模式
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="pb-20">
        <Outlet />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout