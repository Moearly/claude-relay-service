#!/bin/bash

# 创建测试用户（通过 API）

API_URL="https://api.codewith.site"
ADMIN_TOKEN="your-admin-token-here"

echo "🔄 创建测试用户..."
echo ""

# 测试用户数据
USERNAME="testuser"
EMAIL="test@codewith.site"
PASSWORD="Test123456"
DISPLAY_NAME="测试用户"
CREDITS=10000

# 调用管理员 API 创建用户
response=$(curl -s -X POST "$API_URL/admin/users" \
  -H "Content-Type: application/json" \
  -H "Cookie: adminToken=$ADMIN_TOKEN" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"displayName\": \"$DISPLAY_NAME\",
    \"role\": \"user\",
    \"credits\": $CREDITS
  }")

echo "API 响应:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "============================================================"
echo "🎉 测试用户信息"
echo "============================================================"
echo "用户名:     $USERNAME"
echo "邮箱:       $EMAIL"
echo "密码:       $PASSWORD"
echo "显示名称:   $DISPLAY_NAME"
echo "积分:       $CREDITS"
echo "============================================================"
echo ""
echo "🌐 登录地址:"
echo "   https://codewith.site/dashboard/login"
echo ""
echo "📝 登录信息:"
echo "   用户名: $USERNAME"
echo "   密码:   $PASSWORD"
echo ""
