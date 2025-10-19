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

document.addEventListener('DOMContentLoaded', () => {
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
});

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
      initializeDatabaseView();
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
        
        const usersTablePattern = /CREATE TABLE users \([\s\S]*?;\n*/i;
        sqlValue = sqlValue.replace(usersTablePattern, '');
        
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


document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.id === 'view-full-sql-btn') {
        const textarea = document.getElementById('sql-input') as HTMLTextAreaElement;
        const fullSQL = textarea.value;
        
        if (fullSQL.trim()) {
            // 显示模态框
            const modal = document.getElementById('full-sql-modal') as HTMLElement;
            const content = document.getElementById('full-sql-content') as HTMLElement;
            
            content.textContent = fullSQL;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            alert('SQL语句为空！');
        }
    }
    

    if (target.id === 'close-full-sql-modal' || target.id === 'close-modal-btn') {
        const modal = document.getElementById('full-sql-modal') as HTMLElement;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    if (target.id === 'copy-full-sql') {
        const content = document.getElementById('full-sql-content') as HTMLElement;
        const text = content.textContent || '';
        
        navigator.clipboard.writeText(text).then(() => {

            const btn = target as HTMLButtonElement;
            const originalText = btn.textContent;
            btn.textContent = '已复制！';
            btn.classList.add('bg-green-600');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('bg-green-600');
            }, 2000);
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
    }
});


document.getElementById('full-sql-modal')?.addEventListener('click', (e) => {
    const modal = e.target as HTMLElement;
    if (modal.id === 'full-sql-modal') {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
});

