-- 检查mood_records表的权限和RLS策略
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'mood_records'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'mood_records';

-- 如果没有权限，添加权限
GRANT ALL PRIVILEGES ON mood_records TO authenticated;
GRANT SELECT ON mood_records TO anon;