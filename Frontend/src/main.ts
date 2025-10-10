import { sidebarContent, workspaceContent ,slideBarContent} from "./utils/contents";
import conponents from "./utils/conponents";
// import sql from "./apis/sql";
import sqliteParser from "sqlite-parser";
import {authToken} from "./apis/api"; 
console.log('authToken:', authToken);


// 当前激活的部分
let currentSection = null;
const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;
const defaultWorkspace = document.getElementById("default-workspace") as HTMLElement;
const mainWorkspace = document.getElementById("main-workspace") as HTMLElement;




(document.getElementById("close-slidebar") as HTMLElement).addEventListener(
  "click",
  conponents.hideRightSlidebar
);




(document.getElementById("settings-btn") as HTMLElement).addEventListener(
  "click",
  () => {
    rightSidebar.innerHTML = sidebarContent.settings;
    currentSection = "settings";
    defaultWorkspace.style.display = "none";
    mainWorkspace.innerHTML =workspaceContent.aiSettings;


    rightSidebar.addEventListener('click', (e) => { 
        const target = e.target as HTMLElement;
        
      if (target.closest('#account-settings')) {
        mainWorkspace.innerHTML = workspaceContent.accountSettings;
          return;
      }
      if (target.closest('#ai-settings')) {
          mainWorkspace.innerHTML = workspaceContent.aiSettings;
          return;
      }
    });
  }
);

//-----------------------------------------------数据库在第四部分--------------------------------------------


(document.getElementById("database-btn") as HTMLElement).addEventListener(
  "click",
  () => {
    rightSidebar.innerHTML = sidebarContent.database;
    currentSection = "database";
    defaultWorkspace.style.display = "none";
    mainWorkspace.innerHTML = workspaceContent.database;

    rightSidebar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

      if (target.closest('#permissions')) {
          currentSection = "permissions";
          mainWorkspace.innerHTML = workspaceContent.permissions;
          return;
      }
    
      if (target.closest('#create-db')) {
          mainWorkspace.innerHTML = workspaceContent.database;
          requestAnimationFrame(() => {
          const tables = [
          {
            name: 'customer',
            columns: [
              { name: 'id',        type: 'INTEGER', pk: true,  notNull: true },
              { name: 'name',      type: 'TEXT',    pk: false, notNull: true },
              { name: 'email',     type: 'TEXT',    pk: false, notNull: false },
              { name: 'created_at',type: 'DATETIME',pk: false, notNull: false }
            ],
            pks: ['id'],
            fks: []
          },
          {
            name: 'orders',
            columns: [
              { name: 'id',         type: 'INTEGER', pk: true,  notNull: true },
              { name: 'customer_id',type: 'INTEGER', pk: false, notNull: true },
              { name: 'amount',     type: 'REAL',    pk: false, notNull: true },
              { name: 'status',     type: 'TEXT',    pk: false, notNull: true },
              { name: 'created_at', type: 'DATETIME',pk: false, notNull: false }
            ],
            pks: ['id'],
            fks: [
              {
                columns: ['customer_id'],
                refTable: 'customer',
                refColumns: ['id']
              }
            ]
          }
        ];
          conponents.drawER(tables, 'mount');
        });
        return;
      }
    });
    mainWorkspace.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    
    if (target.closest('#api-docs-btn')) {
        conponents.showRightSlidebar("API 文档", slideBarContent.api_md);
        return;
    }
    
    if (target.closest('#ai-generated')) {
        conponents.showRightSlidebar("AI 助手", slideBarContent.ai_generated);
        return;
    }
    });
  }
);

// mainWorkspace.addEventListener('keydown', async(e) => {
//   const target = e.target as HTMLElement;

//   if (target.id === 'sql-input' && target.tagName === 'TEXTAREA') {
//     const textarea = target as HTMLTextAreaElement;
//     const payload ={
//       "SQL": textarea.value,
//     }
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault(); 
//       const ast = sqliteParser(textarea.value); 
//       // console.log("测试sqlite-parser",JSON.stringify(ast, null, 2));
//       const tables = conponents.extract(ast);
//       console.log("提取的表结构:", tables);
//       // await sql.createSql(payload);
//       await conponents.drawER(tables, 'mount'); 
//     }
//   }
// });


// // 获取元素
// const bottomModal = document.getElementById("bottom-modal") as HTMLElement;


// // 显示默认工作区
// function showDefaultWorkspace() {
//   defaultWorkspace.style.display = "flex";
//   mainWorkspace.innerHTML = "";
//   mainWorkspace.appendChild(defaultWorkspace);
//   currentSection = null;
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

// document.addEventListener("DOMContentLoaded", () => {              可以准备删了
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
