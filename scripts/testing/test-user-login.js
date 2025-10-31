#!/usr/bin/env node

/**
 * 用户登录和接口测试脚本
 * 测试用户登录、认证和相关 API 接口
 */

const axios = require('axios');
const chalk = require('chalk');

// 配置
const config = {
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  testUser: {
    username: process.env.TEST_USERNAME || 'testuser_176181423583945210',
    password: process.env.TEST_PASSWORD || 'Test123456'
  },
  timeout: 10000
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

let userToken = null;

// 测试用例
const testCases = [
  {
    name: '用户登录',
    method: 'POST',
    url: '/users/login',
    auth: false,
    data: {
      username: config.testUser.username,
      password: config.testUser.password
    },
    expect: { status: 200, hasToken: true }
  },
  {
    name: '获取用户信息',
    method: 'GET',
    url: '/users/profile',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取 API 统计',
    method: 'GET',
    url: '/users/apiStats/recent?limit=5',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取积分趋势',
    method: 'GET',
    url: '/users/credits/trends?days=7',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取邀请信息',
    method: 'GET',
    url: '/users/referral',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取工单列表',
    method: 'GET',
    url: '/users/tickets',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取发票列表',
    method: 'GET',
    url: '/users/invoices',
    auth: true,
    expect: { status: 200, hasData: true }
  }
];

// 执行单个测试
async function runTest(test) {
  stats.total++;
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (test.auth) {
      if (!userToken) {
        console.log(chalk.yellow(`⊘ ${test.name} - 跳过（未登录）`));
        stats.skipped++;
        return;
      }
      headers.Authorization = `Bearer ${userToken}`;
    }
    
    const response = await axios({
      method: test.method,
      url: `${config.baseURL}${test.url}`,
      headers,
      data: test.data,
      timeout: config.timeout,
      validateStatus: () => true // 不自动抛出错误
    });
    
    // 验证状态码
    if (response.status !== test.expect.status) {
      throw new Error(`状态码不匹配: 期望 ${test.expect.status}, 实际 ${response.status}`);
    }
    
    // 验证数据
    if (test.expect.hasData && !response.data) {
      throw new Error('响应数据为空');
    }
    
    // 保存登录 token
    if (test.expect.hasToken && response.data.token) {
      userToken = response.data.token;
      console.log(chalk.green(`✓ ${test.name}`));
      console.log(chalk.gray(`  Token: ${userToken.substring(0, 50)}...`));
    } else {
      console.log(chalk.green(`✓ ${test.name}`));
      if (response.data.success !== undefined) {
        console.log(chalk.gray(`  Success: ${response.data.success}`));
      }
    }
    
    stats.passed++;
    
  } catch (error) {
    console.log(chalk.red(`✗ ${test.name}`));
    console.log(chalk.red(`  错误: ${error.message}`));
    if (error.response) {
      console.log(chalk.gray(`  状态码: ${error.response.status}`));
      console.log(chalk.gray(`  响应: ${JSON.stringify(error.response.data).substring(0, 200)}`));
    }
    stats.failed++;
  }
}

// 主函数
async function main() {
  console.log(chalk.bold.cyan('\n🧪 用户登录和接口测试\n'));
  console.log(chalk.gray(`目标服务器: ${config.baseURL}`));
  console.log(chalk.gray(`测试用户: ${config.testUser.username}\n`));
  
  // 执行所有测试
  for (const test of testCases) {
    await runTest(test);
  }
  
  // 输出统计
  console.log(chalk.bold.cyan('\n📊 测试结果统计\n'));
  console.log(`总计: ${stats.total}`);
  console.log(chalk.green(`通过: ${stats.passed}`));
  console.log(chalk.red(`失败: ${stats.failed}`));
  console.log(chalk.yellow(`跳过: ${stats.skipped}`));
  
  // 计算成功率
  const successRate = stats.total > 0 ? ((stats.passed / (stats.total - stats.skipped)) * 100).toFixed(2) : 0;
  console.log(chalk.bold(`\n成功率: ${successRate}%\n`));
  
  // 返回退出码
  process.exit(stats.failed > 0 ? 1 : 0);
}

// 执行
main().catch(error => {
  console.error(chalk.red('测试执行失败:'), error);
  process.exit(1);
});

