import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus, History, BarChart3, Settings } from 'lucide-react'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // 检查用户认证状态
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 检查是否是体验模式（通过localStorage标记）
      const isExperienceMode = localStorage.getItem('experience_mode') === 'true'
      
      console.log('Layout认证检查:', { session: !!session, isExperienceMode })
      
      if (!session && !isExperienceMode) {
        console.log('无认证且非体验模式，重定向到登录页')
        navigate('/auth')
      } else {
        console.log('认证通过或体验模式，允许访问')
      }
    }
    checkAuth()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isExperienceMode = localStorage.getItem('experience_mode') === 'true'
      
      console.log('认证状态变化:', { event, session: !!session, isExperienceMode })
      
      if ((event === 'SIGNED_OUT' || !session) && !isExperienceMode) {
        console.log('用户登出且非体验模式，重定向到登录页')
        navigate('/auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/record', icon: Plus, label: '记录' },
    { path: '/history', icon: History, label: '历史' },
    { path: '/stats', icon: BarChart3, label: '统计' },
    { path: '/settings', icon: Settings, label: '设置' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 主内容区域 */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-orange-500' : 'text-gray-500'} />
                <span className="text-xs mt-1 font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default Layout