#!/bin/bash

# 邮件系统配置和测试脚本
# 使用方法: bash scripts/setup-email.sh <resend_api_key> <test_email>

set -e

RESEND_API_KEY="$1"
TEST_EMAIL="$2"

if [ -z "$RESEND_API_KEY" ] || [ -z "$TEST_EMAIL" ]; then
    echo "❌ 用法: bash scripts/setup-email.sh <resend_api_key> <test_email>"
    echo ""
    echo "示例: bash scripts/setup-email.sh re_xxxxxxxxxx test@example.com"
    echo ""
    echo "📝 获取 Resend API Key:"
    echo "   1. 访问 https://resend.com/api-keys"
    echo "   2. 创建新的 API Key"
    echo "   3. 复制完整的 Key（以 re_ 开头）"
    exit 1
fi

echo "🔧 邮件系统配置工具"
echo "===================="
echo ""

# 获取管理员 token
echo "📋 1. 获取管理员凭据..."
ADMIN_USERNAME=$(grep 'Admin username:' logs/service.log 2>/dev/null | tail -1 | awk '{print $NF}')
ADMIN_PASSWORD=$(cat init.json 2>/dev/null | grep -o '"adminPassword":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ]; then
    echo "❌ 无法获取管理员凭据"
    exit 1
fi

echo "   ✅ 管理员用户名: $ADMIN_USERNAME"

# 登录获取 token
echo ""
echo "🔐 2. 登录获取 Token..."
LOGIN_RESPONSE=$(curl -s -X POST https://api.codewith.site/admin/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ 登录失败"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "   ✅ Token 获取成功"

# 配置邮件设置
echo ""
echo "📧 3. 配置邮件设置..."
CONFIG_RESPONSE=$(curl -s -X PUT https://api.codewith.site/admin/email-settings \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{
        \"provider\": \"resend\",
        \"enabled\": true,
        \"resendApiKey\": \"$RESEND_API_KEY\",
        \"fromName\": \"AI Code Relay\",
        \"fromEmail\": \"onboarding@resend.dev\"
    }")

if echo "$CONFIG_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ 邮件设置已保存"
else
    echo "   ❌ 保存失败"
    echo "$CONFIG_RESPONSE"
    exit 1
fi

# 发送测试邮件
echo ""
echo "✉️  4. 发送测试邮件到 $TEST_EMAIL ..."
TEST_RESPONSE=$(curl -s -X POST https://api.codewith.site/admin/email-settings/test \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "{\"to\":\"$TEST_EMAIL\"}")

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ 测试邮件已发送！"
    echo ""
    echo "📬 请检查邮箱: $TEST_EMAIL"
    echo "   （可能在垃圾邮件文件夹中）"
else
    echo "   ❌ 发送失败"
    echo "$TEST_RESPONSE"
    exit 1
fi

# 查看邮件历史
echo ""
echo "📊 5. 查看邮件发送历史..."
LOGS_RESPONSE=$(curl -s "https://api.codewith.site/admin/email/logs?limit=5" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$LOGS_RESPONSE" | grep -o '"to":"[^"]*"' | head -5
echo "$LOGS_RESPONSE" | grep -o '"status":"[^"]*"' | head -5

echo ""
echo "✅ 邮件系统配置完成！"
echo ""
echo "🎯 下一步操作："
echo "   1. 检查邮箱 $TEST_EMAIL"
echo "   2. 访问前端查看邮件历史: /admin/email-logs"
echo "   3. 创建邮件模板: /admin/email-templates"
echo ""
echo "💡 提示："
echo "   - 如需使用自己的域名，请在 Resend 控制台验证"
echo "   - 当前使用 Resend 测试域名: onboarding@resend.dev"

