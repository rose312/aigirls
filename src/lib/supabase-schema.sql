-- AI美女伴侣平台数据库Schema
-- Run in Supabase SQL editor

-- 用户档案表 (扩展auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  username_lower VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  language VARCHAR(2) DEFAULT 'zh',
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 订阅表
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL DEFAULT 'free',
  plan VARCHAR(20),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  daily_message_limit INTEGER DEFAULT 20,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI伴侣表
CREATE TABLE IF NOT EXISTS public.companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  companion_type VARCHAR(50) NOT NULL, -- 'neighbor', 'office', 'student', 'custom'
  appearance_config JSONB NOT NULL,
  personality_config JSONB NOT NULL,
  background TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  intimacy_level INTEGER DEFAULT 1,
  intimacy_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 对话记录表
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'user' or 'companion'
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'image'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户消息配额表
CREATE TABLE IF NOT EXISTS public.daily_message_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 推荐记录表
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id),
  referred_id UUID REFERENCES auth.users(id),
  reward_type VARCHAR(50),
  reward_value INTEGER,
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 支付订单表
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'cancelled'
  external_order_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_message_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 用户档案安全策略
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 订阅安全策略
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 伴侣安全策略
CREATE POLICY "Users can view own companions" ON public.companions
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own companions" ON public.companions
  FOR ALL USING (auth.uid() = user_id);

-- 对话记录安全策略
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 消息配额安全策略
CREATE POLICY "Users can view own quota" ON public.daily_message_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quota" ON public.daily_message_quotas
  FOR ALL USING (auth.uid() = user_id);

-- 推荐记录安全策略
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 支付订单安全策略
CREATE POLICY "Users can view own orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_companions_user_id ON public.companions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_companion_id ON public.chat_messages(companion_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_date ON public.daily_message_quotas(user_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);

-- 创建函数：生成推荐码
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：自动创建用户档案
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    generate_referral_code()
  );
  
  -- 创建免费订阅
  INSERT INTO public.subscriptions (user_id, type, daily_message_limit)
  VALUES (NEW.id, 'free', 20);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 创建函数：更新亲密度
CREATE OR REPLACE FUNCTION update_intimacy_points(
  p_user_id UUID,
  p_companion_id UUID,
  p_points INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  new_points INTEGER;
  new_level INTEGER;
BEGIN
  UPDATE public.companions 
  SET 
    intimacy_points = intimacy_points + p_points,
    updated_at = NOW()
  WHERE id = p_companion_id AND user_id = p_user_id
  RETURNING intimacy_points INTO new_points;
  
  -- 计算新等级 (每100点升一级)
  new_level := GREATEST(1, (new_points / 100) + 1);
  
  UPDATE public.companions 
  SET intimacy_level = new_level
  WHERE id = p_companion_id AND user_id = p_user_id;
  
  RETURN new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：检查消息配额
CREATE OR REPLACE FUNCTION check_message_quota(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_subscription RECORD;
  today_count INTEGER;
BEGIN
  -- 获取用户订阅信息
  SELECT * INTO user_subscription 
  FROM public.subscriptions 
  WHERE user_id = p_user_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- 付费用户无限制
  IF user_subscription.type = 'premium' AND 
     user_subscription.end_date > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- 检查今日消息数量
  SELECT COALESCE(message_count, 0) INTO today_count
  FROM public.daily_message_quotas
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
  
  -- 免费用户检查限制
  RETURN today_count < user_subscription.daily_message_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
