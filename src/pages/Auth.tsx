import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Heart, Mail, Lock, User } from 'lucide-react'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        navigate('/')
      } else {
        console.log('🚀 开始注册流程...')
        console.log('📧 注册邮箱:', email)
        console.log('🔐 密码长度:', password.length)
        
        // 尝试禁用邮箱确认的注册方式
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined, // 禁用邮箱重定向
            data: {
              username: name || email.split('@')[0],
              skip_email_confirmation: true
            }
          }
        })
        
        // 超详细的错误日志
        console.log('📊 Supabase注册完整响应:', {
          data: {
            user: data?.user ? {
              id: data.user.id,
              email: data.user.email,
              email_confirmed_at: data.user.email_confirmed_at,
              created_at: data.user.created_at
            } : null,
            session: data?.session ? 'session_exists' : 'no_session'
          },
          error: error ? {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
            details: error
          } : null
        })
        
        if (error) {
          console.error('❌ Supabase注册失败 - 完整错误信息:', {
            errorType: typeof error,
            message: error.message,
            status: error.status,
            statusCode: error.status,
            code: error.code || 'NO_CODE',
            name: error.name || 'NO_NAME',
            stack: error.stack,
            fullError: JSON.stringify(error, null, 2)
          })
          
          // 特殊处理不同类型的错误
          if (error.message?.includes('email_address_not_authorized')) {
            console.log('🔍 检测到邮箱未授权错误，可能需要在Supabase控制台中配置邮箱域名')
          }
          if (error.message?.includes('signup_disabled')) {
            console.log('🔍 检测到注册被禁用，需要在Supabase控制台中启用注册')
          }
          
          throw error
        }

        // 检查用户是否成功创建
        if (data?.user) {
          console.log('✅ 用户创建成功:', {
            userId: data.user.id,
            email: data.user.email,
            emailConfirmed: data.user.email_confirmed_at ? '已确认' : '未确认'
          })
          
          // 如果有session，说明可以直接登录
          if (data.session) {
            console.log('✅ 获得session，直接登录成功')
            setSuccess('注册成功！正在跳转...')
            setTimeout(() => navigate('/'), 1000)
          } else {
            console.log('⚠️ 用户创建成功但无session，可能需要邮箱确认')
            setSuccess('注册成功！请检查邮箱确认链接，或使用体验模式')
          }
        } else {
          console.error('❌ 用户创建失败：没有返回用户数据')
          throw new Error('用户创建失败：服务器未返回用户信息')
        }
      }
    } catch (error: any) {
      console.error('🚨 认证错误 - 超详细信息:', {
        error,
        message: error.message,
        code: error.code,
        status: error.status,
        statusText: error.statusText,
        name: error.name,
        stack: error.stack,
        fullErrorString: JSON.stringify(error, null, 2)
      })
      
      // 根据具体错误类型提供精确的错误信息和解决方案
      if (error.message?.includes('Database error saving new user')) {
        console.log('🔍 数据库保存用户错误 - 可能的原因：RLS策略、权限问题、表结构问题')
        setError('数据库配置问题，请尝试使用"体验模式"直接进入应用')
      } else if (error.message?.includes('email_address_not_authorized')) {
        console.log('🔍 邮箱未授权错误 - 需要在Supabase控制台配置允许的邮箱域名')
        setError('该邮箱域名未被授权，请联系管理员或使用体验模式')
      } else if (error.message?.includes('signup_disabled')) {
        console.log('🔍 注册被禁用 - 需要在Supabase控制台启用用户注册')
        setError('用户注册功能已禁用，请使用体验模式或联系管理员')
      } else if (error.message?.includes('Invalid login credentials')) {
        console.log('🔍 登录凭据无效')
        setError('邮箱或密码错误，请检查输入信息')
      } else if (error.message?.includes('email')) {
        console.log('🔍 邮箱相关错误')
        setError('邮箱格式不正确或已被使用')
      } else if (error.message?.includes('password')) {
        console.log('🔍 密码相关错误')
        setError('密码至少需要6位字符')
      } else if (error.message?.includes('rate_limit')) {
        console.log('🔍 请求频率限制')
        setError('请求过于频繁，请稍后再试')
      } else if (error.message?.includes('network')) {
        console.log('🔍 网络连接错误')
        setError('网络连接问题，请检查网络后重试')
      } else {
        console.log('🔍 未知错误类型，显示原始错误信息')
        setError(`注册失败：${error.message || '未知错误'}。建议使用体验模式`)
      }
      
      // 为所有错误提供体验模式建议
      console.log('💡 提示：如果注册持续失败，可以点击"体验模式"按钮直接使用应用')
    } finally {
      setLoading(false)
    }
  }

  // 跳过注册直接体验应用
  const handleSkipAuth = () => {
    console.log('🚀 体验模式按钮被点击')
    console.log('当前路径:', window.location.pathname)
    console.log('准备导航到首页...')
    
    // 设置体验模式标记
    localStorage.setItem('experience_mode', 'true')
    console.log('✅ 体验模式标记已设置')
    
    // 添加视觉反馈
    setError('')
    setSuccess('正在进入体验模式...')
    
    try {
      navigate('/')
      console.log('✅ 导航命令已执行')
    } catch (error) {
      console.error('❌ 导航失败:', error)
      setError('导航失败，请刷新页面重试')
      setSuccess('')
    }
  }

  // 本地存储注册（备用方案）
  const handleLocalAuth = async () => {
    console.log('🔄 尝试本地存储注册...')
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isLogin) {
        // 本地登录
        const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}')
        const user = localUsers[email]
        
        if (!user || user.password !== password) {
          throw new Error('邮箱或密码错误')
        }
        
        localStorage.setItem('current_user', JSON.stringify({
          id: user.id,
          email: user.email,
          username: user.username,
          loginType: 'local'
        }))
        
        setSuccess('登录成功！正在跳转...')
        setTimeout(() => navigate('/'), 1000)
      } else {
        // 本地注册
        const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}')
        
        if (localUsers[email]) {
          throw new Error('该邮箱已被注册')
        }
        
        const userId = 'local_' + Date.now()
        const newUser = {
          id: userId,
          email,
          password,
          username: name || email.split('@')[0],
          createdAt: new Date().toISOString()
        }
        
        localUsers[email] = newUser
        localStorage.setItem('local_users', JSON.stringify(localUsers))
        localStorage.setItem('current_user', JSON.stringify({
          id: userId,
          email,
          username: newUser.username,
          loginType: 'local'
        }))
        
        console.log('✅ 本地注册成功:', newUser)
        setSuccess('注册成功！正在跳转...')
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (error: any) {
      console.error('❌ 本地认证失败:', error)
      setError(error.message || '本地认证失败')
    } finally {
      setLoading(false)
    }
  }

  // 重发确认邮件功能已移除，简化注册流程

  // 移除了createUserProfile函数 - 简化注册流程

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo区域 */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">心情日记</h1>
          <p className="text-gray-600">记录每一刻的美好心情</p>
        </div>

        {/* 数据库问题说明 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-red-500 mt-1 text-lg">⚠️</div>
            <div>
              <p className="text-sm text-red-700 font-semibold mb-2">
                检测到数据库配置问题
              </p>
              <ul className="text-xs text-red-600 space-y-1 mb-3">
                <li>• Supabase 环境变量未配置</li>
                <li>• 数据库连接权限问题</li>
                <li>• 用户注册功能暂时不可用</li>
              </ul>
              <p className="text-xs text-red-600 font-medium">
                👇 推荐使用体验模式，享受完整功能！
              </p>
            </div>
          </div>
        </div>

        {/* 体验模式按钮 - 更突出的设计 */}
        <div className="mb-6">
          <button
            onClick={handleSkipAuth}
            className="w-full bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:via-green-700 hover:to-emerald-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <span className="text-xl">🚀</span>
            <span className="text-base">立即开始体验</span>
          </button>
          
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 text-center font-medium mb-1">
              ✨ 完整功能体验，无需注册
            </p>
            <div className="flex justify-center space-x-4 text-xs text-green-600">
              <span>💾 本地存储</span>
              <span>🔒 隐私安全</span>
              <span>📤 数据导出</span>
            </div>
          </div>
        </div>

        {/* 分割线 */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-500">或尝试账号注册</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* 表单区域 */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="邮箱地址"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
              <div className="font-medium mb-1">❌ {error}</div>
              <div className="text-xs text-red-500">
                建议点击上方"立即开始体验"按钮直接使用应用
              </div>
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-lg border border-green-200">
              ✅ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
          </button>
          
          {/* 备用本地注册按钮 */}
          <button
            type="button"
            onClick={handleLocalAuth}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : `本地${isLogin ? '登录' : '注册'}（备用方案）`}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setSuccess('')
            }}
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            {isLogin ? '没有账号？立即注册' : '已有账号？立即登录'}
          </button>
        </div>

        {/* 问题说明 */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            <strong>遇到注册问题？</strong><br/>
            这通常是因为 Supabase 数据库配置问题。<br/>
            使用体验模式可以立即享受完整功能，<br/>
            数据安全保存在您的设备上。
          </p>
        </div>
      </div>
    </div>
  )
}

export default Auth