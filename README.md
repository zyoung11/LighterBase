# API 文档

## 启动

```bash
# LighterBase

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/app/LighterBase

# 2. 一键启动（默认端口 8080）
./LighterBase
```

```bash
# LighterBaseHub

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/web/LighterBaseHub

# 2. 一键启动（默认端口 8080）
./LighterBaseHub
```

# LighterBase API 文档

> [!NOTE]
>
> 1. BaseURL: http://localhost:8080/1/:projectId/api
>
> 2. 驱动用户的前端：
>
>    1. 创建 `./dist` 文件夹
>
>    2. 将所有前端静态文件放入 `./dist` 文件夹中
>
>    3. 确保存在 `./dist/index.html`
>
>    4. 前端代码改动无需重启应用，刷新网页即可
>
> 3. 程序本身只能注册一个管理员账号
> 4.  **无团队协作功能**
> 5.  **无程序下载功能**
> 6.  **其余 API 与 LighterBaseHub 相同**

# LighterBaseHub API 文档

> [!NOTE]
>
> BaseURL: http://localhost:8080/:userId/:projectId/api

## 一、用户API

### 1. 用户注册

- http方法：**POST**

- URL：`/users/register`

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

- http方法：**POST**

- URL：`/users/login`

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
> 只有**管理员和高权限成员**可以使用这个API

- http方法：**GET**

- URL：`/users`

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

- http方法：**GET**

- URL：`/users/:id`

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

- http方法：**PUT**

- URL：`/users/:id`

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

- http方法：**DELETE**

- URL：`/users/:id`

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

### 7. 检查是否已经注册

- http方法：**GET**

- URL：`/users/check/init`

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
      "init": true
  }
  ```

  http状态码：500

## 二、项目API

### 1. 创建项目

- http方法：**POST**  
- URL：`/projects`

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
  
- 预期返回： notification.UpdateAt.String
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

- http方法：**GET**  
- URL：`/projects`

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

- http方法：**GET**  
- URL：`/projects/:id`

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

- http方法：**PUT**  
- URL：`/projects/:id`

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

- http方法：**DELETE**  
- URL：`/projects/:id`

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

### 5. 下载项目

- http方法：**GET**  

- URL：`/projects/download/:id`

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回： 
  http状态码：206 
  返回体：

  ```json
  null
  ```

  http状态码：400, 401, 403, 404, 500 
  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```

### 6. 获取项目数据库表结构

- http方法：**GET**  
- URL：`/projects/sql/:id`

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

## 三、下载 API

### 1. 下载 App

- http方法：**GET**  

- URL：`/download/app/:os` 

  > /:os 选项：`/windows` 或 `/linux`

- 请求头：

  ```
  null
  ```

- 预期返回： 
  http状态码：206 
  返回体：

  ```json
  null
  ```

  http状态码：400, 404
  返回体：

  ```json
  {
    "error": "error_message"
  }
  ```

## 四、Baas API

> [!NOTE]
>
> 1. BaseURL：http://localhost:8080/:user_id/:project_id/api
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

## 1. 自动生成模块

### 1.1 增

- http方法：**POST**

- URL：`/auto/create/:table`

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

##  1.2 删

> [!IMPORTANT]
>
> 禁止删除 **users表**  **id=1** 的记录

- http方法：**DELETE**

- URL：`/auto/delete/:table`

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

### 1.3 改

> [!IMPORTANT]
>
> 1. 禁止修改  **users表**  **id=1** 的记录
> 2. 禁止修改 **users表 默认列**

- http方法：**PUT**

- URL：`/auto/update/:table`

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

### 1.4 查

- http方法：**POST**

- URL：`/auto/view/:table?page={x}&perpage={y}`

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



## 2. 用户表操作 API

### 2.1 SQL  表操作

> [!IMPORTANT]
>
> 只有**管理员和高权限成员**可以执行这个API

- http方法：**POST**

- URL：`/create-table/create`

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

### 2.2 查看上一次 SQL 表操作

> [!IMPORTANT]
>
> 只有**管理员和高权限成员**可以执行这个API

- http方法：**GET**

- URL：`/sqls/latest`

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
      "ID": 0,
      "sql": "value1"
  }
  ```
  

### 2.3 查看历史 SQL 表操作

> [!IMPORTANT]
>
> 只有**管理员和高权限成员**可以执行这个API

- http方法：**GET**

- URL：`/sqls/history`

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
          "ID": 0,
          "sql": "value1"
      },
      {
          "ID": 1,
          "sql": "value2"
      }
  ]
  ```

## 3. JWT

### 3.1 登录

- http方法：**POST**

- URL：`/auth/login`

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

### 3.2 更新 token

- http方法：**POST**

- URL：`/auth/refresh`

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



## 4. 权限管理API

> [!IMPORTANT]
>
> 1. 只有**管理员和高权限成员**可以执行以下三个API
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
>
> 5. 特殊规定：
>
>    - `xxx_where: "@uid"` 表示只容许登录状态的请求
>    - `xxx_where: ""` 表示容许所有请求
>

### 4.1 获取所有权限状态

- http方法：**GET**

- URL：`/security`

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

### 4.2 更新权限规则

- http方法：**PUT**

- URL：`/security/:table`

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

## 5. 团队协作通知系统API

### 5.1 发送邀请

- http方法：**POST**

- URL：`/team`

- 请求头：

  ```
  Content-Type: application/json
  Authorization: Bearer <jwt_token>
  ```

- 请求体：

  ```json
  {
    "projectId": "value1",
    "permissions": "value2",
    "email": "value3"
  }
  ```

1. **projectId: **邀请成员来的自己的项目id
2. **permissions: **邀请成员为高权限成员或只读成员，可选 `admin` 或 `readonly`
3. **email: **要邀请的成员在网站注册使用的邮箱

### 5.2 查询用户发送的日志

- http方法：**GET**

- URL：`/team/send/:status`

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
       	"notification_id": 0,
  		"sender_id":       0,
  		"receiver_id":     0,
  		"project_id":      0,
  		"content":         "value1",
  		"status":          "value2",
  		"create_at":       "value3",
  		"update_at":       "value4"
      }
  ]
  ```

  | **/:status** 选项 | 功能                                 |
  | ----------------- | ------------------------------------ |
  | `/all`            | 获取该用户发送的所有邀请             |
  | `/agree`          | 获取该用户发送的所有的已经同意的邀请 |
  | `/disagree`       | 获取该用户发送的所有的不同意的邀请   |
  | `/pending`        | 获取该用户发送的所有的待同意的邀请   |

### 5.3 查询用户接收的日志

- http方法：**GET**

- URL：`/team/receive/:status`

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
       	"notification_id": 0,
  		"sender_id":       0,
  		"receiver_id":     0,
  		"project_id":      0,
  		"content":         "value1",
  		"status":          "value2",
  		"create_at":       "value3",
  		"update_at":       "value4"
      }
  ]
  ```

  | **/:status** 选项 | 功能                                 |
  | ----------------- | ------------------------------------ |
  | `/all`            | 获取该用户发送的所有邀请             |
  | `/agree`          | 获取该用户发送的所有的已经同意的邀请 |
  | `/disagree`       | 获取该用户发送的所有的不同意的邀请   |
  | `/pending`        | 获取该用户发送的所有的待同意的邀请   |

### 5.4 确认邀请

- http方法：**PUT**

- URL：`/team/confirm/:notificationId/:status`

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

  | **/:status** 选项 | 功能       |
  | ----------------- | ---------- |
  | `/agree`          | 同意邀请   |
  | `disagree`        | 不同意邀请 |

## 6. 其他查询

> [!IMPORTANT]
>
> 这里所有 API 都只有**管理员和高权限成员**可用

### 6.1 查询所有表名

- http方法：**GET**

- URL：`/query/tables`

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

### 6.2 查询日志

- http方法：**GET**

- URL：`/query/logs?page={x}&perpage={y}`

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  ```

- 预期返回：

  http状态码：200

  返回体：

  ```json
    {
      "page": 1,
      "perPage": 30,
      "totalPages": 3,
      "totalItems": 75,
      "logs": [
        {
          "id": 75,
          "log_text": "2025-01-15 10:30:45 127.0.0.1:54321 200 - GET /api/health",
          "created_at": "2025-01-15 10:30:45"
        },
        {
          "id": 74,
          "log_text": "2025-01-15 10:30:40 127.0.0.1:54320 404 - GET /api/nonexistent",
          "created_at": "2025-01-15 10:30:40"
        }
      ]
    }
  ```

- 预期返回：

  http状态码：401

  返回体：

  ```json
    {
      "status": 401,
      "message": "The request requires valid record authorization token to be set.",
      "data": {}
    }
  ```

- 预期返回：

  http状态码：403

  返回体：

  ```json
    {
      "status": 403,
      "message": "You are not allowed to perform this request.",
      "data": {}
    }
  ```

- 预期返回：

  http状态码：500

  返回体：

  ```json
    {
      "status": 500,
      "message": "Failed to count logs.",
      "data": {
        "database_error": "database is locked"
      }
    }
  ```

### 6.3 搜索日志

- http方法：**POST**

- URL：`/search/logs?page={x}&perpage={y}`

- 请求头：

  ```
  Authorization: Bearer <jwt_token>
  Content-Type: application/json
  ```

- 请求体：

  ```json
  {
      "query": "搜索关键词"
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
      "totalItems": 5,
      "query": "搜索关键词",
      "logs": [
          {
              "id": 1,
              "log_text": "包含搜索关键词的日志内容",
              "created_at": "2023-01-01 12:00:00"
          }
      ]
  }
  ```

### 6.4 检查是否已经注册

- http方法：**GET**

- URL：`/auth/init`

- 预期返回：

  http状态码：200

  返回体：

  ```json
  {
      "init": true
  }
  ```

  http状态码：500
