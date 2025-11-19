import apiIcon from "../icons/api白.svg";
import message_light from "../icons/message_light.svg";
import confirm from "../icons/勾白.svg";
import magnify from "../icons/扩大白.svg";
import level from "../icons/level白.svg";
import logcontent from "../icons/page白.svg";
import date from "../icons/date白.svg";
import create from "../icons/create白.svg"
import permission from "../icons/权限白.svg"
import account from "../icons/用户白.svg"
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
                    <button id="ai-settings" class="w-full flex px-4 py-3 bg-[#1B1E1F] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                       <img src ="${message_light}" class ="w-[15%] object-contain mr-2" alt="表的创建">
                       <p>AI</p>
                    </button>
                    <button id="account-settings" class="w-full flex px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                       <img src ="${account}" class ="w-[15%] object-contain mr-2" alt="表的创建">
                       <p>Account</p>
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
      <div id="folder-table-list" class="flex-1 overflow-y-auto scrollbar-hide space-y-1 pr-1">
        <!-- 动态表名按钮会插到这里 -->
      </div>
    </div>
  `,
  database: `
                <div class="space-y-3">
                    <button id="create-db" class="w-full flex mb-3 px-4 py-3 bg-[#1B1E1F] hover:bg-[#3a3f41] rounded-lg items-center text-left transition-colors">
                       <img src ="${create}" class ="w-[15%] object-contain mr-2" alt="表的创建">
                       <p class = "ml-[10%]">Create DB</p>
                    </button>
                    <button id="permissions" class="w-full flex px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg items-center text-left transition-colors">
                       <img src ="${permission}" class ="w-[15%] object-contain mr-2" alt="权限">
                       <p class = "ml-[10%]">Permission</p>
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
                        <button id="api-docs-btn" class="absolute w-12 h-12 right-10 top-1/2 transform -translate-y-1/2 px-3 py-2 rounded transition-colors z-10">
                            <img src ="${apiIcon}" class ="object-contain" alt="API文档">
                        </button>
                    </div>

                    <!-- 下部分：SQL输入区域 (40% 高度) -->
                    <!-- 在 sql-input 区域的右上角添加按钮 -->
<div class="h-[40%] p-6 relative flex flex-col items-center space-x-4 justify-center">
   <div class = "w-full h-full flex justify-center items-center">
    <div class="relative w-[80%] h-full">
        <textarea 
            id="sql-input"
            class="**scrollbar-hide** overflow-y-auto w-full h-full bg-[#2B2F31] border border-[#2B2F31] rounded-lg p-4 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-[#4a4f52]"
            placeholder="在这里输入SQL查询..."
        ></textarea>
        <!-- 查看完整SQL按钮 -->
        <button 
            id="view-full-sql-btn" 
            class="absolute top-2 right-2 px-3 py-1 bg-[#3a3f41] hover:bg-[#4a4f52] rounded text-xs text-gray-300 transition-colors"
            title="查看完整SQL"
        >
            <img src="${magnify}" class="w-6 h-6 object-contain" alt="放大修改">
        </button>
    </div>
    <div class="flex flex-col">
        <button id="ai-generated" class="w-12 h-12 px-2 py-2 hover:bg-[#3a3f41] rounded-full text-sm transition-colors mb-4">
            <img src="${message_light}" class=" object-contain" alt="AI-generated">
        </button>
        <button id="sql-send" class="w-12 h-12 px-1 py-1 rounded-full text-sm transition-colors">
            <img src="${confirm}" class=" object-contain" alt="确认">
        </button>
    </div>
    </div>
   <p id = "sql-notice" class = "mt-3">"enter"渲染E-R图，请注意SQL的大小写</p>
</div>

<!-- 弹出窗口模态框 -->
<div id="full-sql-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
    <div class="bg-[#2B2F31] rounded-lg p-6 w-[90%] max-w-6xl h-[85%] overflow-hidden">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-200">完整SQL语句</h3>
            <button id="close-full-sql-modal" class="text-gray-400 hover:text-gray-200 text-2xl">
                ×
            </button>
        </div>
        <div class="overflow-auto h-[85%]">
            <textarea id="full-sql-content" class="**scrollbar-hide** overflow-y-auto w-full h-full bg-[#1B1E1F] p-4 rounded text-gray-300 text-sm whitespace-pre-wrap overflow-x-auto resize-none focus:outline-none focus:border-[#4a4f52] border border-[#2B2F31]"></textarea>
        </div>
        <div class="mt-4 flex justify-end">
            <button id="copy-full-sql" class="px-4 py-2 bg-[#4a4f52] hover:bg-[#5a5f62] rounded text-sm text-gray-200 transition-colors mr-2">
                复制
            </button>
        </div>
    </div>
</div>
                </div>
            `,
  permissions: `
        <div class="bg-[#1B1E1F] p-6 h-full flex flex-col">
            <h3 class="text-lg font-semibold mb-4">数据库表权限管理</h3>

            <div class="h-2/3 bg-[#15151D] overflow-y-auto scrollbar-hide mb-4 border rounded-lg border-gray-700" >
                <table id="permissions-table" class="min-w-full bg-[#2B2F31] rounded-lg" style="table-layout: fixed;">
                    <thead>
                        <tr class="border-b border-gray-600">
                            <th class="px-4 py-3 text-left">Table</th>
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
           class="w-full px-4 py-2 bg-[#2B2F31] rounded-full focus:outline-none focus:border-[#4a4f52] border border-transparent">
  </div>

  <!-- 表格区域 -->
   <div class="h-[90%] overflow-y-auto scrollbar-hide p-4">
    <table class="min-w-full bg-[#2B2F31] rounded-lg text-sm">
      <thead>
        <tr class="border-b border-gray-600">
          <th class="px-3 py-2 text-left w-10">
            <input id="logs-select-all" type="checkbox" class="rounded">
          </th>
          <th class="px-3 py-2 text-left flex items-center">
            <div class="flex items-center">
              <img src="${level}" class="w-3 h-3 object-contain" alt="查看完整SQL ">
              <p>Level</p>
            </div>
          </th>
          <th class="px-3 py-2 text-left">ID</th>
          <th class="px-3 py-2">
            <div class="flex items-center">
              <img src="${logcontent}" class="w-5 h-5 object-contain" alt="日志内容 ">
              <p>日志内容</p>
            </div>
          </th>
          <th class="px-3 py-2 text-left flex items-center">
            <div class="flex items-center">
              <img src="${date}" class="w-3 h-3 object-contain" alt="创建时间 ">
              <p>创建时间</p>
            </div>
          </th>
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
    <div class="p-6 h-full flex flex-col space-y-6 bg-gradient-to-br from-[#1B1E1F] to-[#2B2F31] rounded-lg shadow-xl">
        <div id="ai-settings-container" class="space-y-6">
            <div class="bg-[#2B2F31] rounded-xl p-6 border border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-[#2B2F31] rounded-full flex items-center justify-center shadow-md">
                            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-white mb-1">当前模型</h3>
                            <p class="text-sm text-gray-400">AI 对话使用的模型配置</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                            已启用
                        </span>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-600">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-300">模型名称:</span>
                        <span id="selected-ai-name" class="text-sm font-semibold text-white bg-gradient-to-r from-blue-400 to-purple-500 px-3 py-1 rounded-lg">GLM (Zhipu)</span>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-sm font-medium text-gray-300">模型 ID:</span>
                        <span class="text-sm text-gray-400 bg-[#3a3f41] px-3 py-1 rounded-lg">glm-4</span>
                    </div>
                    <div class="flex items-center justify-between mt-2">
                        <span class="text-sm font-medium text-gray-300">状态:</span>
                        <span class="text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">正常运行</span>
                    </div>
                </div>
            </div>

            <div class="bg-[#2B2F31] rounded-xl p-6 border border-gray-600 shadow-lg">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-8 h-8 bg-[#2B2F31] rounded-full flex items-center justify-center">
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-white">配置说明</h3>
                </div>
                <div class="space-y-3 text-sm text-gray-300">
                    <p>• 当前系统已固定使用 GLM-4 模型进行 AI 对话</p>
                    <p>• API Key 已内置配置，无需手动设置</p>
                </div>
            </div>
        </div>

    </div>
    `,

      accountSettings: `
                <div class="flex-1 bg-[#1B1E1F] p-6">
                <div class="space-y-4">
                    <div class="flex flex-col">
                        <label class="block text-gray-300 mb-2">当前密码</label>
                        <input id="current-password" type="password" placeholder="输入当前密码" class="w-full px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex flex-col">
                        <label class="block text-gray-300 mb-2">新密码</label>
                        <input id="new-password" type="password" placeholder="输入新密码" class="w-full px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                    <div class="flex flex-col">
                        <label class="block text-gray-300 mb-2">确认新密码</label>
                        <input id="confirm-password" type="password" placeholder="确认新密码" class="w-full px-3 py-2 bg-[#2A2D30] text-gray-200 rounded border border-gray-600 focus:outline-none focus:border-blue-500">
                    </div>
                    <div>
                        <button id="change-password-btn" class="px-4 py-2 mb-2 text-white border border-gray-400 rounded hover:bg-gray-700/50">修改密码</button>
                        <p class = "border-b border-gray-200 mb-2"></p>
                        <button id="logout-btn" class="px-4 py-2  text-white border border-gray-400 rounded hover:bg-gray-700/50">退出登录</button>
                    </div>
                </div>
                </div>
            `,
};

const slideBarContent = {
   api_md: `
      <div id="tables-api" class="flex h-full w-full bg-[#2B2F31]">
        <div class="w-16 bg-[#1B1E1F] flex flex-col items-center py-4 space-y-4 sticky top-0 h-full">
          <button class="nav-btn w-10 h-10 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg flex items-center justify-center transition-colors text-white text-sm" data-nav="create">增</button>
          <button class="nav-btn w-10 h-10 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg flex items-center justify-center transition-colors text-white text-sm" data-nav="delete">删</button>
          <button class="nav-btn w-10 h-10 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg flex items-center justify-center transition-colors text-white text-sm" data-nav="update">改</button>
          <button class="nav-btn w-10 h-10 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg flex items-center justify-center transition-colors text-white text-sm" data-nav="search">查</button>
        </div>
         <div id="api-content" class="flex-1 flex flex-col items-center overflow-y-auto scrollbar-hide">
        </div>
      </div>
   `,
ai_generated: `
    <div id="ai-chat-box" class="flex flex-col flex-1 h-full p-4">
       <div class="pb-3 border-b border-gray-700 mb-3">
           <label class="text-sm text-gray-400">当前模型:</label>
           <button id="chat-model-switch-btn" class="px-3 py-1 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors ml-2">
               <span id="current-ai-model">GLM (Zhipu)</span> (点击查看信息)
           </button>
       </div>

        <div id="chat-messages" class="flex-1 overflow-y-auto scrollbar-hide space-y-4 pb-4">
           <div class="text-center text-gray-500 text-sm py-2">您正在与 GLM (Zhipu) 对话</div>
       </div>
      
      <div id="chat-input-area" class="border-t border-gray-700 pt-4 mt-auto">
          <div class="flex space-x-2">
              <textarea id="ai-chat-input" rows="1" placeholder="输入你的问题..." 
                        class="flex-1 p-3 rounded-lg bg-[#2B2F31] border border-[#3a3f41] focus:border-[#4a4f52] focus:outline-none resize-none"
                        style="max-height: 150px;" disabled></textarea>
              <button id="send-ai-message" class="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" disabled>
                  <svg id="ai-send-icon" class="w-6 h-6 transform rotate-90 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  <svg id="ai-stop-icon" class="w-6 h-6 text-white hidden" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H5z" clip-rule="evenodd"></path>
                  </svg>
              </button>
          </div>
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
`,
};

export { sidebarContent, workspaceContent, slideBarContent, apiMarked };
