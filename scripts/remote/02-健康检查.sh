#!/bin/bash
# API 健康检查脚本

API_URL="https://api.codewith.site"

echo "🏥 API 健康检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1. 基础健康检查:"
curl -s "$API_URL/health" | jq '.' 2>/dev/null || curl -s "$API_URL/health"

echo ""
echo "2. 详细健康检查:"
curl -s "$API_URL/health/detailed" | jq '.' 2>/dev/null || curl -s "$API_URL/health/detailed"

echo ""
echo "3. CORS 测试:"
curl -I -H "Origin: https://codewith.site" "$API_URL/health" 2>&1 | grep -i "access-control"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
