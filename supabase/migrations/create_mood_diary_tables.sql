-- 心情日记应用数据库表结构
-- 创建心情记录表
CREATE TABLE mood_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('happy', 'sad', 'angry', 'anxious', 'calm', 'excited', 'tired', 'confused')),
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_mood_records_user_id ON mood_records(user_id);
CREATE INDEX idx_mood_records_created_at ON mood_records(created_at DESC);
CREATE INDEX idx_mood_records_mood_type ON mood_records(mood_type);

-- 启用 RLS
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户只能查看自己的心情记录" ON mood_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户只能创建自己的心情记录" ON mood_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户只能更新自己的心情记录" ON mood_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户只能删除自己的心情记录" ON mood_records
  FOR DELETE USING (auth.uid() = user_id);

-- 创建用户标签表
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tag_name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#FF6B35',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tag_name)
);

-- 创建索引
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);

-- 启用 RLS
ALTER TABLE user_tags ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户只能管理自己的标签" ON user_tags
  FOR ALL USING (auth.uid() = user_id);

-- 创建记录标签关联表
CREATE TABLE record_tags (
  record_id UUID REFERENCES mood_records(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES user_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (record_id, tag_id)
);

-- 启用 RLS
ALTER TABLE record_tags ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户只能管理自己记录的标签" ON record_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mood_records 
      WHERE mood_records.id = record_tags.record_id 
      AND mood_records.user_id = auth.uid()
    )
  );

-- 更新用户资料表结构（添加心情日记相关字段）
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Shanghai';

-- 创建默认标签函数
CREATE OR REPLACE FUNCTION create_default_tags()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_tags (user_id, tag_name, color) VALUES
    (NEW.id, '工作', '#FF6B35'),
    (NEW.id, '生活', '#4A90E2'),
    (NEW.id, '运动', '#7ED321'),
    (NEW.id, '学习', '#9013FE'),
    (NEW.id, '社交', '#FF9500');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（为新用户自动创建默认标签）
DROP TRIGGER IF EXISTS create_user_default_tags ON user_profiles;
CREATE TRIGGER create_user_default_tags
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tags();

-- 授权给anon和authenticated角色
GRANT SELECT ON mood_records TO anon;
GRANT ALL PRIVILEGES ON mood_records TO authenticated;

GRANT SELECT ON user_tags TO anon;
GRANT ALL PRIVILEGES ON user_tags TO authenticated;

GRANT SELECT ON record_tags TO anon;
GRANT ALL PRIVILEGES ON record_tags TO authenticated;

GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;