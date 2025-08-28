import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据类型定义
export interface MoodRecord {
  id: string
  user_id: string
  mood_type: 'happy' | 'sad' | 'angry' | 'anxious' | 'calm' | 'excited' | 'tired' | 'confused' | 'grateful' | 'proud' | 'nervous' | 'hopeful' | 'lonely' | 'surprised' | 'loving' | 'frustrated'
  intensity: number
  note?: string
  created_at: string
  updated_at: string
}

export interface UserTag {
  id: string
  user_id: string
  tag_name: string
  color: string
  created_at: string
}

export interface RecordTag {
  record_id: string
  tag_id: string
}

export interface UserProfile {
  id: string
  username?: string
  name?: string
  avatar_url?: string
  timezone?: string
  bio?: string
  birthday?: string
  gender?: 'male' | 'female' | 'other' | ''
  created_at: string
  updated_at: string
}