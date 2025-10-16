import apiIcon from "../icons/api白.svg";
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
                <div class="space-y-3">
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        新建文件夹
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        导入文件
                    </button>
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
                            <img src ="${apiIcon}" class ="w-6 h-6 object-contain" alt="API文档">
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
                        <button id="ai-generated" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors">
                                AI-Generated
                        </button>
                        <button id="sql-send" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors">
                                确认
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
  <div class="flex h-full">
    <!-- 左侧表列表 -->
    <aside class="w-64 bg-[#1B1E1F] border-r border-gray-700 p-4">
      <div class="mb-4 text-sm text-gray-400">表列表</div>
      <div id="folder-table-list" class="space-y-2"></div>
    </aside>

    <!-- 右侧主区 -->
    <main id="folder-main" class="flex-1 bg-[#1B1E1F] p-6">
      <div class="text-gray-500">请点击左侧表名查看数据</div>
    </main>
  </div>`,
 records: `
<div class="flex-1 flex flex-col bg-[#1B1E1F]">
  <!-- 顶部搜索 -->
  <div class="p-4 border-b border-gray-700">
    <input id="logs-search" type="text" placeholder="搜索 id 或日志内容…"
           class="w-full px-4 py-2 bg-[#2B2F31] rounded focus:outline-none focus:border-[#4a4f52] border border-transparent">
  </div>

  <!-- 表格区域 -->
  <div class="flex-1 overflow-y-auto p-4">
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
  <div class="p-4 border-t border-gray-700 flex justify-between items-center text-sm">
    <div id="logs-pagination" class="flex gap-2 items-center"></div>
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
     <div id="tables-api" class="flex flex-col h-full w-full overflow">        
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
</div>`
};

const apiMarked = {
  create: `
\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...
const payload = {
      "Field1": "value1",
      "Field2": "value2",
      "Field3": "value3"
  }
//这里是增
const insertData = await  lb.createTable(payload, table_name);

\`\`\`
`,
  delete: `
\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...
const payload = {
      "WHERE": "value"
  }
//这里是删
const deleteData = await lb.deleteTable(playload, table_name);

\`\`\`
`,
  update: `
\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...
const payload = {
      "set": {
          "Field1": "value1",
          "Field2": "value2",
          "Field3": "value3"
      },
      "WHERE": "value"
  }
//这里是改
const updateData = await lb.updateTable(payload, table_name);

\`\`\`
`,
  search: `
\`\`\`javascript
import LighterBase from 'lighter-base';

const lb = new LighterBase('https://your-api-endpoint.com');

...
const payload = {
      "SELECT": ["Field1", "Field2", "Field3"],
      "WHERE": "value"
  }
//这里是查
const searchData = await lb.searchTable(payload, table_name, page, perpage);
\`\`\`
`,

};
export { sidebarContent, workspaceContent, slideBarContent, apiMarked };
