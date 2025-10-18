import apiIcon from "../icons/api白.svg";
import message_light from "../icons/message_light.svg";
import confirm from "../icons/勾白.svg";
const sidebarContent = {
  logo: `
                <div class="space-y-3">
                    <p class="text-sm text-gray-400">数据库管理系统 v1.0</p>
                    <p class="text-sm text-gray-400">已连接用户: admin</p>
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        系统设置
                    </button>
                </div>
            `,
  settings: `
                <div class="space-y-3">
                    <button id="ai-settings" class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        AI
                    </button>
                    <button id="account-settings" class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        Account
                    </button>
                </div>
            `,
  //   records:             `
  //                             <div class="text-gray-300">
  //                                 <p class="mb-2"><strong>查询语句:</strong></p>
  //                                 <p class="bg-[#2B2F31] p-3 rounded">${
  //                                   this.querySelector("p").textContent
  //                                 }</p>
  //                                 <p class="mt-4 mb-2"><strong>执行时间:</strong></p>
  //                                 <p>${date} 14:30:25</p>
  //                                 <p class="mt-4 mb-2"><strong>执行结果:</strong></p>
  //                                 <p class="text-green-400">成功返回 2 行数据</p>
  //                             </div>
  //                         `,
  folder: `
    <div class="flex flex-col h-full">
      <div class="text-xs uppercase tracking-wide text-gray-500 mb-3">表列表</div>
      <div id="folder-table-list" class="flex-1 overflow-y-auto space-y-1 pr-1">
        <!-- 动态表名按钮会插到这里 -->
      </div>
    </div>
  `,
  database: `
                <div class="space-y-3">
                    <button id="create-db" class="w-full mb-3 px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        Create DB
                    </button>
                    <button id="permissions" class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        Permissions
                    </button>
                </div>
            `,
};

const workspaceContent = {
  database: `
                <div class="flex-1 flex flex-col">
                    <!-- 上部分：显示区域 (60% 高度) -->
                    <div class="h-[60%]  p-6 relative">
                        <div id="mount" class="h-full bg-[#15151D] border-2 border-dashed border-[#2B2F31] rounded-lg flex items-center justify-center">
                            
                        </div>
                        <!-- API文档按钮 -->
                        <button id="api-docs-btn" class="absolute right-4 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded transition-colors z-10">
                            <img src ="${apiIcon}" class ="w-8 h-6 object-contain" alt="API文档">
                        </button>
                    </div>

                    <!-- 下部分：SQL输入区域 (40% 高度) -->
                    <div class="h-[40%] p-6 relative flex items-center space-x-4 justify-center"> 
                        <textarea 
                            id="sql-input"
                            class="w-[80%] h-full bg-[#2B2F31] border border-[#2B2F31] rounded-lg p-4 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-[#4a4f52]"
                            placeholder="在这里输入SQL查询..."
                        ></textarea>
                        <div class ="flex flex-col">
                        <button id="ai-generated" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors mb-4">
                            <img src ="${message_light}" class ="w-8 h-8 object-contain" alt="AI-generated">
                        </button>
                        <button id="sql-send" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors">
                            <img src ="${confirm}" class ="w-8 h-8 object-contain" alt="确认">
                        </button>
                        </div>
                    </div>
                </div>
            `,
  permissions: `
        <div class="bg-[#1B1E1F] p-6 h-full flex flex-col">
            <h3 class="text-lg font-semibold mb-4">数据库表权限管理</h3>

            <div class="h-2/3 overflow-y-auto mb-4 border rounded-lg border-gray-700" >
                <table id="permissions-table" class="min-w-full bg-[#2B2F31] rounded-lg">
                    <thead>
                        <tr class="border-b border-gray-600">
                            <th class="px-4 py-3 text-left w-1/5">Table</th>
                            <th class="px-4 py-3 text-left">Create</th>
                            <th class="px-4 py-3 text-left">Delete</th>
                            <th class="px-4 py-3 text-left">Update</th>
                            <th class="px-4 py-3 text-left">View</th>
                        </tr>
                    </thead>
                    <tbody id="permissions-table-body" >
                    </tbody>
                </table>
            </div>

            <div id="permissions-input-area" class="w-[60%] mt-4 p-4 bg-[#2B2F31] rounded-lg flex-1 mx-auto">
            </div>

        </div>
    `,
  folder: `
    <div class="flex-1 bg-[#1B1E1F] flex items-center justify-center">
      <div class="text-gray-500 text-sm">请点击左侧表名查看数据</div>
    </div>
  `,
  records: `
<div class="flex-1 h-full flex flex-col bg-[#1B1E1F]">
  <!-- 顶部搜索 -->
  <div class="p-4 border-b border-gray-700">
    <input id="logs-search" type="text" placeholder="搜索 id 或日志内容…"
           class="w-full px-4 py-2 bg-[#2B2F31] rounded focus:outline-none focus:border-[#4a4f52] border border-transparent">
  </div>

  <!-- 表格区域 -->
  <div class="h-[90%] overflow-y-auto p-4">
    <table class="min-w-full bg-[#2B2F31] rounded-lg text-sm">
      <thead>
        <tr class="border-b border-gray-600">
          <th class="px-3 py-2 text-left w-10">
            <input id="logs-select-all" type="checkbox" class="rounded">
          </th>
          <th class="px-3 py-2 text-left">级别</th>
          <th class="px-3 py-2 text-left">ID</th>
          <th class="px-3 py-2 text-left">日志内容</th>
          <th class="px-3 py-2 text-left">创建时间</th>
        </tr>
      </thead>
      <tbody id="logs-tbody"></tbody>
    </table>
  </div>

  <!-- 底部分页 + 每页条数 -->
  <div class=" p-4 border-t border-gray-700 flex justify-between items-center text-sm">
    <div id="logs-pagination" class="flex gap-2 items-center mx-auto"></div>
    <div class="flex items-center gap-2">
      <span class="text-gray-400">每页</span>
      <select id="logs-perpage" class="px-2 py-1 bg-[#2B2F31] rounded border border-gray-600">
        <option value="30">30</option>
        <option value="50">50</option>
        <option value="100">100</option>
      </select>
      <span class="text-gray-400">条</span>
    </div>
  </div>
</div>`,
  aiSettings: `
                <div class="flex-1 bg-[#1B1E1F] p-6">
                <h3 class="text-lg font-semibold mb-4">AI 设置</h3>
                <div class="w-full mt-4">
                    <!-- Model choosing row -->
                    <div class="flex items-center gap-4 mb-4">
                    <span class="text-gray-300 whitespace-nowrap">Model choosing</span>
                    <select class="flex-1 px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                        <option>GPT-4</option>
                        <option>GPT-3.5 Turbo</option>
                        <option>Claude</option>
                        <option>Gemini</option>
                    </select>
                    <input type="password" placeholder="Enter API Key" class="flex-1 px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                </div>
                </div>
            `,
  accountSettings: `
                <div class="flex-1 bg-[#1B1E1F] p-6">
                <h3 class="text-lg font-semibold mb-4">Account</h3>
                <div class="space-y-4">
                    <div class="flex">
                        <label class="block text-gray-300 mb-2">Password changing</label>
                        <input type="password" placeholder="New password" class="w-full px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex">
                        <label class="block text-gray-300 mb-2">Password confirming</label>
                        <input type="password" placeholder="Confirm password" class="w-full px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                    <button class=" px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto">确认</button>
                </div>
                </div>
            `,
};

const slideBarContent = {
  api_md: `
     <div id="tables-api" class="flex flex-col h-full w-full bg-[#2B2F31] items-center overflow-y-auto">        
    </div>    


  `,
  ai_generated: `
                    <div class="flex flex-col h-full">
                        <div class="flex-1 overflow-y-auto mb-4">
                            <div class="bg-[#2B2F31] p-3 rounded mb-2">
                                <p class="text-sm">你好！我是AI助手，有什么可以帮助你的吗？</p>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            <input type="text" placeholder="输入消息..." class="flex-1 px-3 py-2 bg-[#2B2F31] rounded focus:outline-none">
                            <button class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded transition-colors">发送</button>
                        </div>
                    </div>
                `,
  log_detail: `
<div class="flex flex-col h-full text-sm text-gray-300">
  <div class="mb-2 text-gray-500 text-xs">#<span id="log-id"></span></div>
  <div class="mb-2">级别：<span id="log-level"></span></div>
  <div class="mb-2">创建时间：<span id="log-created"></span></div>
  <div class="mb-1 text-gray-400">日志内容</div>
  <div class="bg-[#2B2F31] p-3 rounded whitespace-pre-wrap break-all" id="log-text"></div>
</div>`,
};

const apiMarked = {
  create: `
<div class ="mb-3"> 
  <span class="text-white mr-4 text-xl">向<span>
  <span class=" text-orange-400 text-xl">table_name</span>
  <span class="text-white text-xl">表中插入数据<span>
</div>

\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...

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
> 当 table_name 为 users 时，无需 Authorization。
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
<div class ="mb-3"> 
  <span class="text-white mr-4 text-xl">从<span>
  <span class=" text-orange-400 text-xl">table_name</span>
  <span class="text-white text-xl">表中删除数据<span>
</div>

\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...

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
<div class ="mb-3"> 
  <span class="text-white mr-4 text-xl">在<span>
  <span class=" text-orange-400 text-xl">table_name</span>
  <span class="text-white text-xl">表中更新数据<span>
</div>

\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...

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
<div class ="mb-3"> 
  <span class="text-white mr-4 text-xl">从<span>
  <span class=" text-orange-400 text-xl">table_name</span>
  <span class="text-white text-xl">表中查询数据<span>
</div>

\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...

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
`
};


export { sidebarContent, workspaceContent, slideBarContent, apiMarked };
