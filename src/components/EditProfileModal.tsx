import { useState, useEffect } from 'react'
import { X, User, Upload, Calendar, Users, FileText, Save, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store'
import { UserProfile, supabase } from '../lib/supabase'
import Toast from './Toast'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, profile, updateProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    avatar_url: '',
    bio: '',
    birthday: '',
    gender: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [originalUsername, setOriginalUsername] = useState('')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error' | 'warning'
    isVisible: boolean
  }>({ message: '', type: 'success', isVisible: false })

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      const username = profile.username || ''
      setFormData({
        name: profile.name || '',
        username,
        avatar_url: profile.avatar_url || '',
        bio: (profile as any).bio || '',
        birthday: (profile as any).birthday || '',
        gender: (profile as any).gender || ''
      })
      setOriginalUsername(username)
    }
  }, [profile])

  // 检查用户名唯一性
  const checkUsernameUnique = async (username: string) => {
    if (!username || username === originalUsername) {
      return true
    }

    setCheckingUsername(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user?.id || '')
        .single()

      if (error && error.code === 'PGRST116') {
        // 没有找到重复用户名，表示可用
        return true
      }

      if (data) {
        // 找到重复用户名
        return false
      }

      return true
    } catch (error) {
      console.error('Check username error:', error)
      return true // 出错时允许继续
    } finally {
      setCheckingUsername(false)
    }
  }

  // 表单验证
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}

    // 姓名验证
    if (!formData.name.trim()) {
      newErrors.name = '姓名不能为空'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = '姓名长度不能超过50个字符'
    }

    // 用户名验证
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      newErrors.username = '用户名只能包含字母、数字和下划线，长度3-20位'
    } else {
      // 检查用户名唯一性
      const isUnique = await checkUsernameUnique(formData.username)
      if (!isUnique) {
        newErrors.username = '用户名已被使用，请选择其他用户名'
      }
    }

    // 头像URL验证
    if (formData.avatar_url && !isValidUrl(formData.avatar_url)) {
      newErrors.avatar_url = '请输入有效的头像URL'
    }

    // 生日验证
    if (formData.birthday) {
      if (!isValidDate(formData.birthday)) {
        newErrors.birthday = '请输入有效的日期格式'
      } else {
        const birthDate = new Date(formData.birthday)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        
        if (birthDate > today) {
          newErrors.birthday = '生日不能是未来日期'
        } else if (age > 150) {
          newErrors.birthday = '请输入合理的生日日期'
        }
      }
    }

    // 个人简介验证
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = '个人简介不能超过500个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // URL验证
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 日期验证
  const isValidDate = (dateString: string) => {
    const date = new Date(dateString)
    return date instanceof Date && !isNaN(date.getTime())
  }

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // 显示Toast通知
  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type, isVisible: true })
  }

  // 处理头像文件上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar_url: '请选择图片文件' }))
        showToast('请选择图片文件', 'error')
        return
      }

      // 检查文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar_url: '图片大小不能超过5MB' }))
        showToast('图片大小不能超过5MB', 'error')
        return
      }

      // 创建预览URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        handleInputChange('avatar_url', result)
        showToast('头像上传成功', 'success')
      }
      reader.readAsDataURL(file)
    }
  }

  // 保存资料
  const handleSave = async () => {
    const isValid = await validateForm()
    if (!isValid) {
      showToast('请检查表单信息', 'warning')
      return
    }

    setLoading(true)
    try {
      await updateProfile(formData as Partial<UserProfile>)
      showToast('资料更新成功！', 'success')
      // 延迟关闭模态框，让用户看到成功提示
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Update profile error:', error)
      showToast('更新失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">编辑资料</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-6">
          {/* 头像部分 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Avatar" 
                    className="w-20 h-20 object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {/* 头像URL输入 */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                头像URL（可选）
              </label>
              <input
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                placeholder="输入头像图片链接"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.avatar_url ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.avatar_url && (
                <p className="text-red-500 text-sm mt-1">{errors.avatar_url}</p>
              )}
            </div>
          </div>

          {/* 基本信息 */}
          <div className="space-y-4">
            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="输入您的姓名"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名 *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="输入用户名（3-20位字母数字下划线）"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* 生日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                生日
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.birthday ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.birthday && (
                <p className="text-red-500 text-sm mt-1">{errors.birthday}</p>
              )}
            </div>

            {/* 性别 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                性别
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">请选择</option>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>

            {/* 个人简介 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                个人简介
              </label>
              <div className="relative">
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="介绍一下自己吧..."
                  rows={3}
                  maxLength={500}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                    errors.bio ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {formData.bio.length}/500
                </div>
              </div>
              {errors.bio && (
                <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast 通知 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}

export default EditProfileModal