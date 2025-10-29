#!/bin/bash
# 验证脚本目录结构

echo "🔍 验证 Scripts 目录结构..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查目录
echo "📁 检查目录结构..."
directories=("deployment" "testing" "maintenance" "tools")
for dir in "${directories[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir/ 存在"
    else
        echo -e "${RED}✗${NC} $dir/ 不存在"
    fi
done
echo ""

# 检查重要脚本
echo "📄 检查重要脚本..."
important_scripts=(
    "manage.js"
    "deployment/deploy-optimized.sh"
    "deployment/check-env.sh"
    "testing/test-api.js"
    "tools/view-logs.sh"
    "tools/data-transfer-enhanced.js"
    "maintenance/init-database.js"
)

for script in "${important_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo -e "${GREEN}✓${NC} $script"
    else
        echo -e "${RED}✗${NC} $script 不存在"
    fi
done
echo ""

# 统计脚本数量
echo "📊 脚本统计..."
echo "部署脚本: $(find deployment -type f 2>/dev/null | wc -l)"
echo "测试脚本: $(find testing -type f 2>/dev/null | wc -l)"
echo "维护脚本: $(find maintenance -type f 2>/dev/null | wc -l)"
echo "工具脚本: $(find tools -type f 2>/dev/null | wc -l)"
echo "总计: $(find . -maxdepth 2 -type f \( -name "*.js" -o -name "*.sh" \) 2>/dev/null | wc -l)"
echo ""

# 检查文档
echo "📚 检查文档..."
docs=("README.md" "REORGANIZATION_SUMMARY.md" "QUICK_REFERENCE.md" "DIRECTORY_TREE.txt")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${RED}✗${NC} $doc 不存在"
    fi
done
echo ""

echo -e "${GREEN}✅ 验证完成！${NC}"
