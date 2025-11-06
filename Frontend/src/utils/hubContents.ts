const docs = {
intro : `

🚀 API 文档

    一站式后端即服务（BaaS）平台，支持多租户、自动 CRUD、JWT 认证、权限管理、SQL 执行与反向代理。
    前端只需丢进 dist/ 文件夹即可上线，后端一条命令即可启动整个服务。

🔍 项目简介

LighterBaseHub 是 LighterBase 的多租户管理面板：

    用户注册 / 登录 / JWT 续签
    创建项目 → 自动分配端口 → 启动独立 LighterBase 实例
    反向代理所有子实🧭 启动指南例 API，统一入口 http://localhost:8080/{userId}/{projectId}/*
    管理员可执行任意 SQL、查看全站日志、管理权限策略

    每个项目 = 独立进程 + 独立 SQLite 数据库 + 独立端口，互不干扰。

🧭 启动指南

\`\`\`bash
# LighterBase

# 1. 下载 release 或直接 clone

git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/app/LighterBase

# 2. 一键启动（默认端口 8080 + 8090）

./LighterBase
\`\`\`

\`\`\`bash
# LighterBaseHub

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/web/LighterBaseHub

# 2. 一键启动（默认端口 8080 + 8090）
./LighterBaseHub
\`\`\`

服务就绪后

    管理后台 & 前端：http://localhost:8090
    后端 API 入口：http://localhost:8080

    `  
}


export default docs
