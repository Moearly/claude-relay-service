#!/bin/bash

# SSL 证书配置脚本
# 使用方法: ./setup-ssl.sh your-email@example.com

SERVER="root@66.154.126.71"
PASSWORD="mrp1xTuv1O"
DOMAIN="api.codewith.site"
EMAIL="${1:-admin@codewith.site}"

echo "🔒 开始配置 SSL 证书"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 配置信息:"
echo "  - 域名: $DOMAIN"
echo "  - 邮箱: $EMAIL"
echo "  - 服务器: 66.154.126.71"
echo ""

# 检查 DNS 是否生效
echo "🔍 检查 DNS 解析..."
DNS_IP=$(dig +short $DOMAIN | tail -1)

if [ -z "$DNS_IP" ]; then
    echo "❌ DNS 解析失败！"
    echo ""
    echo "请确保已在域名管理面板添加 A 记录:"
    echo "  类型: A"
    echo "  名称: api"
    echo "  目标: 66.154.126.71"
    echo ""
    exit 1
fi

if [ "$DNS_IP" != "66.154.126.71" ]; then
    echo "⚠️  DNS 解析结果: $DNS_IP"
    echo "⚠️  期望结果: 66.154.126.71"
    echo ""
    echo "DNS 可能还未完全生效，建议等待 5-30 分钟后再试"
    echo ""
    read -p "是否继续配置 SSL? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ DNS 解析正确: $DNS_IP"
fi

echo ""
echo "🔒 获取 SSL 证书..."

sshpass -p "$PASSWORD" ssh $SERVER << ENDSSH
set -e

# 获取 SSL 证书
certbot --nginx \
  -d $DOMAIN \
  --non-interactive \
  --agree-tos \
  -m $EMAIL \
  --redirect

# 测试自动续期
certbot renew --dry-run

echo ""
echo "✅ SSL 证书配置完成！"

ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ SSL 证书配置成功！"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔍 验证配置:"
    echo "  curl https://$DOMAIN/health"
    echo ""
    echo "🌐 访问地址:"
    echo "  https://$DOMAIN"
    echo ""
    echo "📋 证书信息:"
    echo "  • 证书路径: /etc/letsencrypt/live/$DOMAIN/"
    echo "  • 自动续期: 已启用（每天检查）"
    echo "  • 有效期: 90 天"
    echo ""
    echo "🔧 更新前端配置:"
    echo "  NEXT_PUBLIC_API_BASE_URL=https://$DOMAIN"
    echo ""
else
    echo ""
    echo "❌ SSL 证书配置失败"
    echo ""
    echo "可能的原因:"
    echo "  1. DNS 还未完全生效"
    echo "  2. 服务器防火墙阻止了 80/443 端口"
    echo "  3. Nginx 配置有误"
    echo ""
    echo "请检查后重试"
    exit 1
fi

