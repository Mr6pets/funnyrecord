-- 为record_tags表添加权限
GRANT ALL PRIVILEGES ON record_tags TO authenticated;
GRANT SELECT ON record_tags TO anon;

-- 检查权限是否正确设置
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'record_tags'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;