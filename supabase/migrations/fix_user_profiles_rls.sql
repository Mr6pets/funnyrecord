-- 修复用户资料表的RLS策略
-- 确保新用户可以创建自己的资料

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以插入自己的资料" ON user_profiles;

-- 创建新的RLS策略
-- 允许用户查看自己的资料
CREATE POLICY "用户只能查看自己的资料" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 允许用户更新自己的资料
CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许新用户插入自己的资料
CREATE POLICY "用户可以插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 确保RLS已启用
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 确保anon和authenticated角色有正确的权限
GRANT SELECT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;

-- 检查当前权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;