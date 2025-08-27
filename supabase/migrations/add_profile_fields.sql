-- 为user_profiles表添加新字段
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', ''));

-- 添加注释
COMMENT ON COLUMN user_profiles.bio IS '个人简介';
COMMENT ON COLUMN user_profiles.birthday IS '生日';
COMMENT ON COLUMN user_profiles.gender IS '性别：male, female, other 或空';