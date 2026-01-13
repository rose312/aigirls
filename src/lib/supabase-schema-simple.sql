-- AI美女伴侣平台 - 简化数据库Schema
-- 在Supabase SQL编辑器中运行

-- 1. 用户档案表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  avatar_url TEXT,
  language VARCHAR(2) DEFAULT 'zh',
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 订阅表
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

-- 3. AI伴侣表
CREATE TABLE IF NOT EXISTS public.companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  companion_type VARCHAR(50) NOT NULL,
  appearance_config JSONB NOT NULL DEFAULT '{}',
  personality_config JSONB NOT NULL DEFAULT '{}',
  background TEXT,
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  intimacy_level INTEGER DEFAULT 1,
  intimacy_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 对话记录表
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 用户消息配额表
CREATE TABLE IF NOT EXISTS public.daily_message_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 6. 支付订单表
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  external_order_id VARCHAR(255),
  external_transaction_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 启用行级安全策略
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_message_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscription" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own companions" ON public.companions
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own companions" ON public.companions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quota" ON public.daily_message_quotas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quota" ON public.daily_message_quotas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON public.payment_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_companions_user_id ON public.companions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_companion_id ON public.chat_messages(companion_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_quotas_user_date ON public.daily_message_quotas(user_id, date);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_external_id ON public.payment_orders(external_order_id);

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