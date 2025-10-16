import { sidebarContent, workspaceContent ,slideBarContent} from "./utils/contents";
import conponents from "./utils/conponents";
import gojsER from "./utils/gojsER";
// import sql from "./apis/sql";
import sqliteParser from "sqlite-parser";
import {authToken} from "./apis/api"; 
import blocks from "./modules/blocks";
import admin from "./apis/admin";
import sql from "./apis/sql";
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
    rightSidebar.classList.remove("hidden")
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



  (document.getElementById('records-btn') as HTMLElement).addEventListener('click', () => {
    rightSidebar.classList.add('hidden');
    currentSection = 'records';
    defaultWorkspace.style.display = 'none';
    mainWorkspace.innerHTML = workspaceContent.records; 
    conponents.showLogs(); 
  });


(document.getElementById("folder-btn") as HTMLElement).addEventListener(
  "click",
  async () => {
    rightSidebar.classList.remove("hidden");
    rightSidebar.innerHTML = sidebarContent.folder;        
    currentSection = "folder";
    defaultWorkspace.style.display = "none";

    mainWorkspace.innerHTML = workspaceContent.folder;

    await conponents.showFolderTables();
  }
);



(document.getElementById("database-btn") as HTMLElement).addEventListener(
  "click",
  () => {
    showDefaultWorkspace();
    initializeDatabaseView();
  }
);


async function initializeDatabaseView() {
  const textarea = document.getElementById('sql-input') as HTMLTextAreaElement | null;
  if (textarea) {
    let initialSQL = `CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  create_at TEXT NOT NULL,
  update_at TEXT NOT NULL
);

`;
    
    // 检查是否有现有的表数据
    try {
      const tableStatements = await sql.lastestSql();
      if (tableStatements) {
        // 如果有内容，使用返回的SQL语句
        initialSQL += tableStatements + '\n';
      }
    } catch (error) {
      console.warn("获取表数据失败，使用默认SQL:", error);
    }

    textarea.value = initialSQL;
    
    const initialLength = initialSQL.length;
    
    textarea.addEventListener('input', () => {
      if (textarea.value.length < initialLength || 
          !textarea.value.startsWith(initialSQL)) {
        textarea.value = initialSQL;
      }
    });
    
    textarea.focus();
    textarea.setSelectionRange(initialLength, initialLength);

    // 渲染ER图
    try {
      const ast = sqliteParser(initialSQL);
      const tables = gojsER.extract(ast);
      console.log("提取的表结构:", tables);
      requestAnimationFrame(() => { 
        gojsER.drawER(tables, 'mount');
      });
    } catch (error) {
      console.error("初始SQL解析错误:", error);
    }
  }
}


mainWorkspace.addEventListener('keydown', async (e) => {
  const target = e.target as HTMLElement;

  if (target.id === 'sql-input' && target.tagName === 'TEXTAREA') {
    const textarea = target as HTMLTextAreaElement;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      try {
        const ast = sqliteParser(textarea.value);
        const tables = gojsER.extract(ast);
        requestAnimationFrame(() => { 
          gojsER.drawER(tables, 'mount');
        });
      } catch (error) {
        console.error("SQL解析错误:", error);
      }
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '\n' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
  }
});

showDefaultWorkspace();
function showDefaultWorkspace() {
  rightSidebar.classList.remove("hidden")
  rightSidebar.innerHTML = sidebarContent.database;
  currentSection = "database";
  defaultWorkspace.style.display = "none";
  mainWorkspace.innerHTML = workspaceContent.database;

  setTimeout(() => {
    const mountElement = document.getElementById('mount');
    if (!mountElement) {
      const databaseContainer = document.getElementById('database-container');
      if (databaseContainer) {
        const mountDiv = document.createElement('div');
        mountDiv.id = 'mount';
        mountDiv.style.width = '100%';
        mountDiv.style.height = '400px';
        databaseContainer.appendChild(mountDiv);
      }
    }
  }, 0);

  initializeDatabaseView();

  rightSidebar.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement;

    if (target.closest('#permissions')) {
      currentSection = "permissions";
      mainWorkspace.innerHTML = workspaceContent.permissions;
      await conponents.showPermissions();
      return;
    }
  
    if (target.closest('#create-db')) {
      mainWorkspace.innerHTML = workspaceContent.database;
      return;
    }
  });

  mainWorkspace.addEventListener('click', async(e) => { 
    const target = e.target as HTMLElement;

    if (target.closest('#api-docs-btn')) {
      conponents.showRightSlidebar("API 文档", slideBarContent.api_md);
      await conponents.setupTableButtons();
      return;
    }
    if (target.closest('#ai-generated')) {
      conponents.showRightSlidebar("AI 助手", slideBarContent.ai_generated);
      await conponents.setupTableButtons();
      return;
    }
    if(target.closest('#sql-send')){
      const textarea = document.getElementById('sql-input') as HTMLTextAreaElement | null;
      if (textarea) {
        let sqlValue = textarea.value;
        
        // 删除users表相关的内容
        const usersTablePattern = /CREATE TABLE users \([\s\S]*?;\n*/i;
        sqlValue = sqlValue.replace(usersTablePattern, '');
        
        // 删除多余的空白行
        sqlValue = sqlValue.replace(/^\s*[\r\n]/gm, '').trim();
        
        const payload = {
          "SQL": sqlValue,
        };
        console.log('payload:', payload);
        await sql.createSql(payload);
      }
    }
  });
}






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

