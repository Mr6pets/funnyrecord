-- 创建用户资料表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "用户只能查看自己的资料" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户可以插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 授权给anon和authenticated角色
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;

-- 创建自动创建用户资料的函数
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器（为新用户自动创建资料）
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();