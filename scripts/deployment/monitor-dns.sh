#!/bin/bash

# DNS 监控脚本 - 持续检查 DNS 是否指向正确的 IP

DOMAIN="api.codewith.site"
EXPECTED_IP="66.154.126.71"
CHECK_INTERVAL=30  # 每30秒检查一次

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DNS 监控工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "监控域名: $DOMAIN"
echo "期望 IP: $EXPECTED_IP"
echo "检查间隔: ${CHECK_INTERVAL}秒"
echo ""
echo "按 Ctrl+C 停止监控"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

count=0
while true; do
    count=$((count + 1))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 使用 Google DNS 查询
    current_ip=$(dig @8.8.8.8 $DOMAIN +short | head -1)
    
    echo -n "[$timestamp] 检查 #$count: "
    
    if [ "$current_ip" = "$EXPECTED_IP" ]; then
        echo "✅ DNS 已生效！解析到: $current_ip"
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🎉 DNS 配置成功！"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "现在可以配置 SSL 证书了："
        echo "  ./scripts/deployment/setup-ssl.sh your-email@example.com"
        echo ""
        exit 0
    else
        echo "⏳ 当前解析: $current_ip (期望: $EXPECTED_IP)"
    fi
    
    sleep $CHECK_INTERVAL
done

