// 测试数据库连接和设置
import { checkDatabaseSetup } from './database-setup'
import { getSupabase } from './supabase'

export async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...')
  
  try {
    // 检查基础连接
    const isSetup = await checkDatabaseSetup()
    if (!isSetup) {
      throw new Error('数据库设置检查失败')
    }
    
    // 测试具体表查询
    const supabase = getSupabase()
    
    // 测试profiles表
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ profiles表查询失败:', profilesError)
      return false
    }
    
    // 测试companions表
    const { data: companionsTest, error: companionsError } = await supabase
      .from('companions')
      .select('count')
      .limit(1)
    
    if (companionsError) {
      console.error('❌ companions表查询失败:', companionsError)
      return false
    }
    
    // 测试subscriptions表
    const { data: subscriptionsTest, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1)
    
    if (subscriptionsError) {
      console.error('❌ subscriptions表查询失败:', subscriptionsError)
      return false
    }
    
    console.log('✅ 所有数据库表连接正常')
    console.log('✅ 数据库设置完成！')
    
    return true
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error)
    return false
  }
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('测试执行失败:', error)
      process.exit(1)
    })
}