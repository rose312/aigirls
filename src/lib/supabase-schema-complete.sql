-- 补充缺失的表和修复

-- 1. 创建 images 表（七牛云图片存储）- 完整版本
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  qiniu_key VARCHAR(500) NOT NULL,
  qiniu_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  tags TEXT[],
  -- 前端需要的额外字段
  prompt TEXT,
  style_id VARCHAR(100),
  style_label VARCHAR(100),
  size VARCHAR(20),
  quality VARCHAR(20),
  model VARCHAR(100),
  provider VARCHAR(50),
  tag_keys TEXT[],
  image_key VARCHAR(500), -- 兼容字段，与 qiniu_key 相同
  favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 启用 images 表的 RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- 3. 创建 images 表的安全策略
CREATE POLICY "Users can view own images" ON public.images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own images" ON public.images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images" ON public.images
  FOR DELETE USING (auth.uid() = user_id);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_qiniu_key ON public.images(qiniu_key);
CREATE INDEX IF NOT EXISTS idx_images_image_key ON public.images(image_key);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_favorite ON public.images(favorite);
CREATE INDEX IF NOT EXISTS idx_images_provider ON public.images(provider);

-- 5. 修复用户档案触发器 - 确保用户名唯一性
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  new_referral_code TEXT;
  username_suffix INTEGER := 0;
BEGIN
  -- 生成基础用户名
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1)
  );
  
  -- 确保用户名唯一（添加数字后缀）
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    username_suffix := username_suffix + 1;
    new_username := COALESCE(
      NEW.raw_user_meta_data->>'username', 
      split_part(NEW.email, '@', 1)
    ) || username_suffix::text;
  END LOOP;
  
  -- 生成唯一推荐码
  new_referral_code := generate_referral_code();
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_referral_code) LOOP
    new_referral_code := generate_referral_code();
  END LOOP;
  
  -- 插入用户档案
  INSERT INTO public.profiles (id, username, referral_code, language)
  VALUES (
    NEW.id,
    new_username,
    new_referral_code,
    'zh'
  );
  
  -- 创建免费订阅
  INSERT INTO public.subscriptions (user_id, type, daily_message_limit, features)
  VALUES (
    NEW.id, 
    'free', 
    20, 
    '["basic_chat"]'::jsonb
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. 创建系统日志表
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. 创建索引
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE OR REPLACE FUNCTION sync_image_keys()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 qiniu_key 有值但 image_key 没有，则同步
  IF NEW.qiniu_key IS NOT NULL AND NEW.image_key IS NULL THEN
    NEW.image_key := NEW.qiniu_key;
  END IF;
  
  -- 如果 image_key 有值但 qiniu_key 没有，则同步
  IF NEW.image_key IS NOT NULL AND NEW.qiniu_key IS NULL THEN
    NEW.qiniu_key := NEW.image_key;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS sync_image_keys_trigger ON public.images;
CREATE TRIGGER sync_image_keys_trigger
  BEFORE INSERT OR UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION sync_image_keys();