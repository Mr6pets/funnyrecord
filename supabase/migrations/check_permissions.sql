-- 检查当前权限设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 为anon角色授予基本读取权限
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON mood_records TO anon;
GRANT SELECT ON user_tags TO anon;
GRANT SELECT ON record_tags TO anon;

-- 为authenticated角色授予完整权限
GRANT ALL PRIVILEGES ON user_profiles TO authenticated;
GRANT ALL PRIVILEGES ON mood_records TO authenticated;
GRANT ALL PRIVILEGES ON user_tags TO authenticated;
GRANT ALL PRIVILEGES ON record_tags TO authenticated;

-- 再次检查权限设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;