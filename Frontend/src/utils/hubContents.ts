const docs = {
intro : `

<h2 class="text-2xl font-semibold mb-4 text-white"> LighterBase 介绍</h2>

<p style="font-size: 1.1em; line-height: 1.6; color: white; margin-bottom: 30px;">一站式后端即服务（BaaS）平台，支持多租户、自动 CRUD、JWT 认证、权限管理、SQL 执行与反向代理。前端只需丢进 dist/ 文件夹即可上线，后端一条命令即可启动整个服务。</p>

<hr style="border: none; height: 2px; background-color: #ecf0f1; margin: 40px 0;">

<h2 class="text-2xl font-semibold mb-4 text-white"> 项目简介</h2>

<p style="font-size: 1.1em; line-height: 1.6; color: white; margin-bottom: 20px;">LighterBaseHub 是 LighterBase 的多租户管理面板：</p>

<ul style="list-style-type: disc; padding-left: 20px; margin-bottom: 20px;">
<li style="margin-bottom: 10px; color: white;">用户注册 / 登录 / JWT 续签</li>
<li style="margin-bottom: 10px; color: white;">创建项目 → 自动分配端口 → 启动独立 LighterBase 实例</li>
<li style="margin-bottom: 10px; color: white;">反向代理所有子实例 API，统一入口 http://localhost:8080/{userId}/{projectId}/*</li>
<li style="margin-bottom: 10px; color: white;">管理员可执行任意 SQL、查看全站日志、管理权限策略</li>
</ul>

<p style="font-size: 1.1em; line-height: 1.6; color: white; margin-bottom: 30px;">每个项目 = 独立进程 + 独立 SQLite 数据库 + 独立端口，互不干扰。</p>

<hr style="border: none; height: 2px; background-color: #ecf0f1; margin: 40px 0;">

<h2 class="text-2xl font-semibold mb-4 text-white"> 启动指南</h2>

\`\`\`bash
# LighterBase

# 1. 下载 release 或直接 clone

git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/app/LighterBase

# 2. 一键启动（默认端口 8080 + 8090）

./LighterBase
\`\`\`

<hr style="border: none; height: 1px; background-color: #bdc3c7; margin: 20px 0;">

\`\`\`bash
# LighterBaseHub

# 1. 下载 release 或直接 clone
git clone https://github.com/zyoung11/LighterBase.git
cd LighterBase/Backend/web/LighterBaseHub

# 2. 一键启动（默认端口 8080 + 8090）
./LighterBaseHub
\`\`\`

<p style="font-size: 1.1em; line-height: 1.6; color: white; margin-bottom: 20px;">服务就绪后</p>

<ul style="list-style-type: disc; padding-left: 20px;">
<li style="margin-bottom: 10px; color: white;">管理后台 & 前端：http://localhost:8090</li>
<li style="margin-bottom: 10px; color: white;">后端 API 入口：http://localhost:8080</li>
</ul>

`,
install: `
\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');
\`\`\`
`,
tutorials: `
<h2 class="text-2xl font-semibold mb-4 text-white">📚 教程</h2>

<p class="text-white mb-4">LighterBase 主工作区分为"数据库管理、日志管理、文件管理与设置"四个模块。下面详细介绍每个模块的使用方法。</p>

<h3 class="text-xl font-semibold mb-3 text-white">🗄️ 数据库管理</h3>

<h4 class="text-lg font-medium mb-2 text-white">数据库创建模块</h4>
<p class="text-white mb-2">1. 在 SQL 输入栏中，按照标准的 SQL 语法输入 CREATE TABLE 语句，例如：</p>
<pre class="bg-gray-800 text-white p-2 rounded mb-2"><code>CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);</code></pre>
<p class="text-white mb-2">2. 按回车键提交，语句将发送到渲染窗口，通过 GOJS 技术实时渲染 E-R 图。您可以拖拽图中的元素来调整布局。</p>
<p class="text-white mb-2">3. 如果您不熟悉 SQL 语法，我们集成了 GLM 大语言模型。在 AI 提问框中描述您的需求（如"创建一个用户表，包含姓名和邮箱"），AI 会生成相应的 SQL 语句。</p>
<p class="text-white mb-2">4. 确认 SQL 正确后，点击"确认"按钮提交到服务端，建立数据库表结构。</p>
<p class="text-red-400 font-semibold">重要提醒：表结构提交后无法修改，请仔细检查后再确认！</p>

<h4 class="text-lg font-medium mb-2 text-white">权限管理模块</h4>
<p class="text-white mb-2">1. 在权限管理界面，选择要设置权限的表和字段。</p>
<p class="text-white mb-2">2. 点击相应的单元格，在弹出的输入框中输入权限设置。</p>
<p class="text-white mb-2">3. 使用 "WHERE = ?" 的 SQL 条件语法，例如 "id = 1" 来指定权限范围。</p>
<p class="text-white mb-2">4. 保存设置后，权限将立即生效。</p>

<h3 class="text-xl font-semibold mb-3 text-white">📋 日志管理</h3>
<p class="text-white mb-2">1. 在日志管理页面顶部，输入关键词进行模糊搜索（如"error"或特定时间戳）。</p>
<p class="text-white mb-2">2. 浏览搜索结果，点击任意日志条目查看详细内容，包括时间戳、级别。</p>
<p class="text-white mb-2">3. 要导出日志，选择一个或多个日志条目，点击"确认"按钮，系统会生成包含选中日志的 CSV 文件。</p>
<p class="text-white mb-2">4. 日志文件可用于故障排查和系统监控。</p>

<h3 class="text-xl font-semibold mb-3 text-white">📁 文件管理</h3>
<p class="text-white mb-2">1. 进入文件管理模块，选择要查看的数据库表。</p>
<p class="text-white mb-2">2. 系统以表格形式显示该表的所有数据记录，包括所有字段和值。</p>
<p class="text-white mb-2">3. 点击任意单元格，系统会以窗口模式显示该单元格的内容。</p>
<p class="text-white mb-2">4. 要复制数据，点击菜单的"复制"选项，可以复制选中的内容。</p>

<h3 class="text-xl font-semibold mb-3 text-white">⚙️ 设置</h3>

<h4 class="text-lg font-medium mb-2 text-white">AI 模块</h4>
<p class="text-white mb-2">1. 在设置页面的 AI 模块，查看当前配置的 AI 模型信息。</p>
<p class="text-white mb-2">2. 检查 AI 服务的连接状态和运行状况。</p>
<p class="text-white mb-2">3. 如果 AI 服务异常，可以在这里重新配置或联系管理员。</p>

<h4 class="text-lg font-medium mb-2 text-white">Account 模块</h4>
<p class="text-white mb-2">1. 点击设置页面中的 Account 选项卡。</p>
<p class="text-white mb-2">2. 要修改密码，输入当前密码和新密码，点击"修改密码"。</p>
<p class="text-white mb-2">3. 系统会验证密码强度并确认修改。</p>
<p class="text-white mb-2">4. 要登出账号，点击"登出"按钮，系统会清除会话并返回登录页面。</p>
<p class="text-white mb-2">5. 出于安全考虑，定期修改密码是一个好习惯。</p>
`,
installOps: {
  create: `
<h3 class="text-xl text-white mb-3">➕ 向<span class="text-orange-400">table_name</span>表中插入数据</h3>

\`\`\`javascript
const payload = {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
//替换json数据包与表名来新增据数据
const insertData = await lb.insertTable(payload, "table_name");
\`\`\`

<span class ="text-xl mt-3">详细API:</span>
<div class="bg-[#DCEEF3] p-2 rounded mb-3"> 
  <span class="bg-[#2C2F2F] text-white rounded-lg p-1 mr-4">POST</span>
  <span class="text-black">/api/auto/create/table_name<span>
</div>
<span class ="text-xl">请求头:</span>

\`\`\`md
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
> 当 table 为 users 时，无需 Authorization。
\`\`\`

<span class ="text-xl">请求体:</span>

\`\`\`json
  {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
\`\`\`

<span class ="text-xl">响应:</span>
<div  class="response-btn-bar flex gap-2 mb-2">
  <button data-status="insert-201" class="px-3 py-1 text-sm text-black rounded response-btn active bg-[#DCEEF3]">201 Created</button>
  <button data-status="insert-400" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">400 Bad Request</button>
  <button data-status="insert-403" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">403 Forbidden</button>
</div>

<div class="response-content-box">
  <div data-status-content="insert-201" class="response-content-item block">

\`\`\`json
{
    "id": "id"
}
\`\`\`

  </div>
  <div data-status-content="insert-400" class="response-content-item hidden">

\`\`\`json
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
\`\`\`

  </div>
  <div data-status-content="insert-403" class="response-content-item hidden">

\`\`\`json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
\`\`\`

  </div>
</div>
`,

  delete: `
<h3 class="text-xl text-white mb-3">🗑️ 从<span class="text-orange-400">table_name</span>表中删除数据</h3>

\`\`\`javascript
const payload = {
      "WHERE": "id = 42"
  }
// 删除满足条件的记录（禁止删除 users 表 id=1 的记录）
const deleteData = await lb.deleteTable(payload, "table_name");
\`\`\`

<span class ="text-xl mt-3">详细API:</span>
<div class="bg-[#FAD2D2] p-2 rounded mb-3"> 
  <span class="bg-red-600 text-white rounded-lg p-1 mr-4">DELETE</span>
  <span class="text-black">/api/auto/delete/table_name<span>
</div>
<span class ="text-xl">请求头:</span>

\`\`\`md
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
\`\`\`

<span class ="text-xl">请求体:</span>

\`\`\`json
  {
      "WHERE": "id = 42"
  }
\`\`\`

<span class ="text-xl">响应:</span>
<div  class="response-btn-bar flex gap-2 mb-2">
  <button data-status="delete-204" class="px-3 py-1 text-sm text-black rounded response-btn active bg-[#DCEEF3]">204 No Content</button>
  <button data-status="delete-400" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">400 Bad Request</button>
  <button data-status="delete-403" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">403 Forbidden</button>
  <button data-status="delete-404" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">404 Not Found</button>
</div>

<div class="response-content-box">
  <div data-status-content="delete-204" class="response-content-item block">

\`\`\`json
null
\`\`\`

  </div>
  <div data-status-content="delete-400" class="response-content-item hidden">

\`\`\`json
{
  "status": 400,
  "message": "Failed to delete record.",
  "data": {}
}
\`\`\`

  </div>
  <div data-status-content="delete-403" class="response-content-item hidden">

\`\`\`json
{
  "status": 403,
  "message": "Only admin can access this action.",
  "data": {}
}
\`\`\`

  </div>
  <div data-status-content="delete-404" class="response-content-item hidden">

\`\`\`json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
\`\`\`

  </div>
</div>
`,

  update: `
<h3 class="text-xl text-white mb-3">✏️ 在<span class="text-orange-400">table_name</span>表中更新数据</h3>

\`\`\`javascript
const payload = {
      "set": {
          "Field1": "newValue1",
          "Field2": "newValue2"
      },
      "WHERE": "id = 42"
  }
// 更新满足条件的记录（禁止更新 users 表 id=1 或默认列）
const updateData = await lb.updateTable(payload, "table_name");
\`\`\`

<span class ="text-xl mt-3">详细API:</span>
<div class="bg-[#D1E9F8] p-2 rounded mb-3"> 
  <span class="bg-blue-600 text-white rounded-lg p-1 mr-4">PUT</span>
  <span class="text-black">/api/auto/update/table_name<span>
</div>
<span class ="text-xl">请求头:</span>

\`\`\`md
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
\`\`\`

<span class ="text-xl">请求体:</span>

\`\`\`json
  {
      "set": {
          "Field1": "newValue1",
          "Field2": "newValue2"
      },
      "WHERE": "id = 42"
  }
\`\`\`

<span class ="text-xl">响应:</span>
<div  class="response-btn-bar flex gap-2 mb-2">
  <button data-status="update-204" class="px-3 py-1 text-sm text-black rounded response-btn active bg-[#DCEEF3]">204 No Content</button>
  <button data-status="update-400" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">400 Bad Request</button>
  <button data-status="update-403" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">403 Forbidden</button>
  <button data-status="update-404" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">404 Not Found</button>
</div>

<div class="response-content-box">
  <div data-status-content="update-204" class="response-content-item block">

\`\`\`json
null
\`\`\`

  </div>
  <div data-status-content="update-400" class="response-content-item hidden">

\`\`\`json
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
\`\`\`

  </div>
  <div data-status-content="update-403" class="response-content-item hidden">

\`\`\`json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
\`\`\`

  </div>
  <div data-status-content="update-404" class="response-content-item hidden">
  
\`\`\`json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
\`\`\`

  </div>
</div>
`,

  search: `
<h3 class="text-xl text-white mb-3">🔍 从<span class="text-orange-400">table_name</span>表中查询数据</h3>

\`\`\`javascript
const payload = {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "status = 'active'"
  }
// 分页查询，page 与 perpage 为可选参数
const searchData = await lb.searchTable(payload, "table_name", 1, 30);
\`\`\`

<span class ="text-xl mt-3">详细API:</span>
<div class="bg-[#E2F1E8] p-2 rounded mb-3"> 
  <span class="bg-green-600 text-white rounded-lg p-1 mr-4">POST</span>
  <span class="text-black">/api/auto/view/table_name?page=1&perpage=30<span>
</div>
<span class ="text-xl">请求头:</span>

\`\`\`md
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
\`\`\`

<span class ="text-xl">请求体:</span>

\`\`\`json
  {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "status = 'active'"
  }
\`\`\`

<span class ="text-xl">响应:</span>
<div  class="response-btn-bar flex gap-2 mb-2">
  <button data-status="search-200" class="px-3 py-1 text-sm text-black rounded response-btn active bg-[#DCEEF3]">200 OK</button>
  <button data-status="search-400" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">400 Bad Request</button>
  <button data-status="search-403" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">403 Forbidden</button>
  <button data-status="search-404" class="px-3 py-1 text-sm text-black rounded response-btn bg-gray-300 hover:bg-gray-400">404 Not Found</button>
</div>

<div class="response-content-box">
  <div data-status-content="search-200" class="response-content-item block">

\`\`\`json
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
\`\`\`

  </div>
  <div data-status-content="search-400" class="response-content-item hidden">

\`\`\`json
{
  "status": 400,
  "message": "Something went wrong while processing your request. Invalid filter.",
  "data": {}
}
\`\`\`

  </div>
  <div data-status-content="search-403" class="response-content-item hidden">

\`\`\`json
{
  "status": 403,
  "message": "You are not allowed to perform this request.",
  "data": {}
}
\`\`\`

  </div>
  <div data-status-content="search-404" class="response-content-item hidden">

\`\`\`json
{
  "status": 404,
  "message": "The requested resource wasn't found.",
  "data": {}
}
\`\`\`

  </div>
</div>
`,
}
}


export default docs
