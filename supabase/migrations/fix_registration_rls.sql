-- 修复用户注册相关的RLS策略问题
-- 确保新用户注册时不会被RLS策略阻止

-- 临时禁用user_profiles表的RLS以允许注册
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 删除可能阻止注册的策略
DROP POLICY IF EXISTS "用户只能查看自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的资料" ON user_profiles;
DROP POLICY IF EXISTS "用户可以插入自己的资料" ON user_profiles;

-- 创建更宽松的策略以支持注册
-- 允许认证用户查看自己的资料
CREATE POLICY "authenticated_users_select_own" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 允许认证用户插入自己的资料（注册时）
CREATE POLICY "authenticated_users_insert_own" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- 允许认证用户更新自己的资料
CREATE POLICY "authenticated_users_update_own" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 允许匿名用户插入资料（支持注册流程）
CREATE POLICY "anon_users_insert" ON user_profiles
  FOR INSERT TO anon
  WITH CHECK (true);

-- 重新启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 确保权限正确设置
GRANT SELECT, INSERT ON user_profiles TO anon;
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;

-- 检查其他表的RLS策略
-- 确保mood_records表允许新用户创建记录
DROP POLICY IF EXISTS "用户只能查看自己的心情记录" ON mood_records;
DROP POLICY IF EXISTS "用户只能创建自己的心情记录" ON mood_records;
DROP POLICY IF EXISTS "用户只能更新自己的心情记录" ON mood_records;
DROP POLICY IF EXISTS "用户只能删除自己的心情记录" ON mood_records;

CREATE POLICY "users_select_own_records" ON mood_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_records" ON mood_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_records" ON mood_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_records" ON mood_records
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 确保user_tags表的策略正确
DROP POLICY IF EXISTS "用户只能查看自己的标签" ON user_tags;
DROP POLICY IF EXISTS "用户只能创建自己的标签" ON user_tags;
DROP POLICY IF EXISTS "用户只能更新自己的标签" ON user_tags;
DROP POLICY IF EXISTS "用户只能删除自己的标签" ON user_tags;

CREATE POLICY "users_select_own_tags" ON user_tags
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_tags" ON user_tags
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_tags" ON user_tags
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_tags" ON user_tags
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 确保record_tags表的策略正确
DROP POLICY IF EXISTS "用户只能查看自己记录的标签" ON record_tags;
DROP POLICY IF EXISTS "用户只能为自己的记录添加标签" ON record_tags;
DROP POLICY IF EXISTS "用户只能删除自己记录的标签" ON record_tags;

CREATE POLICY "users_select_own_record_tags" ON record_tags
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mood_records 
      WHERE mood_records.id = record_tags.record_id 
      AND mood_records.user_id = auth.uid()
    )
  );

CREATE POLICY "users_insert_own_record_tags" ON record_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM mood_records 
      WHERE mood_records.id = record_tags.record_id 
      AND mood_records.user_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_own_record_tags" ON record_tags
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM mood_records 
      WHERE mood_records.id = record_tags.record_id 
      AND mood_records.user_id = auth.uid()
    )
  );

-- 最终权限检查
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 检查表权限
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;