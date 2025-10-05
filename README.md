# API 文档

> [!NOTE]
>
> BaseURL：http://localhost:8080
>

## 一、 自动生成模块

### 1. 增

- http方法：POST / OPTIONS

- URL：http://localhost:8080/api/auto/create/{table}

- 请求头：
  ```
  Content-Type: application/json
  ```
  
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

- http方法：DELETE / OPTIONS

- URL：http://localhost:8080/api/auto/delete/{table}

- 请求头：

  ```
  Content-Type: application/json
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

- http方法：PUT / OPTIONS

- URL：http://localhost:8080/api/auto/update/{table}

- 请求头：

  ```
  Content-Type: application/json
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

  http状态码：200

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

- http方法：GET / OPTIONS

- URL：http://localhost:8080/api/auto/view/{table}?page=x&perpage=y

- 请求头：

  ```
  Content-Type: application/json
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

## 

## 二、 用户建表API

### 1. 建表

- http方法：POST / OPTIONS

- URL：http://localhost:8080/api/create-table/create/

- 请求头：

  ```
  Content-Type: application/json
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

  

  
