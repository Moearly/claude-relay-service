#!/usr/bin/env node

/**
 * 创建测试用户脚本
 * 用于快速创建测试账号
 */

const mongoose = require('mongoose')
const User = require('../../src/models/User')
const logger = require('../../src/utils/logger')
require('dotenv').config()

async function createTestUser() {
  try {
    // 连接数据库
    logger.info('🔄 连接数据库...')
    await mongoose.connect(process.env.MONGODB_URI)
    logger.success('✅ 数据库连接成功')

    // 测试用户信息
    const testUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123456',
      displayName: '测试用户',
      role: 'user',
      credits: 10000, // 赠送 10000 积分
      isActive: true,
      isEmailVerified: true,
      subscription: {
        planId: 'free',
        planName: '免费版',
        dailyCredits: 1000,
        status: 'active'
      }
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [
        { username: testUserData.username },
        { email: testUserData.email }
      ]
    })

    if (existingUser) {
      logger.warn('⚠️  测试用户已存在')
      console.log('\n' + '='.repeat(60))
      console.log('📋 现有测试用户信息:')
      console.log('='.repeat(60))
      console.log(`用户名:     ${existingUser.username}`)
      console.log(`邮箱:       ${existingUser.email}`)
      console.log(`显示名称:   ${existingUser.displayName}`)
      console.log(`角色:       ${existingUser.role}`)
      console.log(`积分:       ${existingUser.credits}`)
      console.log(`状态:       ${existingUser.isActive ? '激活' : '未激活'}`)
      console.log(`创建时间:   ${existingUser.createdAt}`)
      console.log('='.repeat(60))
      console.log('\n💡 提示: 如需重新创建，请先删除现有用户')
      console.log('   删除命令: node scripts/tools/delete-test-user.js')
      console.log('')
      return
    }

    // 创建新用户
    logger.info('🔄 创建测试用户...')
    const newUser = new User(testUserData)
    
    // 生成邀请码
    newUser.generateInvitationCode()
    
    await newUser.save()

    logger.success('✅ 测试用户创建成功！')

    // 显示用户信息
    console.log('\n' + '='.repeat(60))
    console.log('🎉 测试用户创建成功！')
    console.log('='.repeat(60))
    console.log(`用户名:     ${newUser.username}`)
    console.log(`邮箱:       ${newUser.email}`)
    console.log(`密码:       ${testUserData.password}`)
    console.log(`显示名称:   ${newUser.displayName}`)
    console.log(`角色:       ${newUser.role}`)
    console.log(`积分:       ${newUser.credits}`)
    console.log(`邀请码:     ${newUser.invitationCode}`)
    console.log(`状态:       ${newUser.isActive ? '激活' : '未激活'}`)
    console.log(`邮箱验证:   ${newUser.isEmailVerified ? '已验证' : '未验证'}`)
    console.log(`创建时间:   ${newUser.createdAt}`)
    console.log('='.repeat(60))
    console.log('\n🌐 登录地址:')
    console.log('   https://codewith.site/dashboard/login')
    console.log('\n📝 登录信息:')
    console.log(`   用户名: ${newUser.username}`)
    console.log(`   密码:   ${testUserData.password}`)
    console.log('')

  } catch (error) {
    logger.error('❌ 创建测试用户失败:', error)
    console.error('\n错误详情:', error.message)
  } finally {
    await mongoose.disconnect()
    logger.info('👋 数据库连接已关闭')
  }
}

// 运行
createTestUser().catch(error => {
  console.error('💥 脚本执行失败:', error)
  process.exit(1)
})
