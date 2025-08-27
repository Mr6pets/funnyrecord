import { create } from 'zustand'
import { supabase, MoodRecord, UserTag, UserProfile } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

interface LocalUser {
  id: string
  email: string
  username: string
  loginType: 'local' | 'supabase'
}

interface AuthState {
  user: User | LocalUser | null
  profile: UserProfile | null
  loading: boolean
  isLocalUser: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  initializeAuth: () => Promise<void>
}

interface MoodState {
  records: MoodRecord[]
  tags: UserTag[]
  loading: boolean
  fetchRecords: () => Promise<void>
  fetchTags: () => Promise<void>
  createRecord: (record: Omit<MoodRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>, tagIds?: string[]) => Promise<void>
  updateRecord: (id: string, updates: Partial<MoodRecord>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  createTag: (tag: Omit<UserTag, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  updateTag: (id: string, updates: Partial<UserTag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

// 认证状态管理
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  isLocalUser: false,

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      
      set({ user: data.user })
      await get().fetchProfile()
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error

      if (data.user) {
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            name: name || '心情记录者',
            username: email.split('@')[0]
          })
        
        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
        
        set({ user: data.user })
        await get().fetchProfile()
      }
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      const { isLocalUser } = get()
      
      if (isLocalUser) {
        // 本地用户登出
        localStorage.removeItem('current_user')
        localStorage.removeItem('local_profile')
        console.log('🚪 本地用户已登出')
      } else {
        // Supabase用户登出
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        console.log('🚪 Supabase用户已登出')
      }
      
      // 清除体验模式
      localStorage.removeItem('experience_mode')
      
      set({ user: null, profile: null, isLocalUser: false })
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      set({ profile: data })
    } catch (error) {
      console.error('Fetch profile error:', error)
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { user, isLocalUser } = get()
    if (!user) return

    if (isLocalUser) {
      // 本地用户更新资料到localStorage
      const localProfile = JSON.parse(localStorage.getItem('local_profile') || '{}')
      const updatedProfile = { ...localProfile, ...updates, id: user.id }
      localStorage.setItem('local_profile', JSON.stringify(updatedProfile))
      set({ profile: updatedProfile })
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      
      if (error) throw error
      
      set({ profile: data })
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  },

  initializeAuth: async () => {
    set({ loading: true })
    try {
      // 首先检查本地用户
      const localUser = localStorage.getItem('current_user')
      if (localUser) {
        const user = JSON.parse(localUser)
        console.log('🔍 检测到本地用户:', user)
        set({ user, isLocalUser: true })
        
        // 加载本地用户资料
        const localProfile = localStorage.getItem('local_profile')
        if (localProfile) {
          set({ profile: JSON.parse(localProfile) })
        } else {
          // 创建默认本地资料
          const defaultProfile = {
            id: user.id,
            username: user.username,
            name: user.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          localStorage.setItem('local_profile', JSON.stringify(defaultProfile))
          set({ profile: defaultProfile })
        }
        return
      }
      
      // 检查体验模式
      const experienceMode = localStorage.getItem('experience_mode')
      if (experienceMode === 'true') {
        console.log('🚀 体验模式激活')
        return
      }
      
      // 检查Supabase用户
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('🔍 检测到Supabase用户:', user)
        set({ user, isLocalUser: false })
        await get().fetchProfile()
      }
    } catch (error) {
      console.error('Initialize auth error:', error)
    } finally {
      set({ loading: false })
    }
  }
}))

// 心情数据状态管理
export const useMoodStore = create<MoodState>((set, get) => ({
  records: [],
  tags: [],
  loading: false,

  fetchRecords: async () => {
    set({ loading: true })
    try {
      console.log('📖 开始获取心情记录...')
      
      // 检查用户状态
      const experienceMode = localStorage.getItem('experience_mode')
      const localUser = localStorage.getItem('current_user')
      
      if (experienceMode === 'true' || localUser) {
        // 体验模式或本地用户 - 从本地存储读取
        console.log('📱 从本地存储读取记录')
        
        const localRecords = JSON.parse(localStorage.getItem('local_mood_records') || '[]')
        const localRecordTags = JSON.parse(localStorage.getItem('local_record_tags') || '[]')
        const localTags = JSON.parse(localStorage.getItem('local_user_tags') || '[]')
        
        // 为记录添加标签信息
        const recordsWithTags = localRecords.map(record => {
          const recordTagRelations = localRecordTags.filter(rt => rt.record_id === record.id)
          const recordTags = recordTagRelations.map(rt => {
            const tag = localTags.find(t => t.id === rt.tag_id)
            return {
              tag_id: rt.tag_id,
              user_tags: tag ? {
                id: tag.id,
                tag_name: tag.tag_name,
                color: tag.color
              } : null
            }
          }).filter(rt => rt.user_tags !== null)
          
          return {
            ...record,
            record_tags: recordTags
          }
        })
        
        // 按创建时间排序（最新的在前）
        recordsWithTags.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        set({ records: recordsWithTags })
        console.log('✅ 本地记录读取成功！', recordsWithTags.length, '条记录')
        return
      }
      
      // Supabase用户 - 从数据库读取
      console.log('🗄️ 从Supabase数据库读取记录')
      const { data, error } = await supabase
        .from('mood_records')
        .select(`
          *,
          record_tags (
            tag_id,
            user_tags (
              id,
              tag_name,
              color
            )
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      set({ records: data || [] })
      console.log('✅ Supabase记录读取成功！', (data || []).length, '条记录')
    } catch (error) {
      console.error('❌ Fetch records error:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchTags: async () => {
    try {
      console.log('🏷️ 开始获取用户标签...')
      
      // 检查用户状态
      const experienceMode = localStorage.getItem('experience_mode')
      const localUser = localStorage.getItem('current_user')
      
      if (experienceMode === 'true' || localUser) {
        // 体验模式或本地用户 - 从本地存储读取
        console.log('📱 从本地存储读取标签')
        
        let localTags = JSON.parse(localStorage.getItem('local_user_tags') || '[]')
        
        // 如果没有本地标签，创建默认标签
        if (localTags.length === 0) {
          console.log('🆕 创建默认标签')
          const userId = localUser ? JSON.parse(localUser).id : 'experience_user'
          const defaultTags = [
            { id: 'local_tag_1', user_id: userId, tag_name: '工作', color: '#FF6B35', created_at: new Date().toISOString() },
            { id: 'local_tag_2', user_id: userId, tag_name: '生活', color: '#4A90E2', created_at: new Date().toISOString() },
            { id: 'local_tag_3', user_id: userId, tag_name: '运动', color: '#7ED321', created_at: new Date().toISOString() },
            { id: 'local_tag_4', user_id: userId, tag_name: '学习', color: '#9013FE', created_at: new Date().toISOString() },
            { id: 'local_tag_5', user_id: userId, tag_name: '社交', color: '#FF9500', created_at: new Date().toISOString() }
          ]
          localStorage.setItem('local_user_tags', JSON.stringify(defaultTags))
          localTags = defaultTags
        }
        
        set({ tags: localTags })
        console.log('✅ 本地标签读取成功！', localTags.length, '个标签')
        return
      }
      
      // Supabase用户 - 从数据库读取
      console.log('🗄️ 从Supabase数据库读取标签')
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      set({ tags: data || [] })
      console.log('✅ Supabase标签读取成功！', (data || []).length, '个标签')
    } catch (error) {
      console.error('❌ Fetch tags error:', error)
    }
  },

  createRecord: async (record, tagIds?: string[]) => {
    try {
      console.log('🚀 开始保存心情记录...', { record, tagIds })
      
      // 检查用户状态
      const experienceMode = localStorage.getItem('experience_mode')
      const localUser = localStorage.getItem('current_user')
      
      if (experienceMode === 'true' || localUser) {
        // 体验模式或本地用户 - 使用本地存储
        console.log('📱 使用本地存储保存记录')
        
        const recordId = 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        const userId = localUser ? JSON.parse(localUser).id : 'experience_user'
        
        const newRecord = {
          id: recordId,
          user_id: userId,
          ...record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 保存到本地存储
        const existingRecords = JSON.parse(localStorage.getItem('local_mood_records') || '[]')
        existingRecords.unshift(newRecord)
        localStorage.setItem('local_mood_records', JSON.stringify(existingRecords))
        
        // 保存标签关联（如果有）
        if (tagIds && tagIds.length > 0) {
          const existingRecordTags = JSON.parse(localStorage.getItem('local_record_tags') || '[]')
          const newRecordTags = tagIds.map(tagId => ({
            record_id: recordId,
            tag_id: tagId
          }))
          existingRecordTags.push(...newRecordTags)
          localStorage.setItem('local_record_tags', JSON.stringify(existingRecordTags))
        }
        
        // 更新本地状态
        const currentRecords = get().records
        set({ records: [newRecord, ...currentRecords] })
        
        console.log('✅ 本地记录保存成功！')
        return
      }
      
      // Supabase用户 - 使用数据库
      console.log('🗄️ 使用Supabase数据库保存记录')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('mood_records')
        .insert({
          ...record,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      // 如果有标签，创建标签关联
      if (tagIds && tagIds.length > 0) {
        const recordTags = tagIds.map(tagId => ({
          record_id: data.id,
          tag_id: tagId
        }))
        
        const { error: tagError } = await supabase
          .from('record_tags')
          .insert(recordTags)
        
        if (tagError) {
          console.error('Tag association error:', tagError)
          // 不抛出错误，因为记录已经创建成功
        }
      }
      
      // 刷新记录列表
      await get().fetchRecords()
      console.log('✅ Supabase记录保存成功！')
    } catch (error) {
      console.error('❌ Create record error:', error)
      throw error
    }
  },

  updateRecord: async (id: string, updates) => {
    try {
      const { data, error } = await supabase
        .from('mood_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // 更新本地状态
      set(state => ({
        records: state.records.map(record => 
          record.id === id ? { ...record, ...data } : record
        )
      }))
    } catch (error) {
      console.error('Update record error:', error)
      throw error
    }
  },

  deleteRecord: async (id: string) => {
    try {
      const { error } = await supabase
        .from('mood_records')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // 更新本地状态
      set(state => ({
        records: state.records.filter(record => record.id !== id)
      }))
    } catch (error) {
      console.error('Delete record error:', error)
      throw error
    }
  },

  createTag: async (tag) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          ...tag,
          user_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      // 更新本地状态
      set(state => ({
        tags: [...state.tags, data]
      }))
    } catch (error) {
      console.error('Create tag error:', error)
      throw error
    }
  },

  updateTag: async (id: string, updates) => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      // 更新本地状态
      set(state => ({
        tags: state.tags.map(tag => 
          tag.id === id ? { ...tag, ...data } : tag
        )
      }))
    } catch (error) {
      console.error('Update tag error:', error)
      throw error
    }
  },

  deleteTag: async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // 更新本地状态
      set(state => ({
        tags: state.tags.filter(tag => tag.id !== id)
      }))
    } catch (error) {
      console.error('Delete tag error:', error)
      throw error
    }
  }
}))