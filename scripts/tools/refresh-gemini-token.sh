#!/bin/bash

# Gemini Token 刷新脚本

SERVER="156.229.163.86"
PORT="3000"
BASE_URL="http://${SERVER}:${PORT}"

echo "======================================"
echo "Gemini Token 刷新工具"
echo "======================================"
echo ""

# 登录获取 Admin Token
echo "1️⃣ 登录..."
ADMIN_USERNAME="cr_admin_3ba48c3b"
ADMIN_PASSWORD="D0vI06DB0VEOpOlM"

TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")

ADMIN_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 登录失败！"
  exit 1
fi

echo "✅ 登录成功"
echo ""

# 获取 Gemini 账户 ID
echo "2️⃣ 获取 Gemini 账户..."
ACCOUNTS=$(curl -s -X GET "${BASE_URL}/admin/gemini-accounts" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.data[0].id // empty')

if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ 未找到 Gemini 账户"
  exit 1
fi

echo "✅ 找到账户: ${ACCOUNT_ID}"
echo ""

# 刷新 Token
echo "3️⃣ 刷新 Access Token..."
REFRESH_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/gemini-accounts/${ACCOUNT_ID}/refresh-token" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$REFRESH_RESPONSE" | jq '.'
echo ""

if echo "$REFRESH_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Token 刷新成功！"
else
  echo "❌ Token 刷新失败！"
  echo "可能需要重新进行 OAuth 授权"
fi

echo ""
echo "======================================"

