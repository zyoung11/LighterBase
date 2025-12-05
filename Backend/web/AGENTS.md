# LighterBase - 多租户BaaS平台

## 项目概述

LighterBase是一个基于Go语言开发的多租户后端即服务（BaaS）平台，采用双程序架构设计。系统由两个独立的Go程序组成：**LighterBaseHub**（管理中心）和**LighterBase**（BaaS核心服务），共同提供完整的用户管理、项目隔离和数据库服务功能。

## 系统架构

### 双程序架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LighterBaseHub (8080)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 用户认证 │ 项目管理 │ 反向代理 │ 目录管理 │ 路由分发  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    LighterBase (8081)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 动态SQL │ 通用CRUD │ 安全策略 │ 审计日志 │ 多租户隔离 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构

```
LighterBaseHubData/Apps/                    # 多租户数据存储
├── {userId}/                              # 用户目录
│   ├── {projectId}/                       # 项目目录
│   │   ├── metaDate.db                    # 元数据库（安全策略、日志）
│   │   └── data.db                        # 用户数据数据库
│   └── ...
└── ...

web/                                        # 主项目目录
├── AppMod/                                # LighterBase程序
│   ├── database/                          # sqlc生成的数据库代码
│   ├── SQL/                               # SQL schema和查询
│   ├── main.go                            # LighterBase主程序
│   └── sqlc.yaml                          # sqlc配置文件
├── database/                              # Hub的sqlc数据库代码
├── SQL/                                   # Hub的SQL文件
├── Base.go                                # 共享基础代码
├── main.go                                # Hub主程序
├── LighterBaseHub                         # Hub可执行文件
├── LighterBase                            # BaaS可执行文件
└── test/                                  # 测试工具
```

## 核心组件详解

### 1. LighterBaseHub (端口: 8080)

#### 功能特性
- **用户管理**: 注册、登录、JWT认证、用户CRUD
- **项目管理**: 创建、删除、列表、更新项目
- **反向代理**: 将BaaS请求路由到对应的项目实例
- **目录管理**: 自动创建用户和项目目录结构
- **初始化协调**: 调用LighterBase初始化新项目

#### 数据库结构
```sql
-- users表
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    user_avatar TEXT,
    create_at TEXT,
    update_at TEXT
);

-- projects表  
CREATE TABLE projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    project_avatar TEXT,
    project_description TEXT,
    project_size INTEGER DEFAULT 0,
    create_at TEXT,
    update_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

#### API端点
```
# 用户相关
POST   /api/users/register      # 用户注册
POST   /api/users/login         # 用户登录
GET    /api/users               # 用户列表（仅管理员）
GET    /api/users/:id           # 获取用户信息
PUT    /api/users/:id           # 更新用户
DELETE /api/users/:id           # 删除用户
GET    /api/users/check/init    # 检查初始化状态

# 项目相关
POST   /api/projects            # 创建项目
GET    /api/projects            # 获取我的项目
GET    /api/projects/:id        # 获取项目详情
PUT    /api/projects/:id        # 更新项目
DELETE /api/projects/:id        # 删除项目

# BaaS反向代理
USE    /:userId/:projectId/*    # 代理到LighterBase
```

### 2. LighterBase (端口: 8081)

#### 功能特性
- **多租户隔离**: 每个项目独立的数据存储
- **动态SQL执行**: 支持CREATE TABLE等SQL操作
- **通用CRUD API**: 自动化的数据操作接口
- **安全策略系统**: 表级别的权限控制
- **审计日志**: 完整的操作记录
- **JWT认证**: 用户身份验证和授权

#### 数据库架构
每个项目包含两个数据库：

1. **metaDate.db** - 元数据管理
```sql
-- 安全策略表
CREATE TABLE _security_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    create_where TEXT,    -- 创建权限条件
    delete_where TEXT,    -- 删除权限条件  
    update_where TEXT,    -- 更新权限条件
    view_where TEXT       -- 查看权限条件
);

-- SQL记录表
CREATE TABLE _sqls_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sql TEXT NOT NULL
);

-- 操作日志表
CREATE TABLE _log_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

2. **data.db** - 用户数据存储
```sql
-- 默认用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    create_at TEXT,
    update_at TEXT
);
```

#### API端点
```
# 初始化
POST   /:userId/:projectId/init                    # 初始化项目

# 认证相关
POST   /:userId/:projectId/api/auth/login         # 登录
POST   /:userId/:projectId/api/auth/refresh       # 刷新令牌
GET    /:userId/:projectId/api/auth/init          # 检查初始化

# SQL管理（仅root）
POST   /:userId/:projectId/api/create-table/create/  # 执行SQL

# 通用CRUD
POST   /:userId/:projectId/api/auto/create/:table    # 创建记录
DELETE /:userId/:projectId/api/auto/delete/:table    # 删除记录
PUT    /:userId/:projectId/api/auto/update/:table    # 更新记录
POST   /:userId/:projectId/api/auto/view/:table      # 查看记录（分页）

# 安全管理（仅root）
GET    /:userId/:projectId/api/security              # 获取所有安全策略
PUT    /:userId/:projectId/api/security/:table_name  # 更新安全策略

# 查询工具（仅root）
GET    /:userId/:projectId/api/query/tables          # 列出所有表
GET    /:userId/:projectId/api/query/logs            # 查看日志
POST   /:userId/:projectId/api/search/logs           # 搜索日志

# SQL记录（仅root）
GET    /:userId/:projectId/api/sqls/latest           # 获取最新SQL记录
```

## 安全策略系统

### 权限模型
LighterBase实现了细粒度的表级别权限控制：

1. **@uid占位符**: 在权限条件中使用`@uid`表示当前用户ID
2. **四种操作权限**:
   - `create_where`: 创建记录的条件
   - `delete_where`: 删除记录的条件
   - `update_where`: 更新记录的条件
   - `view_where`: 查看记录的条件

### 权限示例
```sql
-- 用户只能查看自己的数据
view_where = "user_id = @uid"

-- 用户只能删除自己的草稿
delete_where = "user_id = @uid AND status = 'draft'"

-- 公开表，所有人都可以查看
view_where = ""  -- 空字符串表示无限制

-- 需要登录才能创建
create_where = "@uid"  -- 特殊语法，表示需要认证
```

### 特殊用户
- **id=1**: Root用户，拥有所有权限，可以执行SQL、管理安全策略
- **访客用户**: 未认证用户，权限受安全策略限制

## 技术栈

### 后端技术
- **编程语言**: Go 1.25.1
- **Web框架**: Fiber v2.52.9
- **数据库**: SQLite3
- **ORM工具**: sqlc (类型安全的SQL代码生成)
- **认证**: JWT (JSON Web Tokens)
- **密码哈希**: bcrypt
- **CORS**: Fiber CORS中间件

### 开发工具
- **SQL代码生成**: sqlc
- **测试工具**: 自定义Python测试框架(PAT)
- **包管理**: Go Modules

## 部署指南

### 环境要求
- Go 1.25.1+
- SQLite3
- Linux Only

### 构建步骤

1. **安装依赖**
```bash
# 安装Go依赖
cd web
go mod download

# 安装AppMod依赖
cd AppMod
go mod download
```

2. **生成数据库代码**
```bash
# 生成Hub的数据库代码
cd web
sqlc generate

# 生成LighterBase的数据库代码
cd AppMod
sqlc generate
```

3. **构建可执行文件**
```bash
# 构建LighterBaseHub
cd web
go build -o LighterBaseHub main.go

# 构建LighterBase
cd AppMod
go build -o ../LighterBase main.go
```

4. **运行系统**
```bash
# 启动LighterBase (端口8081)
./LighterBase

# 在另一个终端启动LighterBaseHub (端口8080)
./LighterBaseHub
```

### 配置文件
系统使用硬编码配置，主要配置项：
- **JWT密钥**: `my_super_super_super_secret_key_that_is_very_long_and_not_that_random`
- **数据目录**: `./LighterBaseHubData/Apps/`
- **端口**: Hub(8080), BaaS(8081)
- **令牌有效期**: 48小时

## 开发指南

### 代码结构规范

#### 1. 导入顺序
```go
import (
    // 标准库
    "context"
    "database/sql"
    "fmt"
    "log"
    
    // 第三方库
    "github.com/gofiber/fiber/v2"
    "github.com/golang-jwt/jwt/v5"
    
    // 本地包
    "LighterBaseHub/database"
)
```

#### 2. 错误处理
- 使用明确的错误消息
- 记录错误日志
- 返回适当的HTTP状态码
- 避免panic，使用优雅的错误处理

#### 3. 命名约定
- **包名**: 小写，单数名词
- **函数名**: 驼峰式，动词开头
- **变量名**: 驼峰式，描述性名称
- **常量名**: 大写，下划线分隔
- **接口名**: 以"er"结尾

#### 4. SQLC使用
- 所有SQL查询放在`SQL/query.sql`中
- 使用`sqlc.yaml`配置代码生成
- 生成的代码在`database/`目录中

### 添加新功能

#### 1. 添加新API端点
```go
// 在routes数组中添加新路由
var routes = []Route{
    // ... 现有路由
    {Method: "POST", Path: "/api/new-endpoint", Handler: newHandler, AuthRequired: true},
}

// 实现处理器函数
func newHandler(c *fiber.Ctx) error {
    // 处理器逻辑
}
```

#### 2. 添加新数据库表
```sql
-- 1. 在schema.sql中添加表定义
CREATE TABLE new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- 字段定义
);

-- 2. 在query.sql中添加查询
-- name: CreateNewRecord :one
INSERT INTO new_table (...) VALUES (...) RETURNING *;

-- 3. 运行sqlc generate
```

#### 3. 添加安全策略
新创建的表会自动获得默认安全策略（无限制），可以通过安全API进行配置。



*最后更新: 2025年12月5日*
*版本: 1.0.0*