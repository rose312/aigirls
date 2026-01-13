-- 配额管理相关的数据库函数

-- 增加消息计数的函数
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id UUID, p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO public.daily_message_quotas (user_id, date, message_count, last_reset_at)
  VALUES (p_user_id, p_date, 1, NOW())
  ON CONFLICT (user_id, date)
  DO UPDATE SET 
    message_count = daily_message_quotas.message_count + 1,
    last_reset_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 获取用户剩余配额的函数
CREATE OR REPLACE FUNCTION get_remaining_quota(p_user_id UUID)
RETURNS TABLE(
  remaining_messages INTEGER,
  daily_limit INTEGER,
  is_unlimited BOOLEAN,
  subscription_type TEXT
) AS $$
DECLARE
  v_subscription_type TEXT;
  v_daily_limit INTEGER;
  v_message_count INTEGER;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;
  
  -- 获取用户订阅信息
  SELECT s.type, s.daily_message_limit
  INTO v_subscription_type, v_daily_limit
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id;
  
  -- 如果没有订阅记录，使用默认值
  IF v_subscription_type IS NULL THEN
    v_subscription_type := 'free';
    v_daily_limit := 20;
  END IF;
  
  -- 获取今日消息数量
  SELECT COALESCE(dmq.message_count, 0)
  INTO v_message_count
  FROM public.daily_message_quotas dmq
  WHERE dmq.user_id = p_user_id AND dmq.date = v_today;
  
  -- 返回结果
  RETURN QUERY SELECT
    CASE 
      WHEN v_subscription_type = 'premium' THEN -1
      ELSE GREATEST(0, v_daily_limit - COALESCE(v_message_count, 0))
    END as remaining_messages,
    v_daily_limit as daily_limit,
    (v_subscription_type = 'premium') as is_unlimited,
    v_subscription_type as subscription_type;
END;
$$ LANGUAGE plpgsql;

-- 检查用户是否可以发送消息
CREATE OR REPLACE FUNCTION can_send_message(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
  v_is_unlimited BOOLEAN;
BEGIN
  SELECT remaining_messages, is_unlimited
  INTO v_remaining, v_is_unlimited
  FROM get_remaining_quota(p_user_id);
  
  RETURN v_is_unlimited OR v_remaining > 0;
END;
$$ LANGUAGE plpgsql;

-- 重置所有用户的每日配额（定时任务用）
CREATE OR REPLACE FUNCTION reset_daily_quotas()
RETURNS void AS $$
BEGIN
  -- 删除昨天之前的配额记录
  DELETE FROM public.daily_message_quotas 
  WHERE date < CURRENT_DATE;
  
  -- 可以添加日志记录
  INSERT INTO public.system_logs (event_type, message, created_at)
  VALUES ('quota_reset', 'Daily quotas reset completed', NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;