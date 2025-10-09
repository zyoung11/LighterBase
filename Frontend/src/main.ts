import { sidebarContent, workspaceContent } from "./utils/contents";
console.log(document.cookie);
// 当前激活的部分
let currentSection = null;
const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;
const defaultWorkspace = document.getElementById("default-workspace") as HTMLElement;
const mainWorkspace = document.getElementById("main-workspace") as HTMLElement;

(document.getElementById("settings-btn") as HTMLElement).addEventListener(
  "click",
  () => {
    rightSidebar.innerHTML = sidebarContent.settings;
    currentSection = "settings";
    defaultWorkspace.style.display = "none";
    mainWorkspace.innerHTML =workspaceContent.aiSettings;
    setTimeout(() => {
      document.getElementById("ai-settings")?.addEventListener("click", () => {
        mainWorkspace.innerHTML = workspaceContent.aiSettings;
      });
      document
        .getElementById("account-settings")
        ?.addEventListener("click", () => {
          mainWorkspace.innerHTML = workspaceContent.accountSettings;
        });
    }, 100);
  }
);



// // 获取元素
// const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
// const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
// const slidebarContent = document.getElementById(
//   "slidebar-content"
// ) as HTMLElement;
// const bottomModal = document.getElementById("bottom-modal") as HTMLElement;


// // 显示默认工作区
// function showDefaultWorkspace() {
//   defaultWorkspace.style.display = "flex";
//   mainWorkspace.innerHTML = "";
//   mainWorkspace.appendChild(defaultWorkspace);
//   currentSection = null;
// }

// // 显示数据库部分
// function showDatabaseSection() {
//   currentSection = "database";
//   defaultWorkspace.style.display = "none";
//   mainWorkspace.innerHTML = workspaceContent.database;

//   // 添加事件监听器
//   (document.getElementById("api-docs-btn") as HTMLElement).addEventListener(
//     "click",
//     () => {
//       showRightSlidebar(
//         "API 文档",
//         '<p class="text-gray-400">API 文档内容将在这里显示</p>'
//       );
//     }
//   );

//   (document.getElementById("ai-generated") as HTMLElement).addEventListener(
//     "click",
//     () => {
//       showRightSlidebar(
//         "AI 助手",
//         `
//                     <div class="flex flex-col h-full">
//                         <div class="flex-1 overflow-y-auto mb-4">
//                             <div class="bg-[#2B2F31] p-3 rounded mb-2">
//                                 <p class="text-sm">你好！我是AI助手，有什么可以帮助你的吗？</p>
//                             </div>
//                         </div>
//                         <div class="flex space-x-2">
//                             <input type="text" placeholder="输入消息..." class="flex-1 px-3 py-2 bg-[#2B2F31] rounded focus:outline-none">
//                             <button class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded transition-colors">发送</button>
//                         </div>
//                     </div>
//                 `
//       );
//     }
//   );
// }

// // 显示右侧滑入侧边栏
// function showRightSlidebar(title, content) {
//   slidebarTitle.textContent = title;
//   slidebarContent.innerHTML = content;
//   rightSlidebar.classList.remove("translate-x-full");
// }

// // 隐藏右侧滑入侧边栏
// function hideRightSlidebar() {
//   rightSlidebar.classList.add("translate-x-full");
// }

// // 显示底部确认窗口
// function showBottomModal() {
//   bottomModal.classList.add("show");
// }

// // 隐藏底部确认窗口
// function hideBottomModal() {
//   bottomModal.classList.remove("show");
// }

// // 导航按钮事件
// (document.getElementById("logo-btn") as HTMLElement).addEventListener(
//   "click",
//   () => {
//     rightSidebar.innerHTML = sidebarContent.logo;
//     showDefaultWorkspace();
//   }
// );



// (document.getElementById("records-btn") as HTMLElement).addEventListener(
//   "click",
//   () => {
//     rightSidebar.innerHTML = "";
//     currentSection = "records";
//     defaultWorkspace.style.display = "none";
//     mainWorkspace.innerHTML = workspaceContent.records;

//     // 添加记录事件
//     setTimeout(() => {
//       // 记录项点击事件
//       document.querySelectorAll(".record-item").forEach((item) => {
//         item.addEventListener("click", function () {
//           const date = this.getAttribute("data-date");
//           (
//             document.getElementById("selected-date") as HTMLElement
//           ).textContent = date;
//           showRightSlidebar(
//             "记录详情",
//             `
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
//                         `
//           );
//         });
//       });

//       // 复选框事件
//       document.querySelectorAll(".record-checkbox").forEach((checkbox) => {
//         checkbox.addEventListener("change", function () {
//           if (
//             document.querySelectorAll(".record-checkbox:checked").length > 0
//           ) {
//             showBottomModal();
//           }
//         });
//       });
//     }, 100);
//   }
// );

// (document.getElementById("folder-btn") as HTMLElement).addEventListener(
//   "click",
//   () => {
//     rightSidebar.innerHTML = sidebarContent.folder;
//     currentSection = "folder";
//     defaultWorkspace.style.display = "none";
//     mainWorkspace.innerHTML = workspaceContent.folder;
//   }
// );

// (document.getElementById("database-btn") as HTMLElement).addEventListener(
//   "click",
//   () => {
//     rightSidebar.innerHTML = sidebarContent.database;
//     showDatabaseSection();

//     // 添加数据库按钮事件
//     setTimeout(() => {
//       document.getElementById("permissions")?.addEventListener("click", () => {
//         currentSection = "permissions";
//         mainWorkspace.innerHTML = workspaceContent.permissions;
//       });

//       document.getElementById("create-db")?.addEventListener("click", () => {
//         showRightSlidebar(
//           "创建数据库",
//           `
//                         <div class="space-y-4">
//                             <div>
//                                 <label class="block mb-2">数据库名称</label>
//                                 <input type="text" class="w-full px-3 py-2 bg-[#2B2F31] rounded focus:outline-none">
//                             </div>
//                             <div>
//                                 <label class="block mb-2">字符集</label>
//                                 <select class="w-full px-3 py-2 bg-[#2B2F31] rounded focus:outline-none">
//                                     <option>utf8mb4</option>
//                                     <option>utf8</option>
//                                     <option>latin1</option>
//                                 </select>
//                             </div>
//                             <button class="w-full px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded transition-colors">创建</button>
//                         </div>
//                     `
//         );
//       });
//     }, 100);
//   }
// );

// // 关闭侧边栏按钮
// (document.getElementById("close-slidebar") as HTMLElement).addEventListener(
//   "click",
//   hideRightSlidebar
// );

// // 底部模态框按钮
// (document.getElementById("modal-cancel") as HTMLElement).addEventListener(
//   "click",
//   hideBottomModal
// );
// (document.getElementById("modal-confirm") as HTMLElement).addEventListener(
//   "click",
//   () => {
//     hideBottomModal();
//     // 这里可以添加确认后的操作
//   }
// );

// // 初始显示默认工作区
// showDefaultWorkspace();

// // 简单的打字功能示例
// document.addEventListener("DOMContentLoaded", () => {
//   const textarea = document.querySelector("textarea");
//   if (textarea) {
//     textarea.addEventListener("keydown", (e) => {
//       if (e.key === "Tab") {
//         e.preventDefault();
//         const start = textarea.selectionStart;
//         const end = textarea.selectionEnd;
//         textarea.value =
//           textarea.value.substring(0, start) +
//           "    " +
//           textarea.value.substring(end);
//         textarea.selectionStart = textarea.selectionEnd = start + 4;
//       }
//     });
//   }
// });
