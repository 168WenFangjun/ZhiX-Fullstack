<div align="center">

```
███████╗██╗  ██╗██╗██╗  ██╗
╚══███╔╝██║  ██║██║╚██╗██╔╝
  ███╔╝ ███████║██║ ╚███╔╝
 ███╔╝  ██╔══██║██║ ██╔██╗
███████╗██║  ██║██║██╔╝ ██╗
╚══════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

### 极志社区 · 全栈

**你的内容，你的主场。**

---

[![作者主页](https://img.shields.io/badge/🔥_作者是谁？点进来就知道了-→-FF3B30?style=for-the-badge)](https://www.macfans.app/vexacut-studio/)
&nbsp;
[![Author](https://img.shields.io/badge/🌐_Who_built_this%3F_Find_out_→-6C63FF?style=for-the-badge)](https://www.macfans.app/vexacut-studio/)

---

</div>

---

## 🇨🇳 中文版

<br>

<div align="center">

**不是所有社区都叫极志。**

这里没有废话，只有代码和态度。  
Go 后端 · React 前端 · Swift iOS · AWS 云端托管，为认真的人而建。

</div>

<br>

### 🧱 技术栈

<div align="center">

![Go](https://img.shields.io/badge/Go_1.23-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Swift](https://img.shields.io/badge/SwiftUI-F05138?style=for-the-badge&logo=swift&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)

</div>

<br>

### 📁 项目结构

```
ZhiX/
├── backend/              # 主服务（Go · Gin · GORM）
│   ├── config/           # 数据库 & Redis 初始化
│   ├── controllers/      # 业务逻辑
│   ├── middleware/       # JWT 鉴权
│   ├── models/           # 数据模型
│   ├── routes/           # 路由注册
│   ├── Dockerfile
│   └── main.go
├── frontend/             # Web 前端（React 18）
│   ├── public/
│   ├── src/
│   │   ├── components/   # 公共组件
│   │   ├── pages/        # 页面
│   │   ├── context/      # 全局状态
│   │   └── utils/        # 工具函数
│   └── Dockerfile
├── payment-service/      # 独立支付服务（Go · Gin）
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── Dockerfile
├── ios-app/              # iOS 客户端（SwiftUI）
│   ├── ZhiX/
│   │   ├── Views/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Managers/
│   └── fastlane/         # 自动化发布
└── k8s/                  # Kubernetes 部署配置
```

<br>

### ⚡ 本地跑起来

**后端**

```bash
cd backend
cp .env.example .env
go run main.go
# → http://localhost:8080
```

**支付服务**

```bash
cd payment-service
cp .env.example .env
go run main.go
# → http://localhost:8081
```

**前端**

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm start
# → http://localhost:3000
```

`.env.local` 配置：

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_PAYMENT_API_URL=http://localhost:8081
```

<br>

### 🎯 能干什么

```
✦ 全端响应式，手机平板桌面通吃
✦ 三级权限体系：管理员 · 用户 · 游客
✦ Markdown 编辑器，写作体验拉满
✦ 全文搜索，找内容不费劲
✦ 点赞 · 收藏，互动不缺席
✦ Apple Pay 支付，一触即付
✦ iOS 原生客户端，SwiftUI 构建
```

<br>

### 🚀 部署

通过 GitHub Actions 自动构建，推送即部署。  
Kubernetes 配置位于 `k8s/`，iOS 通过 Fastlane 自动发布。

<br>

---

### 🏗️ 架构设计

<br>

**backend — 主服务**

```
请求入口
  └── CORS 中间件（白名单：localhost:3000 / zhix.club）
        └── 路由层 /api
              ├── /auth          注册 · 登录（JWT 签发）
              ├── /articles      文章 CRUD · 点赞 · 浏览 · 收藏（管理员写，所有人读）
              ├── /favorites     收藏列表（JWT 必须）
              ├── /stats         用户行为统计（浏览 · 点赞 · 收藏计数）
              ├── /user          头像更新（JWT 必须）
              ├── /avatar        随机头像生成
              ├── /cover         封面图 · 插画 · 视频
              ├── /health        存活探针
              └── /ready         就绪探针（检查 DB + Redis）

中间件
  ├── AuthMiddleware   解析 Bearer JWT，注入 userId / role
  └── AdminMiddleware  role == "admin" 才放行写操作

数据层
  ├── PostgreSQL（GORM AutoMigrate）
  │     ├── users      邮箱唯一 · bcrypt 密码 · 角色 · 会员标记 · 行为计数
  │     ├── articles   标题 · 内容 · 标签 · 付费标记 · 点赞 / 浏览数
  │     ├── favorites  用户 ↔ 文章多对多
  │     └── homepage_configs  首页布局配置
  └── Redis            会话缓存 · 高频计数加速

连接池：MaxIdle 10 · MaxOpen 100 · ConnMaxLifetime 1h
```

<br>

**frontend — Web 前端**

```
React 18 · React Router 6 · Context API · CSS3

页面路由
  ├── /              首页（精选文章流）
  ├── /explore       发现页（全文搜索）
  ├── /article/:id   文章详情（Markdown 渲染）
  ├── /favorites     收藏夹（登录态）
  └── /profile       个人中心

全局状态（Context）
  ├── AuthContext    用户信息 · JWT Token · 登录 / 登出
  └── ThemeContext   主题切换

工具层（utils）
  ├── api.js         统一 axios 封装，自动注入 Authorization Header
  └── helpers.js     日期格式化 · 文本截断等

构建 & 部署
  Nginx 容器静态托管 → AWS S3 + CloudFront CDN 分发
```

<br>

**payment-service — 支付服务**

```
独立微服务，端口 8081，职责单一：处理支付

路由层 /api/payment
  ├── POST /apple-pay/verify-merchant   Apple Pay 商户验证（无需登录）
  ├── POST /apple-pay                   发起支付 · 写入订单（JWT 必须）
  └── GET  /orders/:orderId             查询订单状态（JWT 必须）

支付网关（可切换）
  ├── Stripe   默认网关，sk_live 密钥走 K8s Secret 注入
  └── Adyen    可选，通过 PAYMENT_GATEWAY 环境变量切换

数据模型 orders
  OrderID · TransactionID · UserID · ArticleID
  Amount · Currency(CNY) · Status(pending/paid/failed)
  PaymentMethod(apple_pay)

与主服务完全解耦，共享同一套 JWT Secret 做身份校验
```

<br>

**ios-app — iOS 客户端**

```
SwiftUI · MVVM · EnvironmentObject 全局状态注入

Managers（全局单例）
  ├── AuthManager      登录态 · currentUser · Token 持久化
  ├── ThemeManager     深色 / 浅色模式
  ├── NetworkManager   网络状态监听，断网时顶部 Banner 提示
  └── SecurityManager  启动时安全检查（越狱检测等）

Views（Tab 导航）
  ├── HomeView         首页文章流
  ├── ExploreView      发现 · 搜索
  ├── FavoritesView    收藏夹
  ├── ProfileView      个人中心
  └── SystemMonitorView  仅 admin 可见，系统监控面板

Services   封装所有 API 请求，统一错误处理
Models     与后端 JSON 字段对齐的 Codable 结构体

发布流程：Fastlane → App Store Connect 自动上传
```

<br>

**k8s — 部署编排**

```
Nginx Ingress → TLS（cert-manager · Let's Encrypt）
  ├── /api/payment  → zhix-payment Service（8081）
  └── /             → zhix-backend Service（80→8080）

Deployment 策略
  ├── backend       replicas: 3，RollingUpdate，maxUnavailable: 0
  └── payment       独立 Deployment，同等策略

HPA 自动扩缩容
  ├── backend   min 3 · max 20，CPU>70% 或 Mem>80% 触发扩容
  └── payment   独立 HPA 配置

配置管理
  ├── ConfigMap   非敏感配置（DB名 · Redis地址 · Apple Pay域名）
  └── Secret      DB密码 · JWT密钥 · Stripe密钥 · Apple Pay证书

Pod 安全
  runAsNonRoot · readOnlyRootFilesystem · drop ALL capabilities
  podAntiAffinity 确保副本分散到不同节点

资源限制（backend 单 Pod）
  requests: 250m CPU · 256Mi Mem
  limits:   500m CPU · 512Mi Mem
```

<br>

---

<div align="center">

**这个项目背后的人，比你想象的更有意思。**

[![👀 去看看作者在搞什么](https://img.shields.io/badge/👀_去看看作者在搞什么_→_macfans.app-FF3B30?style=for-the-badge)](https://www.macfans.app/vexacut-studio/)

</div>

---

<br>

## 🇺🇸 English Version

<br>

<div align="center">

**Not just another community. This one has a soul.**

Go backend · React frontend · Swift iOS · AWS · Built for people who mean it.

</div>

<br>

### 🧱 Tech Stack

<div align="center">

![Go](https://img.shields.io/badge/Go_1.23-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![Gin](https://img.shields.io/badge/Gin-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Swift](https://img.shields.io/badge/SwiftUI-F05138?style=for-the-badge&logo=swift&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)

</div>

<br>

### 📁 Project Structure

```
ZhiX/
├── backend/              # Main API service (Go · Gin · GORM)
├── frontend/             # Web client (React 18)
├── payment-service/      # Standalone payment service (Go · Gin)
├── ios-app/              # iOS client (SwiftUI)
└── k8s/                  # Kubernetes manifests
```

<br>

### ⚡ Up in 3 Steps

**Backend**

```bash
cd backend && cp .env.example .env && go run main.go
```

**Payment Service**

```bash
cd payment-service && cp .env.example .env && go run main.go
```

**Frontend**

```bash
cd frontend && npm install && cp .env.local.example .env.local && npm start
```

`.env.local` config:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_PAYMENT_API_URL=http://localhost:8081
```

<br>

### 🎯 What It Does

```
✦ Fully responsive — mobile, tablet, desktop
✦ Role-based access: Admin · User · Guest
✦ Markdown editor with smooth writing experience
✦ Full-text search built in
✦ Like & bookmark interactions
✦ Apple Pay — tap and done
✦ Native iOS app built with SwiftUI
```

<br>

### 🚀 Deployment

Auto-deployed via GitHub Actions on every push.  
Kubernetes configs live in `k8s/`. iOS releases automated with Fastlane.

<br>

---

### 🏗️ Architecture

<br>

**backend — Main Service**

```
Request Entry
  └── CORS Middleware (whitelist: localhost:3000 / zhix.club)
        └── Router /api
              ├── /auth          Register · Login (JWT issuance)
              ├── /articles      CRUD · Like · View · Favorite (admin writes, all read)
              ├── /favorites     Favorites list (JWT required)
              ├── /stats         User behavior stats (view · like · favorite counts)
              ├── /user          Avatar update (JWT required)
              ├── /avatar        Random avatar generation
              ├── /cover         Cover images · illustrations · videos
              ├── /health        Liveness probe
              └── /ready         Readiness probe (checks DB + Redis)

Middleware
  ├── AuthMiddleware   Parses Bearer JWT, injects userId / role
  └── AdminMiddleware  Only role == "admin" passes write operations

Data Layer
  ├── PostgreSQL (GORM AutoMigrate)
  │     ├── users      Unique email · bcrypt password · role · premium flag · behavior counters
  │     ├── articles   Title · content · tags · paid flag · likes / views
  │     ├── favorites  User ↔ Article many-to-many
  │     └── homepage_configs  Homepage layout config
  └── Redis            Session cache · high-frequency counter acceleration

Connection Pool: MaxIdle 10 · MaxOpen 100 · ConnMaxLifetime 1h
```

<br>

**frontend — Web Client**

```
React 18 · React Router 6 · Context API · CSS3

Page Routes
  ├── /              Home (featured article feed)
  ├── /explore       Explore (full-text search)
  ├── /article/:id   Article detail (Markdown rendering)
  ├── /favorites     Bookmarks (authenticated)
  └── /profile       Personal center

Global State (Context)
  ├── AuthContext    User info · JWT Token · login / logout
  └── ThemeContext   Theme switching

Utils
  ├── api.js         Unified axios wrapper, auto-injects Authorization header
  └── helpers.js     Date formatting · text truncation etc.

Build & Deploy
  Nginx container static hosting → AWS S3 + CloudFront CDN
```

<br>

**payment-service — Payment Service**

```
Standalone microservice, port 8081, single responsibility: handle payments

Router /api/payment
  ├── POST /apple-pay/verify-merchant   Apple Pay merchant verification (no auth)
  ├── POST /apple-pay                   Initiate payment · write order (JWT required)
  └── GET  /orders/:orderId             Query order status (JWT required)

Payment Gateway (switchable)
  ├── Stripe   Default gateway, sk_live key injected via K8s Secret
  └── Adyen    Optional, switched via PAYMENT_GATEWAY env var

Data Model: orders
  OrderID · TransactionID · UserID · ArticleID
  Amount · Currency(CNY) · Status(pending/paid/failed)
  PaymentMethod(apple_pay)

Fully decoupled from main service, shares same JWT Secret for auth
```

<br>

**ios-app — iOS Client**

```
SwiftUI · MVVM · EnvironmentObject global state injection

Managers (global singletons)
  ├── AuthManager      Auth state · currentUser · Token persistence
  ├── ThemeManager     Dark / light mode
  ├── NetworkManager   Network monitoring, offline banner notification
  └── SecurityManager  Security checks on launch (jailbreak detection etc.)

Views (Tab Navigation)
  ├── HomeView         Article feed
  ├── ExploreView      Explore · search
  ├── FavoritesView    Bookmarks
  ├── ProfileView      Personal center
  └── SystemMonitorView  Admin only, system monitoring panel

Services   Encapsulates all API requests with unified error handling
Models     Codable structs aligned with backend JSON fields

Release: Fastlane → App Store Connect automated upload
```

<br>

**k8s — Orchestration**

```
Nginx Ingress → TLS (cert-manager · Let's Encrypt)
  ├── /api/payment  → zhix-payment Service (8081)
  └── /             → zhix-backend Service (80→8080)

Deployment Strategy
  ├── backend       replicas: 3, RollingUpdate, maxUnavailable: 0
  └── payment       Independent Deployment, same strategy

HPA Auto-scaling
  ├── backend   min 3 · max 20, triggers on CPU>70% or Mem>80%
  └── payment   Independent HPA config

Config Management
  ├── ConfigMap   Non-sensitive config (DB name · Redis addr · Apple Pay domain)
  └── Secret      DB password · JWT key · Stripe key · Apple Pay certs

Pod Security
  runAsNonRoot · readOnlyRootFilesystem · drop ALL capabilities
  podAntiAffinity spreads replicas across different nodes

Resource Limits (backend per Pod)
  requests: 250m CPU · 256Mi Mem
  limits:   500m CPU · 512Mi Mem
```

<br>

---

<div align="center">

**The person behind this project is worth knowing.**

[![🔗 Step Into the Author's World →](https://img.shields.io/badge/🔗_Step_Into_the_Author's_World_→-6C63FF?style=for-the-badge)](https://www.macfans.app/vexacut-studio/)

</div>

---

<div align="center">
<br>

`// made with focus · ZhiX Team`

</div>
