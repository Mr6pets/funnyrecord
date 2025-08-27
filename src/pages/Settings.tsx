import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Bell, 
  Download, 
  Trash2, 
  LogOut, 
  ChevronRight,
  Moon,
  Sun,
  Globe,
  Shield
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, useMoodStore } from '../store'
import { useNotifications } from '../hooks/useNotifications'
import { useTheme } from '../hooks/useTheme'
import EditProfileModal from '../components/EditProfileModal'
import PrivacyPolicyModal from '../components/PrivacyPolicyModal'
import { toast } from 'sonner'

const Settings = () => {
  const navigate = useNavigate()
  const { user, profile, signOut, isLocalUser } = useAuthStore()
  const { records } = useMoodStore()
  const { permission, requestPermission, sendMoodReminder } = useNotifications()
  const { theme, isDark, toggleTheme, getThemeLabel } = useTheme()
  const [notifications, setNotifications] = useState(() => {
    return localStorage.getItem('notifications_enabled') === 'true'
  })
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'zh-CN'
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  // 处理通知设置
  const handleNotificationToggle = async () => {
    if (!notifications) {
      // 开启通知时请求权限
      const result = await requestPermission()
      if (result === 'granted') {
        setNotifications(true)
        localStorage.setItem('notifications_enabled', 'true')
        toast.success('通知已开启')
        // 发送测试通知
        setTimeout(() => {
          sendMoodReminder()
        }, 1000)
      } else {
        toast.error('通知权限被拒绝，请在浏览器设置中允许通知')
      }
    } else {
      // 关闭通知
      setNotifications(false)
      localStorage.setItem('notifications_enabled', 'false')
      toast.success('通知已关闭')
    }
  }

  // 处理语言设置
  const handleLanguageToggle = () => {
    const newLanguage = language === 'zh-CN' ? 'en-US' : 'zh-CN'
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
    toast.success(`语言已切换为${newLanguage === 'zh-CN' ? '简体中文' : 'English'}`)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleExportData = () => {
    try {
      let exportRecords = records
      
      // 如果是本地用户或体验模式，从localStorage获取数据
      if (isLocalUser || localStorage.getItem('experience_mode') === 'true') {
        const localRecords = JSON.parse(localStorage.getItem('local_mood_records') || '[]')
        const localTags = JSON.parse(localStorage.getItem('local_user_tags') || '[]')
        exportRecords = localRecords
        
        const exportData = {
          user: {
            id: user?.id || 'local_user',
            email: user?.email || 'local@example.com',
            profile: profile,
            userType: isLocalUser ? 'local' : 'experience'
          },
          records: exportRecords,
          tags: localTags,
          settings: {
            notifications: notifications,
            theme: theme,
            language: language
          },
          exportDate: new Date().toISOString()
        }
        
        const dataStr = JSON.stringify(exportData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `mood-diary-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        URL.revokeObjectURL(url)
        toast.success('数据导出成功！')
        return
      }
      
      // Supabase用户的导出逻辑
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          profile: profile
        },
        records: exportRecords,
        exportDate: new Date().toISOString()
      }
      
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `mood-diary-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      toast.success('数据导出成功！')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败，请重试')
    }
  }

  const handleDeleteAllData = async () => {
    try {
      // 如果是本地用户或体验模式，清理localStorage
      if (isLocalUser || localStorage.getItem('experience_mode') === 'true') {
        localStorage.removeItem('local_mood_records')
        localStorage.removeItem('local_user_tags')
        localStorage.removeItem('local_record_tags')
        
        setShowDeleteConfirm(false)
        toast.success('本地数据清理完成')
        
        // 刷新数据
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        return
      }
      
      // Supabase用户的删除逻辑
      const { error } = await supabase
        .from('mood_records')
        .delete()
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      setShowDeleteConfirm(false)
      toast.success('数据清理完成')
      
      // 刷新数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Delete data error:', error)
      toast.error('删除失败，请重试')
      setShowDeleteConfirm(false)
    }
  }

  const settingSections = [
    {
      title: '个人信息',
      items: [
        {
          icon: User,
          label: '编辑资料',
          value: '',
          action: () => setShowEditProfile(true)
        }
      ]
    },
    {
      title: '应用设置',
      items: [
        {
          icon: Bell,
          label: '提醒通知',
          value: notifications,
          action: handleNotificationToggle,
          type: 'toggle',
          description: permission === 'denied' ? '需要浏览器权限' : ''
        },
        {
          icon: isDark ? Moon : Sun,
          label: '主题模式',
          value: getThemeLabel(),
          action: toggleTheme,
          description: '支持浅色/深色/跟随系统'
        },
        {
          icon: Globe,
          label: '语言设置',
          value: language === 'zh-CN' ? '简体中文' : 'English',
          action: handleLanguageToggle,
          description: '切换应用显示语言'
        }
      ]
    },
    {
      title: '数据管理',
      items: [
        {
          icon: Download,
          label: '导出数据',
          value: '',
          action: handleExportData
        },
        {
          icon: Trash2,
          label: '清理数据',
          value: '',
          action: () => setShowDeleteConfirm(true),
          danger: true
        }
      ]
    },
    {
      title: '其他',
      items: [
        {
          icon: Shield,
          label: '隐私政策',
          value: '',
          action: () => setShowPrivacyPolicy(true)
        },
        {
          icon: LogOut,
          label: '退出登录',
          value: '',
          action: handleLogout,
          danger: true
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-lg font-semibold text-gray-800">设置</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* 用户信息卡片 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">
                {profile?.name || '心情记录者'}
              </h2>
              <p className="text-gray-500 text-sm">
                {user?.email}
              </p>
              <p className="text-gray-500 text-sm">
                已记录 {records.length} 条心情
              </p>
            </div>
          </div>
        </div>

        {/* 设置选项 */}
        {settingSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-600">{section.title}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.action}
                  className={`group w-full px-5 py-4 flex items-start justify-between hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 ${
                    item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                      item.danger 
                        ? 'bg-red-50 text-red-500 group-hover:bg-red-100 group-hover:shadow-sm' 
                        : 'bg-gray-50 text-gray-500 group-hover:bg-gray-100 group-hover:shadow-sm'
                    } transition-all duration-200`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`font-semibold text-base leading-tight mb-0.5 text-left ${
                        item.danger ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 leading-relaxed text-left">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 flex-shrink-0 ml-4 pt-1">
                    {item.type === 'toggle' ? (
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 shadow-inner mt-1 ${
                        item.value 
                          ? 'bg-orange-500 shadow-orange-200' 
                          : 'bg-gray-200 shadow-gray-100'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ${
                          item.value ? 'translate-x-6 shadow-orange-300' : 'translate-x-1'
                        }`} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.value && (
                          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                            {item.value}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* 版本信息 */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">心情日记 v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">让每一天都充满美好回忆</p>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">此操作将永久删除所有心情记录，无法恢复。确定要继续吗？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAllData}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑资料模态框 */}
      <EditProfileModal 
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      />

      {/* 隐私政策模态框 */}
      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </div>
  )
}

export default Settings