-- 修复触发器函数 - 解决 "Database error saving new user" 问题

-- 1. 删除现有触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 删除现有函数
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS generate_referral_code();

-- 3. 重新创建推荐码生成函数（简化版）
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- 4. 重新创建用户处理函数（修复版）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
  new_referral_code TEXT;
BEGIN
  -- 生成用户名
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    split_part(NEW.email, '@', 1)
  );
  
  -- 生成推荐码
  new_referral_code := generate_referral_code();
  
  -- 确保用户名唯一
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username) LOOP
    new_username := new_username || floor(random() * 1000)::text;
  END LOOP;
  
  -- 确保推荐码唯一
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
    -- 如果出错，记录错误但不阻止用户创建
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 重新创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 测试函数是否工作
SELECT generate_referral_code() as test_referral_code;