# 🌐 Cloudflare + Vercel 配置指南

## 📋 前置准备

### 1. 获取 Cloudflare API Token

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → **My Profile**
3. 左侧菜单选择 **API Tokens**
4. 点击 **Create Token**
5. 选择 **Edit zone DNS** 模板
6. 配置权限：
   - **Zone Resources**: 选择 `codefog.cc` 域名
   - **Permissions**: `Zone.DNS - Edit`
7. 点击 **Continue to summary** → **Create Token**
8. **复制并保存** 生成的 Token（只显示一次）

### 2. 获取 Cloudflare Zone ID

1. 在 Cloudflare Dashboard 中选择 `codefog.cc` 域名
2. 滚动到页面右下角，找到 **Zone ID**
3. 点击复制按钮

### 3. 获取服务器 IP 地址

如果后端 `claude-relay-service` 已部署：
```bash
# 在服务器上运行
curl ifconfig.me
```

或者查看你的服务器控制面板获取公网 IP。

## 🚀 自动配置步骤

### 方式一：使用自动化脚本（推荐）

```bash
# 进入项目目录
cd /home/leiyi/codeSpace/ApiRelay

# 设置环境变量
export CLOUDFLARE_API_TOKEN="你的API Token"
export CLOUDFLARE_ZONE_ID="你的Zone ID"
export API_SERVER_IP="你的服务器IP"

# 运行配置脚本
node scripts/setup-cloudflare-dns.js
```

### 方式二：手动配置

如果不想使用脚本，可以手动配置：

#### 在 Cloudflare Dashboard 配置

访问：https://dash.cloudflare.com/ → 选择 `codefog.cc` → DNS → Records

**添加以下记录：**

| 类型 | 名称 | 内容 | 代理状态 | 说明 |
|------|------|------|---------|------|
| CNAME | @ | cname.vercel-dns.com | ⚪ DNS only | 主域名指向 Vercel |
| CNAME | www | cname.vercel-dns.com | ⚪ DNS only | www 子域名 |
| A | api | [服务器IP] | 🟠 Proxied | API 服务器 |

**重要提示：**
- 主域名和 www 必须关闭代理（灰色云朵），否则 Vercel 无法验证
- API 子域名建议开启代理（橙色云朵），获得 CDN 加速和 DDoS 防护

## 🔧 Vercel 域名配置

### 1. 访问 Vercel Dashboard

https://vercel.com/martn-leis-projects/commercial-website/settings/domains

### 2. 添加域名

1. 点击 **Add** 按钮
2. 输入：`codefog.cc`
3. 点击 **Add**
4. 等待验证（通常几分钟）

### 3. 添加 www 子域名（可选）

重复上述步骤，添加 `www.codefog.cc`

## ✅ 验证配置

### 1. DNS 传播检查

```bash
# 检查主域名
dig codefog.cc

# 检查 www
dig www.codefog.cc

# 检查 API
dig api.codefog.cc
```

或访问在线工具：https://www.whatsmydns.net/

### 2. 访问测试

- **前端网站**: https://codefog.cc
- **前端网站 (www)**: https://www.codefog.cc
- **API 健康检查**: https://api.codefog.cc/health

### 3. SSL 证书

Vercel 和 Cloudflare 都会自动配置 SSL 证书：
- Vercel 为主域名提供 Let's Encrypt 证书
- Cloudflare 为 API 子域名提供证书

等待几分钟后，所有域名都应该支持 HTTPS 访问。

## 🛠️ 后端服务器配置

### 确保后端服务正常运行

```bash
# SSH 连接到服务器
ssh user@your-server-ip

# 检查服务状态
cd /path/to/claude-relay-service
npm run service:status

# 如果未运行，启动服务
npm run service:start:daemon

# 查看日志
npm run service:logs
```

### 配置 CORS

确保后端允许来自前端域名的请求：

编辑 `config/config.js` 或 `.env`：

```bash
# 允许的前端域名
CORS_ORIGIN=https://codefog.cc,https://www.codefog.cc
```

重启服务：
```bash
npm run service:restart
```

### Nginx 反向代理（如果使用）

如果服务器使用 Nginx，配置示例：

```nginx
server {
    listen 80;
    server_name api.codefog.cc;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔍 常见问题

### Q1: DNS 配置后无法访问？
**A**: DNS 传播需要时间，通常 5-30 分钟，最多可能 24-48 小时。

### Q2: Vercel 显示域名验证失败？
**A**: 确保 Cloudflare 的代理状态为"DNS only"（灰色云朵）。

### Q3: API 请求 CORS 错误？
**A**: 检查后端的 CORS 配置，确保允许前端域名。

### Q4: SSL 证书错误？
**A**: 等待 Vercel 和 Cloudflare 自动签发证书，通常需要几分钟。

### Q5: API 子域名 502 错误？
**A**: 检查后端服务是否正常运行，防火墙是否允许 80/443 端口。

## 📊 监控和维护

### Cloudflare Analytics
访问 Cloudflare Dashboard 查看流量统计和安全事件。

### Vercel Analytics  
访问 Vercel Dashboard 查看网站访问统计和构建日志。

### 后端监控
```bash
# 查看服务状态
npm run service:status

# 查看实时日志
npm run service:logs:follow

# 查看监控面板
npm run monitor
```

## 🎉 完成

配置完成后，你的服务架构：

```
用户浏览器
    ↓
codefog.cc (Cloudflare DNS) → cname.vercel-dns.com → Vercel → Next.js 前端
    ↓
api.codefog.cc (Cloudflare Proxy) → 服务器 IP → claude-relay-service 后端
```

**优势：**
- ✅ 前端通过 Vercel 全球 CDN 加速
- ✅ API 通过 Cloudflare CDN 加速和安全防护
- ✅ 自动 HTTPS 证书
- ✅ DDoS 防护
- ✅ 高可用性和可扩展性

