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
    } catch (error) {
      console.error('Fetch records error:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchTags: async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      set({ tags: data || [] })
    } catch (error) {
      console.error('Fetch tags error:', error)
    }
  },

  createRecord: async (record, tagIds?: string[]) => {
    try {
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
    } catch (error) {
      console.error('Create record error:', error)
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