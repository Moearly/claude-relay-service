#!/usr/bin/env node

/**
 * API 接口健康检查和自动化测试脚本
 * 用于验证所有管理员接口是否正常工作
 */

const axios = require('axios');
const chalk = require('chalk');

// 配置
const config = {
  baseURL: process.env.API_BASE_URL || 'https://api.codewith.site',
  adminToken: process.env.ADMIN_TOKEN || '',
  timeout: 10000
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// 测试用例
const testCases = [
  {
    name: '健康检查',
    method: 'GET',
    url: '/health',
    auth: false,
    expect: { status: 200 }
  },
  {
    name: '获取用户列表',
    method: 'GET',
    url: '/admin/users',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取订单列表',
    method: 'GET',
    url: '/admin/orders',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取公告列表',
    method: 'GET',
    url: '/admin/announcements',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取套餐列表',
    method: 'GET',
    url: '/admin/subscription-plans',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '获取系统统计',
    method: 'GET',
    url: '/admin/stats',
    auth: true,
    expect: { status: 200, hasData: true }
  },
  {
    name: '导出用户数据（JSON）',
    method: 'GET',
    url: '/admin/users/export?format=json',
    auth: true,
    expect: { status: 200 }
  },
  {
    name: '测试 CORS（预检请求）',
    method: 'OPTIONS',
    url: '/admin/users',
    auth: false,
    headers: {
      'Origin': 'https://codewith.site',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization'
    },
    expect: { status: 204 }
  }
];

// 执行单个测试
async function runTest(test) {
  stats.total++;
  
  try {
    const headers = {};
    
    if (test.auth) {
      if (!config.adminToken) {
        console.log(chalk.yellow(`⊘ ${test.name} - 跳过（缺少 ADMIN_TOKEN）`));
        stats.skipped++;
        return;
      }
      headers.Authorization = `Bearer ${config.adminToken}`;
    }
    
    if (test.headers) {
      Object.assign(headers, test.headers);
    }
    
    const response = await axios({
      method: test.method,
      url: `${config.baseURL}${test.url}`,
      headers,
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
    
    // 验证 CORS 头
    if (test.headers && test.headers.Origin) {
      const corsHeader = response.headers['access-control-allow-origin'];
      if (!corsHeader) {
        throw new Error('缺少 CORS 响应头');
      }
    }
    
    console.log(chalk.green(`✓ ${test.name}`));
    stats.passed++;
    
  } catch (error) {
    console.log(chalk.red(`✗ ${test.name}`));
    console.log(chalk.red(`  错误: ${error.message}`));
    if (error.response) {
      console.log(chalk.gray(`  响应: ${JSON.stringify(error.response.data).substring(0, 200)}`));
    }
    stats.failed++;
  }
}

// 主函数
async function main() {
  console.log(chalk.bold.cyan('\n🧪 API 接口健康检查\n'));
  console.log(chalk.gray(`目标服务器: ${config.baseURL}`));
  console.log(chalk.gray(`认证状态: ${config.adminToken ? '已配置' : '未配置（部分测试将跳过）'}\n`));
  
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

