// 右侧边栏内容模板
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
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        用户管理
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        连接配置
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        安全设置
                    </button>
                </div>
            `,
  records: `
                <h3 class="text-lg font-semibold mb-4">查询记录</h3>
                <div class="space-y-3">
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        最近查询
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        保存的查询
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        查询历史
                    </button>
                </div>
            `,
  folder: `
                <h3 class="text-lg font-semibold mb-4">文件夹管理</h3>
                <div class="space-y-3">
                    <button class="w-full px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        新建文件夹
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        导入文件
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        导出数据
                    </button>
                </div>
            `,
  database: `
                <h3 class="text-lg font-semibold mb-4">数据库操作</h3>
                <div class="space-y-3">
                    <button class="w-full mb-3 px-4 py-3 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-lg text-left transition-colors">
                        Create DB
                    </button>
                    <button class="w-full px-4 py-3 bg-[#1B1E1F] hover:bg-[#2B2F31] rounded-lg text-left transition-colors">
                        Permissions
                    </button>
                </div>
            `,
};

// 获取右侧边栏元素
const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;

// 为导航按钮添加点击事件
(document.getElementById("logo-btn") as HTMLElement).addEventListener("click", () => {
  rightSidebar.innerHTML = sidebarContent.logo;
});

(document.getElementById("settings-btn") as HTMLElement).addEventListener("click", () => {
  rightSidebar.innerHTML = sidebarContent.settings;
});

(document.getElementById("records-btn") as HTMLElement).addEventListener("click", () => {
  rightSidebar.innerHTML = sidebarContent.records;
});

(document.getElementById("folder-btn") as HTMLElement).addEventListener("click", () => {
  rightSidebar.innerHTML = sidebarContent.folder;
});

(document.getElementById("database-btn") as HTMLElement).addEventListener("click", () => {
  rightSidebar.innerHTML = sidebarContent.database;
});

// 简单的打字功能示例
const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value =
      textarea.value.substring(0, start) +
      "    " +
      textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 4;
  }
});

// 按钮点击效果
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", function () {
    console.log("点击了按钮:", this.textContent.trim());
  });
});
