# 🚀 API 文档

> 一站式后端即服务（BaaS）平台，支持多租户、自动 CRUD、JWT 认证、权限管理、SQL 执行与反向代理。  
> 前端只需丢进 `dist/` 文件夹即可上线，后端一条命令即可启动整个服务。



------



## 🔍 项目简介

LighterBaseHub 是 **LighterBase** 的多租户管理面板：  
1. 用户注册 / 登录 / JWT 续签  
2. 创建项目 → 自动分配端口 → 启动独立 LighterBase 实例  
3. 反向代理所有子实🧭 启动指南例 API，统一入口 `http://localhost:8080/{userId}/{projectId}/*`  
4. 管理员可执行任意 SQL、查看全站日志、管理权限策略  

> 每个项目 = 独立进程 + 独立 SQLite 数据库 + 独立端口，互不干扰。

---

## 🧭 启动指南

```bash
# LighterBase

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/app/LighterBase

# 2. 一键启动（默认端口 8080 + 8090）
./LighterBase
```

```bash
# LighterBaseHub

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/web/LighterBaseHub

# 2. 一键启动（默认端口 8080 + 8090）
./LighterBaseHub
```

服务就绪后  
- 管理后台 & 前端：`http://localhost:8090`  
- 后端 API 入口：`http://localhost:8080`  

---

## 🧩 架构速览
| 组件     | 技术栈                        | 说明                                       |
| -------- | ----------------------------- | ------------------------------------------ |
| 主控后端 | Go + Fiber + SQLite           | 负责账号、项目、权限、代理                 |
| 子实例   | 嵌入的 LighterBase 可执行文件 | 每个项目一份，独立端口                     |
| 反向代理 | Fiber 中间件                  | 透明转发 `/uid/pid/*` → `localhost:port/*` |
| 前端     | 任意静态文件                  | 丢进 `dist/` 即可，热加载无需重启          |



---



# LighterBaseHub API 文档



## 一、用户API

### 1. 用户注册

- http方法：POST

- URL：http://localhost:8080/api/users/register

- 请求头：

  ```
  Content-Type: application/json
  ```

- 请求体：

  ```json
  {
    "user_name": "string",
    "password": "string",
    "email": "string"
  }
  ```

- 预期返回：

  http状态码：201

  返回体：

  ```json
  {
    "user": {
      "user_id": 1,
      "user_name": "string",
      "password_hash": "string",
      "email": "string",
      "user_avatar": null,
      "create_at": "2023-01-01 00:00:00",
      "update_at": "2023-01-01 00:00:00"
    },
    "token": "jwt_token_string"
  }
  ```

  http状态码：400, 409, 500

  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```


### 2. 用户登录

- http方法：POST

- URL：http://localhost:8080/api/users/login

- 请求头：

  ```
  Content-Type: application/json
  ```

- 请求体：

  ```json
  {
    "user_name": "string",
    "password": "string"
  }
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "user": {
      "user_id": 1,
      "user_name": "string",
      "password_hash": "string",
      "email": "string",
      "user_avatar": null,
      "create_at": "2023-01-01 00:00:00",
      "update_at": "2023-01-01 00:00:00"
    },
    "token": "jwt_token_string"
  }
  ```

  http状态码：400, 401, 500

  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```

### 3. 获取所有用户

> [!IMPORTANT]
>
> 只有**管理员**可以使用这个API

- http方法：GET

- URL：http://localhost:8080/api/users

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  [
    {
      "user_id": 1,
      "user_name": "string",
      "password_hash": "string",
      "email": "string",
      "user_avatar": null,
      "create_at": "2023-01-01 00:00:00",
      "update_at": "2023-01-01 00:00:00"
    },
    {
      "user_id": 2
      "user_name": "string",
      "password_hash": "string",
      "email": "string",
      "user_avatar": null,
      "create_at": "2023-01-01 00:00:00",
      "update_at": "2023-01-01 00:00:00"
    }
  ]
  ```
  
  http状态码：401, 403, 500
  
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

### 4. 获取单个用户

- http方法：GET

- URL：http://localhost:8080/api/users/{id}

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "user_id": 1,
    "user_name": "string",
    "password_hash": "string",
    "email": "string",
    "user_avatar": null,
    "create_at": "2023-01-01 00:00:00",
    "update_at": "2023-01-01 00:00:00"
  }
  ```

  http状态码：400, 401, 403, 404, 500

  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```

### 5. 更新用户

- http方法：PUT

- URL：http://localhost:8080/api/users/{id}

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
    "user_name": "string",
    "password": "string",
    "user_avatar": "string"
  }
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "user_id": 1,
    "user_name": "string",
    "password_hash": "string",
    "email": "string",
    "user_avatar": "string",
    "create_at": "2023-01-01 00:00:00",
    "update_at": "2023-01-01 00:00:00"
  }
  ```

  http状态码：400, 401, 403, 500

  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```

### 6. 删除用户

- http方法：DELETE

- URL：http://localhost:8080/api/users/{id}

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：204

  返回体：

  ```json
  null
  ```

  http状态码：400, 401, 403, 500

  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```



## 二、项目API

### 1. 创建项目

- http方法：POST  
- URL：http://localhost:8080/api/projects  

- 请求头：
  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：
  ```json
  {
    "project_name": "string",
    "project_avatar": "string",
    "project_description": "string"
  }
  ```
  
- 预期返回： 
  http状态码：201 
  返回体：
  
  ```json
  {
    "project_id": 1,
    "user_id": 1,
    "project_name": "string",
    "project_avatar": "string",
    "project_description": "string",
    "project_size": 0,
    "create_at": "2023-01-01 00:00:00",
    "update_at": "2023-01-01 00:00:00"
  }
  ```
  
  http状态码：400, 401, 500 
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

### 2. 获取当前用户的所有项目

- http方法：GET  
- URL：http://localhost:8080/api/projects  

- 请求头：
  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回： 
  http状态码：200 
  返回体：
  
  ```json
  [
    {
      "project_id": 1,
      "user_id": 1,
      "project_name": "string",
      "project_avatar": "string",
      "project_description": "string",
      "project_size": 0,
      "create_at": "2023-01-01 00:00:00",
      "update_at": "2023-01-01 00:00:00"
    }
  ]
  ```
  
  http状态码：401, 500 
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

### 3. 获取单个项目

- http方法：GET  
- URL：http://localhost:8080/api/projects/{id}  

- 请求头：
  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回： 
  http状态码：200 
  返回体：
  
  ```json
  {
    "project_id": 1,
    "user_id": 1,
    "project_name": "string",
    "project_avatar": "string",
    "project_description": "string",
    "project_size": 0,
    "create_at": "2023-01-01 00:00:00",
    "update_at": "2023-01-01 00:00:00"
  }
  ```
  
  http状态码：400, 401, 403, 404, 500 
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

### 4. 更新项目

- http方法：PUT  
- URL：http://localhost:8080/api/projects/{id}  

- 请求头：
  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：
  ```json
  {
    "project_name": "string",
    "project_avatar": "string",
    "project_description": "string",
    "project_size": 0
  }
  ```

- 预期返回： 
  http状态码：200 
  返回体：
  
  ```json
  {
    "project_id": 1,
    "user_id": 1,
    "project_name": "string",
    "project_avatar": "string",
    "project_description": "string",
    "project_size": 0,
    "create_at": "2023-01-01 00:00:00",
    "update_at": "2023-01-01 00:00:00"
  }
  ```
  
  http状态码：400, 401, 403, 500 
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

### 5. 删除项目

- http方法：DELETE  
- URL：http://localhost:8080/api/projects/{id}  

- 请求头：
  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回： 
  http状态码：204 
  返回体：
  
  ```json
  null
  ```
  
  http状态码：400, 401, 403, 500 
  返回体：
  
  ```json
  {
    "error": "error_message"
  }
  ```

## 三、Baas 反向代理 API

> [!NOTE]
>
> 通过 LighterBaseHub 操作的 **URL** 如下，详细信息请看下方 LighterBase 文档 

### 1. 增

- URL：/:userId/:projectId/api/auto/create/{table}

### 2. 删

- URL：/:userId/:projectId/api/auto/delete/{table}

### 3. 改

- URL：/:userId/:projectId/api/auto/update/{table}

### 4. 查

- URL：/:userId/:projectId/api/auto/view/{table}?page={x}&perpage={y}

### 5. SQL 操作

- URL：/:userld/:projectId/api/create-table/create

### 6. 查看上一次SQL操作

- URL：/:userld/:projectId/api/sqls/latest

### 7. 登录

- URL：/:userld/:projectId/api/auth/login

### 8. 更新 token

- URL：/:userld/:projectId/api/auth/refresh

### 9. 获取所有权限状态

- URL：/:userld/:projectId/api/security

### 10. 更新权限规则

- URL：/:userld/:projectId/api/security/{table}



------



# LighterBase API 文档

> [!NOTE]
>
> 1. BaseURL：http://localhost:8080
> 2. 时间编码： **RFC3339 格式**
> 3. 密码哈希：均由**后端**进行哈希操作
> 4. 管理员账号：**id = 1，不能改 id ，不能删除**
> 5. 自动创建的 **users** 表：
>
> |     列名      |               约束                |
> | :-----------: | :-------------------------------: |
> |      id       | INTEGER PRIMARY KEY AUTOINCREMENT |
> |     name      |           TEXT NOT NULL           |
> | password_hash |           TEXT NOT NULL           |
> |     email     |       TEXT NOT NULL UNIQUE        |
> |    avatar     |               TEXT                |
> |   create_at   |           TEXT NOT NULL           |
> |   update_at   |           TEXT NOT NULL           |
>
> 6. 驱动用户的前端：
>    1. 创建 `./dist` 文件夹
>    2. 将所有前端静态文件放入`./dist` 文件夹中
>    3. 确保存在`./dist/index.html`
>    4. 前端代码改动无需重启应用，刷新网页即可
> 7. 更换管理员界面需重新编译程序

## 一、 自动生成模块

### 1. 增

- http方法：POST

- URL：http://localhost:8080/api/auto/create/{table}

- 请求头：
  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```
  
  > [!NOTE]
  >
  > 当{table}为users时，无需Authorization: Bearer <jwt_token>。
  
- 请求体：

  ```json
  {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
  ```
  
- 预期返回：

  http状态码：201

  返回体：

  ```json
  {
      "id": "id"
  }
  ```
  
  http状态码：400
  
  返回体：
  
  ```json
  {
    "status": 400,
    "message": "Failed to create record.",
    "data": {
      "id": {
        "code": "validation_required",
        "message": "Missing required value."
      }
    }
  }
  ```
  
  http状态码：403
  
  返回体：
  
  ```json
  {
    "status": 403,
    "message": "You are not allowed to perform this request.",
    "data": {}
  }
  ```

### 2. 删

> [!IMPORTANT]
>
> 禁止删除 **users表**  **id=1** 的记录

- http方法：DELETE

- URL：http://localhost:8080/api/auto/delete/{table}

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
      "WHERE": "value"
  }
  ```

- 预期返回：

  http状态码：204

  返回体：

  ```json
  null
  ```

  http状态码：400

  返回体：

  ```json
  {
    "status": 400,
    "message": "Failed to delete record.",
    "data": {}
  }
  
  ```

  http状态码：403

  返回体：

  ```json
  {
    "status": 403,
    "message": "Only admin can access this action.",
    "data": {}
  }
  ```

  http状态码：404

  返回体：

  ```json
  {
    "status": 404,
    "message": "The requested resource wasn't found.",
    "data": {}
  }
  ```

### 3. 改

> [!IMPORTANT]
>
> 1. 禁止修改  **users表**  **id=1** 的记录
> 2. 禁止修改 **users表 默认列**

- http方法：PUT

- URL：http://localhost:8080/api/auto/update/{table}

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
      "set": {
          "Field1": "value1",
          "Field2": "value2",
          "Field3": "value3"
      },
      "WHERE": "value"
  }
  ```

- 预期返回：

  http状态码：204

  返回体：

  ```json
  null
  ```

  http状态码：400

  返回体：

  ```json
  {
    "status": 400,
    "message": "Failed to update record.",
    "data": {
      "id": {
        "code": "validation_required",
        "message": "Missing required value."
      }
    }
  }
  ```

  http状态码：403

  返回体：

  ```json
  {
    "status": 403,
    "message": "You are not allowed to perform this request.",
    "data": {}
  }
  ```

  http状态码：404

  返回体：

  ```json
  {
    "status": 404,
    "message": "The requested resource wasn't found.",
    "data": {}
  }
  ```

### 4. 查

- http方法：POST

- URL：http://localhost:8080/api/auto/view/{table}?page={x}&perpage={y}

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "value"
  }
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "page": 1,
    "perPage": 30,
    "totalPages": 1,
    "totalItems": 2,
    "items": [
      {
          "Field1": "value1",
          "Field2": "value2",
          "Field3": "value3"
      },
      {
          "Field1": "value1",
          "Field2": "value2",
          "Field3": "value3"
      }
    ]
  }
  ```

  http状态码：400

  返回体：

  ```json
  {
    "status": 400,
    "message": "Something went wrong while processing your request. Invalid filter.",
    "data": {}
  }
  
  ```

  http状态码：403

  返回体：

  ```json
  {
    "status": 403,
    "message": "You are not allowed to perform this request.",
    "data": {}
  }
  ```

  http状态码：404

  返回体：

  ```json
  {
    "status": 404,
    "message": "The requested resource wasn't found.",
    "data": {}
  }
  ```



## 二、 用户表操作 API

### 1. SQL 操作

> [!IMPORTANT]
>
> 只有**管理员**可以执行这个API

- http方法：POST

- URL：http://localhost:8080/api/create-table/create

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
      "SQL": "value"
  }
  ```

- 预期返回：

  http状态码：201

  返回体：

  ```json
  {
      "SQL": "value"
  }
  ```

  http状态码：400

  返回体：

  ```json
  {
    "status": 400,
    "message": "Failed to create table.",
    "data": {}
  }
  ```

### 2. 查看上一次SQL操作

> [!IMPORTANT]
>
> 只有**管理员**可以执行这个API

- http方法：GET

- URL：http://localhost:8080/api/sqls/latest

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
      "ID": "value1",
      "sql": "value2"
  }
  ```
  



## 三、 JWT

### 1. 登录

- http方法：POST

- URL：http://localhost:8080/api/auth/login

- 请求头：

  ```
  Content-Type: application/json
  ```

- 请求体：

  ```json
  {
      "name": "value1",
      "password_hash": "value2"
  }
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "token": "JWT_TOKEN",
    "expire": "value1",
    "record": {
      "id": "value2",
      "email": "value3",
      "name": "value4",
      "created": "value5",
      "updated": "value6"
    }
  }
  ```

  http状态码：400

  返回体：

  ```json
  {
    "status": 400,
    "message": "Failed to authenticate.",
    "data": {
      "identity": {
        "code": "validation_required",
        "message": "Missing required value."
      }
    }
  }
  ```

### 2. 更新 token

- http方法：POST

- URL：http://localhost:8080/api/auth/refresh

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "token": "JWT_TOKEN",
    "expire": "value1",
    "record": {
      "id": "value2",
      "email": "value3",
      "name": "value4",
      "created": "value5",
      "updated": "value6"
    }
  }
  ```

  http状态码：401

  返回体：

  ```json
  {
    "status": 401,
    "message": "The request requires valid record authorization token to be set.",
    "data": {}
  }
  ```

  http状态码：403

  返回体：

  ```json
  {
    "status": 403,
    "message": "The authorized record model is not allowed to perform this action.",
    "data": {}
  }
  ```

  http状态码：404

  返回体：

  ```json
  {
    "status": 404,
    "message": "Missing auth record context.",
    "data": {}
  }
  ```



## 四、权限管理API

> [!IMPORTANT]
>
> 1. 只有**管理员**可以执行以下三个API
>
> 2. 当有新建的表时，后端会**自动新建**这个表的**空白权限记录**
>
> 3. 底层执行：
>
>    ```sqlite
>    SELECT EXISTS(SELECT 1 FROM "<table>" WHERE <权限设置>)
>    ```
>
>    - 返回1：放行
>    - 返回0：`403 Forbidden`
>
> 4. `@uid`是唯一一个变量，功能是从JWT里提取当前用户的id

### 1. 获取所有权限状态

- http方法：GET

- URL：http://localhost:8080/api/security

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  [
    {
      "id": 1,
      "table_name": "users",
      "create_where": "value1",
      "delete_where": "value2",
      "update_where": "value3",
      "view_where": "value4"
    },
    {
      "id": 2,
      "table_name": "value5",
      "create_where": "value6",
      "delete_where": "value7",
      "update_where": "value8",
      "view_where": "value9"
    }
  ]
  ```
  
  http状态码：400
  
  返回体：
  
  ```json
  {
    "status": 400,
    "message": "Failed to authenticate.",
    "data": {
      "identity": {
        "code": "validation_required",
        "message": "Missing required value."
      }
    }
  }
  ```

### 2. 更新权限规则

- http方法：PUT

- URL：http://localhost:8080/api/security/{table}

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
      "create_where": "value1",
      "delete_where": "value2",
      "update_where": "value3",
      "view_where": "value4"
  }
  ```

- 预期返回：

  http状态码：204

  返回体：

  ```json
  null
  ```



## 五、其他查询

> [!IMPORTANT]
>
> 这里所有 API 都只有**管理员**可用

### 1. 查询所有表名

- http方法：GET

- URL：http://localhost:8080/api/query/tables

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
    "tables": [
      "users",
      "value2",
      "value3"
    ]
  }
  ```

  

