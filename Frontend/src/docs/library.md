<h2 style="font-weight: bold; font-size: 1.5em;">📚 库使用</h2>

<h3 style="font-weight: bold; font-size: 1.3em;">📦 安装</h3>

```javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');
```

<h3 style="font-weight: bold; font-size: 1.3em;">🔧 API 操作</h3>

<h4 id="install-create-section" style="font-weight: bold; font-size: 1.2em;">➕ 向 table_name 表中插入数据</h4>

```javascript
const payload = {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
//替换json数据包与表名来新增据数据
const insertData = await lb.insertTable(payload, "table_name");
```

**详细API:** POST /api/auto/create/table_name

**请求头:**

```
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
> 当 table 为 users 时，无需 Authorization。
```

**请求体:**

```json
  {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
```

**响应:**

- 201 Created

```json
{
    "id": "id"
}
```

- 400 Bad Request

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

- 403 Forbidden

```json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
```

<h4 id="install-delete-section" style="font-weight: bold; font-size: 1.2em;">🗑️ 从 table_name 表中删除数据</h4>

```javascript
const payload = {
      "WHERE": "id = 42"
  }
// 删除满足条件的记录（禁止删除 users 表 id=1 的记录）
const deleteData = await lb.deleteTable(payload, "table_name");
```

**详细API:** DELETE /api/auto/delete/table_name

**请求头:**

```
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

**请求体:**

```json
  {
      "WHERE": "id = 42"
  }
```

**响应:**

- 204 No Content

```json
null
```

- 400 Bad Request

```json
{
  "status": 400,
  "message": "Failed to delete record.",
  "data": {}
}
```

- 403 Forbidden

```json
{
  "status": 403,
  "message": "Only admin can access this action.",
  "data": {}
}
```

- 404 Not Found

```json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
```

<h4 id="install-update-section" style="font-weight: bold; font-size: 1.2em;">✏️ 在 table_name 表中更新数据</h4>

```javascript
const payload = {
      "set": {
          "Field1": "newValue1",
          "Field2": "newValue2"
      },
      "WHERE": "id = 42"
  }
// 更新满足条件的记录（禁止更新 users 表 id=1 或默认列）
const updateData = await lb.updateTable(payload, "table_name");
```

**详细API:** PUT /api/auto/update/table_name

**请求头:**

```
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

**请求体:**

```json
  {
      "set": {
          "Field1": "newValue1",
          "Field2": "newValue2"
      },
      "WHERE": "id = 42"
  }
```

**响应:**

- 204 No Content

```json
null
```

- 400 Bad Request

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

- 403 Forbidden

```json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
```

- 404 Not Found

```json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
```

<h4 id="install-search-section" style="font-weight: bold; font-size: 1.2em;">🔍 从 table_name 表中查询数据</h4>

```javascript
const payload = {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "status = 'active'"
  }
// 分页查询，page 与 perpage 为可选参数
const searchData = await lb.searchTable(payload, "table_name", 1, 30);
```

**详细API:** POST /api/auto/view/table_name?page=1&perpage=30

**请求头:**

```
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

**请求体:**

```json
  {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "status = 'active'"
  }
```

**响应:**

- 200 OK

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

- 400 Bad Request

```json
{
  "status": 400,
  "message": "Something went wrong while processing your request. Invalid filter.",
  "data": {}
}
```

- 403 Forbidden

```json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
```

- 404 Not Found

```json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
```