#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 创建初始数据和索引
 */

const mongoose = require('mongoose');
const { database, User, Announcement, CardKey } = require('../src/models');
const logger = require('../src/utils/logger');

async function initDatabase() {
  try {
    console.log('🚀 开始初始化数据库...\n');

    // 连接数据库
    await database.connect();

    // 1. 创建管理员账号
    console.log('👤 创建管理员账号...');
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123456', // 生产环境请修改
        displayName: '系统管理员',
        role: 'admin',
        credits: 100000,
        isEmailVerified: true,
        subscription: {
          planId: 'enterprise',
          planName: '企业版',
          dailyCredits: 50000,
          status: 'active',
          expiryDate: new Date('2099-12-31'),
        },
      });
      
      await admin.save();
      console.log('✅ 管理员账号创建成功: admin / admin123456\n');
    } else {
      console.log('⚠️  管理员账号已存在\n');
    }

    // 2. 创建测试用户
    console.log('👥 创建测试用户...');
    const testUserExists = await User.findOne({ username: 'testuser' });
    
    if (!testUserExists) {
      const testUser = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'test123456',
        displayName: '测试用户',
        role: 'user',
        credits: 10000,
        isEmailVerified: true,
        subscription: {
          planId: 'pro',
          planName: '专业版',
          dailyCredits: 18000,
          startDate: new Date(),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true,
          status: 'active',
        },
      });
      
      await testUser.save();
      console.log('✅ 测试用户创建成功: testuser / test123456\n');
    } else {
      console.log('⚠️  测试用户已存在\n');
    }

    // 3. 创建示例公告
    console.log('📢 创建示例公告...');
    const announcementCount = await Announcement.countDocuments();
    
    if (announcementCount === 0) {
      const announcements = [
        {
          title: '欢迎使用 Claude Relay 商业化平台',
          content: `感谢您选择我们的服务！

我们提供稳定、高效的 Claude API 中转服务，帮助您轻松接入 AI 能力。

主要特性：
- 账户池技术，无封号风险
- 多模型支持，灵活切换
- 按需付费，经济实惠
- 7x24 技术支持

如有任何问题，请随时联系我们的客服团队。`,
          category: 'important',
          author: '管理员',
          isPinned: true,
          priority: 10,
        },
        {
          title: '服务条款和隐私政策',
          content: `请仔细阅读我们的服务条款和隐私政策。

1. 服务范围
2. 用户责任
3. 隐私保护
4. 数据安全
5. 免责声明

完整条款请访问官网查看。`,
          category: 'important',
          author: '管理员',
        },
        {
          title: 'Claude Code 配置教程',
          content: `快速配置 Claude Code 的步骤：

1. 获取您的 API 密钥
2. 配置环境变量
3. 测试连接
4. 开始使用

详细步骤请参考教程页面。`,
          category: 'tutorial',
          author: '管理员',
        },
      ];
      
      await Announcement.insertMany(announcements);
      console.log(`✅ 创建了 ${announcements.length} 个示例公告\n`);
    } else {
      console.log(`⚠️  已存在 ${announcementCount} 个公告\n`);
    }

    // 4. 创建测试卡密
    console.log('🎫 创建测试卡密...');
    const cardKeyCount = await CardKey.countDocuments();
    
    if (cardKeyCount === 0) {
      const testCardKeys = [];
      
      // 创建5个测试卡密
      for (let i = 0; i < 5; i++) {
        const code = CardKey.generateCode();
        testCardKeys.push({
          code,
          type: 'credits',
          credits: 10000,
          status: 'unused',
          note: '测试卡密',
        });
      }
      
      await CardKey.insertMany(testCardKeys);
      console.log(`✅ 创建了 ${testCardKeys.length} 个测试卡密:`);
      testCardKeys.forEach(key => {
        console.log(`   - ${key.code} (10000 积分)`);
      });
      console.log('');
    } else {
      console.log(`⚠️  已存在 ${cardKeyCount} 个卡密\n`);
    }

    // 5. 创建索引
    console.log('📊 创建数据库索引...');
    await User.createIndexes();
    await Announcement.createIndexes();
    await CardKey.createIndexes();
    console.log('✅ 索引创建完成\n');

    // 6. 显示统计信息
    console.log('📈 数据库统计:');
    const userCount = await User.countDocuments();
    const announcementCountFinal = await Announcement.countDocuments();
    const cardKeyCountFinal = await CardKey.countDocuments();
    
    console.log(`   - 用户数: ${userCount}`);
    console.log(`   - 公告数: ${announcementCountFinal}`);
    console.log(`   - 卡密数: ${cardKeyCountFinal}`);
    console.log('');

    console.log('✨ 数据库初始化完成！\n');
    console.log('默认账号信息:');
    console.log('  管理员: admin / admin123456');
    console.log('  测试用户: testuser / test123456');
    console.log('');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// 运行初始化
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;

