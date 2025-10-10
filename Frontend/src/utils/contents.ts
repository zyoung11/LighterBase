const sidebarContent = {
  logo: `
                <h3 class="text-lg font-semibold mb-4">系统信息</h3>
                <div class="space-y-3">
                    <p class="text-sm text-gray-400">数据库管理系统 v1.0</p>
                    <p class="text-sm text-gray-400">已连接用户: admin</p>
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        系统设置
                    </button>
                </div>
            `,
  settings: `
                <h3 class="text-lg font-semibold mb-4">设置</h3>
                <div class="space-y-3">
                    <button id="ai-settings" class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        AI
                    </button>
                    <button id="account-settings" class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        Account
                    </button>
                </div>
            `,
  records: ``,
  folder: `
                <h3 class="text-lg font-semibold mb-4">文件管理</h3>
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
                <h3 class="text-lg font-semibold mb-4">数据库操作</h3>
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
                        <div class="h-full bg-[#15151D] border-2 border-dashed border-[#2B2F31] rounded-lg flex items-center justify-center">
                            <span class="text-gray-500">查询结果将在这里显示</span>
                        </div>
                        <!-- API文档按钮 -->
                        <button id="api-docs-btn" class="absolute right-4 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded transition-colors">
                            API文档
                        </button>
                    </div>

                    <!-- 下部分：SQL输入区域 (40% 高度) -->
                    <div class="h-[40%] p-6 relative flex items-center space-x-4 justify-center"> 
                        <textarea 
                            id="sql-input"
                            class="w-[80%] h-full bg-[#2B2F31] border border-[#2B2F31] rounded-lg p-4 text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-[#4a4f52]"
                            placeholder="在这里输入SQL查询..."
                        ></textarea>
                        <button id="ai-generated" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-sm transition-colors">
                                AI-Generated
                        </button>
                    </div>
                </div>
            `,
  permissions: `
                <div class="flex-1 bg-[#1B1E1F] p-6">
                    <h3 class="text-lg font-semibold mb-4">数据库表权限管理</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-[#2B2F31] rounded-lg">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="px-4 py-3 text-left">表名</th>
                                    <th class="px-4 py-3 text-left">读取权限</th>
                                    <th class="px-4 py-3 text-left">写入权限</th>
                                    <th class="px-4 py-3 text-left">删除权限</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-gray-700 hover:bg-[#3a3f41]">
                                    <td class="px-4 py-3">users</td>
                                    <td class="px-4 py-3"><input type="checkbox" checked class="rounded"></td>
                                    <td class="px-4 py-3"><input type="checkbox" class="rounded"></td>
                                    <td class="px-4 py-3"><input type="checkbox" class="rounded"></td>
                                </tr>
                                <tr class="border-b border-gray-700 hover:bg-[#3a3f41]">
                                    <td class="px-4 py-3">products</td>
                                    <td class="px-4 py-3"><input type="checkbox" checked class="rounded"></td>
                                    <td class="px-4 py-3"><input type="checkbox" checked class="rounded"></td>
                                    <td class="px-4 py-3"><input type="checkbox" class="rounded"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 text-gray-400">
                        <p>请选择一个单元格</p>
                    </div>
                </div>
            `,
  folder: `
                <div class="flex-1 bg-[#1B1E1F] p-6">
                    <h3 class="text-lg font-semibold mb-4">数据库表 - files</h3>
                    <div class="overflow-x-auto">
                        <table class="min-w-full bg-[#2B2F31] rounded-lg">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="px-4 py-3 text-left">ID</th>
                                    <th class="px-4 py-3 text-left">文件名</th>
                                    <th class="px-4 py-3 text-left">大小</th>
                                    <th class="px-4 py-3 text-left">修改时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="border-b border-gray-700 hover:bg-[#3a3f41]">
                                    <td class="px-4 py-3">1</td>
                                    <td class="px-4 py-3">document.pdf</td>
                                    <td class="px-4 py-3">2.5 MB</td>
                                    <td class="px-4 py-3">2024-01-15</td>
                                </tr>
                                <tr class="border-b border-gray-700 hover:bg-[#3a3f41]">
                                    <td class="px-4 py-3">2</td>
                                    <td class="px-4 py-3">image.jpg</td>
                                    <td class="px-4 py-3">1.2 MB</td>
                                    <td class="px-4 py-3">2024-01-14</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `,
  records: `
                <div class="flex-1 flex flex-col bg-[#1B1E1F]">
                    <!-- 搜索栏 -->
                    <div class="p-4 border-b border-gray-700">
                        <input type="text" placeholder="搜索记录..." class="w-full px-4 py-2 bg-[#2B2F31] rounded-lg focus:outline-none focus:border-[#4a4f52] border border-transparent">
                    </div>
                    <div class="flex flex-1 overflow-hidden">
                        <!-- Info栏 -->
                        <div class="w-64 bg-[#181A1B] p-4 overflow-y-auto">
                            <div class="space-y-2">
                                <label class="flex items-center space-x-2 p-2 hover:bg-[#2B2F31] rounded cursor-pointer">
                                    <input type="checkbox" class="record-checkbox rounded">
                                    <span>查询记录 1</span>
                                </label>
                                <label class="flex items-center space-x-2 p-2 hover:bg-[#2B2F31] rounded cursor-pointer">
                                    <input type="checkbox" class="record-checkbox rounded">
                                    <span>查询记录 2</span>
                                </label>
                                <label class="flex items-center space-x-2 p-2 hover:bg-[#2B2F31] rounded cursor-pointer">
                                    <input type="checkbox" class="record-checkbox rounded">
                                    <span>查询记录 3</span>
                                </label>
                            </div>
                        </div>
                        <!-- 显示区域和日期栏 -->
                        <div class="flex-1 flex flex-col p-4">
                            <div class="flex-1 overflow-y-auto">
                                <div class="record-item p-3 hover:bg-[#2B2F31] rounded cursor-pointer mb-2" data-date="2024-01-15">
                                    <p>SELECT * FROM users WHERE id = 1</p>
                                </div>
                                <div class="record-item p-3 hover:bg-[#2B2F31] rounded cursor-pointer mb-2" data-date="2024-01-14">
                                    <p>UPDATE products SET price = 99.99 WHERE id = 5</p>
                                </div>
                            </div>
                            <div class="border-t border-gray-700 pt-2 mt-2">
                                <p class="text-sm text-gray-400">日期: <span id="selected-date">未选择</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
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

const slideBarContent ={
    api_md:
       '<p class="text-gray-400">API 文档内容将在这里显示</p>',
    ai_generated:
            `
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
                `

}


export { 
    sidebarContent,
    workspaceContent,
    slideBarContent
    };