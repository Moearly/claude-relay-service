#!/bin/bash

# 新服务器API测试脚本
# 服务器: 66.154.126.71

BASE_URL="http://66.154.126.71:3000"
TEST_USER="testuser_$(date +%s)"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASS="Test123456"

echo "🧪 开始测试新服务器 API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 测试信息:"
echo "  - 服务器: $BASE_URL"
echo "  - 测试用户: $TEST_USER"
echo "  - 测试邮箱: $TEST_EMAIL"
echo ""

# 测试1: 健康检查
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 1: 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
HEALTH_RESPONSE=$(curl -s $BASE_URL/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ 健康检查通过"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ 健康检查失败"
    echo "$HEALTH_RESPONSE"
fi
echo ""

# 测试2: 用户注册
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 2: 用户注册"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/users/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASS\"}")

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 用户注册成功"
    USER_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "🔑 Token: ${USER_TOKEN:0:50}..."
else
    echo "❌ 用户注册失败"
    echo "$REGISTER_RESPONSE"
    exit 1
fi
echo ""

# 测试3: 用户登录
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 3: 用户登录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/users/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 用户登录成功"
    USER_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo "❌ 用户登录失败"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 测试4: 获取用户资料
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 4: 获取用户资料"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PROFILE_RESPONSE=$(curl -s $BASE_URL/users/profile \
  -H "Authorization: Bearer $USER_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 获取用户资料成功"
    echo "$PROFILE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$PROFILE_RESPONSE"
else
    echo "❌ 获取用户资料失败"
    echo "$PROFILE_RESPONSE"
fi
echo ""

# 测试5: 获取邀请信息
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 5: 获取邀请信息"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
REFERRAL_RESPONSE=$(curl -s $BASE_URL/users/referral \
  -H "Authorization: Bearer $USER_TOKEN")

if echo "$REFERRAL_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 获取邀请信息成功"
    echo "$REFERRAL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REFERRAL_RESPONSE"
else
    echo "❌ 获取邀请信息失败"
    echo "$REFERRAL_RESPONSE"
fi
echo ""

# 测试6: 获取积分趋势
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 6: 获取积分趋势"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TRENDS_RESPONSE=$(curl -s "$BASE_URL/users/credits/trends?days=7" \
  -H "Authorization: Bearer $USER_TOKEN")

if echo "$TRENDS_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 获取积分趋势成功"
    echo "$TRENDS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TRENDS_RESPONSE"
else
    echo "❌ 获取积分趋势失败"
    echo "$TRENDS_RESPONSE"
fi
echo ""

# 测试7: 获取工单列表
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 7: 获取工单列表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TICKETS_RESPONSE=$(curl -s $BASE_URL/users/tickets \
  -H "Authorization: Bearer $USER_TOKEN")

if echo "$TICKETS_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 获取工单列表成功"
    echo "$TICKETS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TICKETS_RESPONSE"
else
    echo "❌ 获取工单列表失败"
    echo "$TICKETS_RESPONSE"
fi
echo ""

# 测试8: 管理员登录
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试 8: 管理员登录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ADMIN_LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}')

if echo "$ADMIN_LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 管理员登录成功"
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "🔑 Admin Token: ${ADMIN_TOKEN:0:50}..."
else
    echo "❌ 管理员登录失败"
    echo "$ADMIN_LOGIN_RESPONSE"
fi
echo ""

# 测试9: 获取管理员用户列表
if [ -n "$ADMIN_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "测试 9: 获取管理员用户列表"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ADMIN_USERS_RESPONSE=$(curl -s $BASE_URL/admin/users \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    if echo "$ADMIN_USERS_RESPONSE" | grep -q "success.*true"; then
        echo "✅ 获取管理员用户列表成功"
        echo "$ADMIN_USERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_USERS_RESPONSE"
    else
        echo "❌ 获取管理员用户列表失败"
        echo "$ADMIN_USERS_RESPONSE"
    fi
    echo ""
fi

# 测试10: 获取管理员邀请统计
if [ -n "$ADMIN_TOKEN" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "测试 10: 获取管理员邀请统计"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    ADMIN_REFERRAL_RESPONSE=$(curl -s $BASE_URL/admin/referral/stats \
      -H "Authorization: Bearer $ADMIN_TOKEN")

    if echo "$ADMIN_REFERRAL_RESPONSE" | grep -q "success.*true"; then
        echo "✅ 获取管理员邀请统计成功"
        echo "$ADMIN_REFERRAL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ADMIN_REFERRAL_RESPONSE"
    else
        echo "❌ 获取管理员邀请统计失败"
        echo "$ADMIN_REFERRAL_RESPONSE"
    fi
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有测试完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 服务器信息:"
echo "  - API地址: $BASE_URL"
echo "  - 健康检查: $BASE_URL/health"
echo "  - 管理员账号: admin"
echo "  - 管理员密码: Admin123456"
echo ""
echo "🔧 更新前端配置:"
echo "  export NEXT_PUBLIC_API_BASE_URL=$BASE_URL"
echo ""

