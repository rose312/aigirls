// 数据库设置脚本
import { createSupabaseServerClient } from './supabase-types'

export async function setupDatabase() {
  const supabase = createSupabaseServerClient()
  
  console.log('🚀 开始设置数据库...')
  
  try {
    // 检查数据库连接
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ 数据库连接失败，需要运行SQL schema')
      console.log('请在Supabase控制台的SQL编辑器中运行 src/lib/supabase-schema.sql')
      return false
    }
    
    console.log('✅ 数据库连接成功')
    return true
  } catch (error) {
    console.error('❌ 数据库设置失败:', error)
    return false
  }
}

// 如果直接运行此文件
if (require.main === module) {
  setupDatabase().then(success => {
    process.exit(success ? 0 : 1)
  })
}