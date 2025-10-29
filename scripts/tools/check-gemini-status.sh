#!/bin/bash

# Gemini 服务状态检查脚本
# 用于排查线上 Gemini 无法使用的问题

SERVER="156.229.163.86"
PORT="3000"
BASE_URL="http://${SERVER}:${PORT}"

echo "======================================"
echo "Gemini 服务状态检查"
echo "服务器: ${SERVER}"
echo "时间: $(date)"
echo "======================================"
echo ""

# 1. 检查服务健康状态
echo "1️⃣ 检查服务健康状态..."
echo "------------------------------------"
curl -s "${BASE_URL}/health" | jq '.'
echo ""

# 2. 获取 Admin Token (需要输入密码)
echo "2️⃣ 登录获取 Admin Token..."
echo "------------------------------------"
ADMIN_USERNAME="cr_admin_3ba48c3b"
ADMIN_PASSWORD="D0vI06DB0VEOpOlM"

TOKEN_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${ADMIN_USERNAME}\",\"password\":\"${ADMIN_PASSWORD}\"}")

ADMIN_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ 登录失败！"
  echo "响应: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ 登录成功！Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# 3. 检查 Gemini 账户列表
echo "3️⃣ 检查 Gemini 账户配置..."
echo "------------------------------------"
ACCOUNTS=$(curl -s -X GET "${BASE_URL}/admin/gemini-accounts" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

echo "$ACCOUNTS" | jq '.'
echo ""

# 提取第一个账户的详细信息
ACCOUNT_ID=$(echo "$ACCOUNTS" | jq -r '.data[0].id // empty')
ACCOUNT_NAME=$(echo "$ACCOUNTS" | jq -r '.data[0].name // empty')
ACCOUNT_STATUS=$(echo "$ACCOUNTS" | jq -r '.data[0].status // empty')
PROJECT_ID=$(echo "$ACCOUNTS" | jq -r '.data[0].projectId // empty')

echo "📋 账户摘要:"
echo "  - 账户ID: ${ACCOUNT_ID}"
echo "  - 账户名: ${ACCOUNT_NAME}"
echo "  - 状态: ${ACCOUNT_STATUS}"
echo "  - 项目ID: ${PROJECT_ID}"
echo ""

# 4. 检查 Gemini API Keys
echo "4️⃣ 检查 Gemini API Keys..."
echo "------------------------------------"
API_KEYS=$(curl -s -X GET "${BASE_URL}/admin/api-keys" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

# 过滤只显示 Gemini 权限的 Key
echo "$API_KEYS" | jq '[.data[] | select(.permissions | contains("gemini"))]'
echo ""

GEMINI_KEY=$(echo "$API_KEYS" | jq -r '[.data[] | select(.permissions | contains("gemini"))][0].key // empty')

if [ -z "$GEMINI_KEY" ] || [ "$GEMINI_KEY" = "null" ]; then
  echo "❌ 没有找到 Gemini API Key"
  exit 1
fi

echo "📋 找到 Gemini Key: ${GEMINI_KEY:0:30}..."
echo ""

# 5. 测试 Gemini API 调用
echo "5️⃣ 测试 Gemini API 调用..."
echo "------------------------------------"
echo "测试模型: gemini-2.0-flash-exp"
echo "测试内容: 1+1等于几？"
echo ""

GEMINI_RESPONSE=$(curl -s -X POST "${BASE_URL}/gemini/v1/models/gemini-2.0-flash-exp:generateContent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GEMINI_KEY}" \
  -d '{
    "contents": [
      {
        "parts": [
          {"text": "1+1等于几？请简短回答。"}
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 100
    }
  }')

echo "响应:"
echo "$GEMINI_RESPONSE" | jq '.'
echo ""

# 6. 分析结果
echo "6️⃣ 分析结果..."
echo "------------------------------------"

if echo "$GEMINI_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "❌ API 调用失败！"
  ERROR_MESSAGE=$(echo "$GEMINI_RESPONSE" | jq -r '.error.message // .error')
  ERROR_TYPE=$(echo "$GEMINI_RESPONSE" | jq -r '.error.type // "unknown"')
  ERROR_CODE=$(echo "$GEMINI_RESPONSE" | jq -r '.error.code // "unknown"')
  
  echo ""
  echo "错误详情:"
  echo "  - 类型: ${ERROR_TYPE}"
  echo "  - 代码: ${ERROR_CODE}"
  echo "  - 消息: ${ERROR_MESSAGE}"
  echo ""
  
  # 根据错误类型给出建议
  echo "💡 建议排查方向:"
  case "$ERROR_MESSAGE" in
    *"permission"*|*"403"*)
      echo "  1. 检查 Google Cloud 项目是否启用了 Generative Language API"
      echo "  2. 验证 Access Token 是否有效"
      echo "  3. 检查项目 ID 是否正确"
      ;;
    *"project"*|*"configuration"*)
      echo "  1. 验证项目 ID: ${PROJECT_ID}"
      echo "  2. 检查账户类型是否匹配"
      echo "  3. 尝试使用普通个人 Google 账号"
      ;;
    *"token"*|*"auth"*)
      echo "  1. Access Token 可能已过期"
      echo "  2. 需要刷新 Token"
      echo "  3. 重新进行 OAuth 授权"
      ;;
    *"quota"*|*"rate"*)
      echo "  1. 检查 API 配额是否用完"
      echo "  2. 查看 Google Cloud Console 配额页面"
      ;;
    *)
      echo "  1. 查看服务器日志: tail -200 /opt/claude-relay-service/logs/service.log"
      echo "  2. 检查网络连接"
      echo "  3. 验证 Gemini API 端点是否可访问"
      ;;
  esac
else
  echo "✅ API 调用成功！"
  RESPONSE_TEXT=$(echo "$GEMINI_RESPONSE" | jq -r '.candidates[0].content.parts[0].text // "无响应内容"')
  echo ""
  echo "响应内容: ${RESPONSE_TEXT}"
fi

echo ""
echo "======================================"
echo "检查完成"
echo "======================================"

