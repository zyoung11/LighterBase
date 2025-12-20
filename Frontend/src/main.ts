import { sidebarContent, workspaceContent ,slideBarContent} from "./utils/contents";
import conponents from "./utils/conponents";
import gojsER from "./utils/gojsER";
// import sql from "./apis/sql";
import sqliteParser from "sqlite-parser";
import {authToken,URL} from "./apis/api";
import blocks from "./modules/blocks";
import admin from "./apis/admin";
import sql from "./apis/sql";
import aichat from "./modules/aiChat";
import lighterBase from "./apis/auto";
import { checkAuthentication } from "./modules/tools";

// Import images
import logoImg from './icons/logoWhite.png';
import databaseImg from './icons/databaseWhite.svg';
import folderImg from './icons/folderWhite.svg';
import recordsImg from './icons/analysisWhite.svg';
import settingsImg from './icons/settingsWhite.svg';
import deleteImg from './icons/delete.svg' 

// 初始化应用
// async function initializeApp() {
// await checkAuthentication(authToken,'welcome.html')
// }
await checkAuthentication(authToken,'projects')
// 启动应用
// initializeApp();

// Set imported images
function setImportedImages() {
  const logoImgEl = document.getElementById('logo-img') as HTMLImageElement;
  if (logoImgEl) logoImgEl.src = logoImg;

  const databaseImgEl = document.getElementById('database-img') as HTMLImageElement;
  if (databaseImgEl) databaseImgEl.src = databaseImg;

  const folderImgEl = document.getElementById('folder-img') as HTMLImageElement;
  if (folderImgEl) folderImgEl.src = folderImg;

  const recordsImgEl = document.getElementById('records-img') as HTMLImageElement;
  if (recordsImgEl) recordsImgEl.src = recordsImg;

  const settingsImgEl = document.getElementById('settings-img') as HTMLImageElement;
  if (settingsImgEl) settingsImgEl.src = settingsImg;

  const faviconLink = document.getElementById('favicon-link') as HTMLLinkElement;
  if (faviconLink) faviconLink.href = logoImg;
}

setImportedImages();
// 当前激活的部分
let currentSection: string | null = null;
const rightSidebar = document.getElementById("right-sidebar") as HTMLElement;
const defaultWorkspace = document.getElementById("default-workspace") as HTMLElement;
const mainWorkspace = document.getElementById("main-workspace") as HTMLElement;

// Query相关变量
let currentQueryId: number | null = null;




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
    mainWorkspace.innerHTML =workspaceContent.aiSettings; //

    aichat.setupAISettings(); // 调用 aichat 中的设置逻辑
    const aiBtn = document.getElementById('ai-settings') as HTMLElement;
    if (aiBtn) {
      aiBtn.style.backgroundColor = '#2B2F31';
    }
    rightSidebar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

       if (target.closest('#account-settings')) {
         mainWorkspace.innerHTML = workspaceContent.accountSettings;
         setupAccountSettings();
         document.querySelectorAll('#right-sidebar button').forEach(btn => {
           (btn as HTMLElement).style.backgroundColor = '';
         });
          (target.closest('#account-settings') as HTMLElement).style.backgroundColor = '#2B2F31';
           return;
       }
      if (target.closest('#ai-settings')) {
          mainWorkspace.innerHTML = workspaceContent.aiSettings; //
          aichat.setupAISettings(); // 重新设置 AI 设置
          document.querySelectorAll('#right-sidebar button').forEach(btn => {
            (btn as HTMLElement).style.backgroundColor = '';
          });
          (target.closest('#ai-settings') as HTMLElement).style.backgroundColor = '#2B2F31';
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
    
     let hasExistingContent = false;
     try {
       const tableStatements = await sql.lastestSql();
       const sqlSendBtn = document.getElementById('sql-send') as HTMLButtonElement;
       if (tableStatements) {
         // 如果有内容，使用返回的SQL语句
         initialSQL += tableStatements + '\n';
         hasExistingContent = true;
         // 禁用 sql-send 按钮
         if (sqlSendBtn) {
           sqlSendBtn.disabled = true;
           sqlSendBtn.style.opacity = '0.5';
         }
       } else {
         // 如果没有内容，启用 sql-send 按钮
         if (sqlSendBtn) {
           sqlSendBtn.disabled = false;
           sqlSendBtn.style.opacity = '1';
         }
       }
     } catch (error) {
       console.warn("获取表数据失败，使用默认SQL:", error);
       // 出错时启用按钮
       const sqlSendBtn = document.getElementById('sql-send') as HTMLButtonElement;
       if (sqlSendBtn) {
         sqlSendBtn.disabled = false;
         sqlSendBtn.style.opacity = '1';
       }
     }
     textarea.value = initialSQL;
     textarea.readOnly = hasExistingContent;
    
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

async function initializeQueryView() {
  currentQueryId = null;
  await loadQueryHistory();
  // updateSaveButton();
}

async function loadQueryHistory() {
  const historyContainer = document.getElementById('query-history');
  if (!historyContainer) return;

  try {
    const response = await sql.getAllQueries();
    if (response && response.queries) {
      historyContainer.innerHTML = '';
      response.queries.forEach((query: any) => {
        const queryItem = document.createElement('div');
        queryItem.className = `flex items-center p-2 rounded cursor-pointer ${currentQueryId === query.id ? 'bg-[#4a4f52]' : 'bg-[#2B2F31] hover:bg-[#3a3f41]'}`;
        queryItem.setAttribute('data-query-id', query.id.toString());
        queryItem.innerHTML = `
          <div class="w-[80%] text-sm text-gray-300" title="${query.queries}">
            ${query.queries.substring(0, 30)}${query.queries.length > 30 ? '...' : ''}
          </div>
          <button class="w-[10%] bg-teansparent " data-query-id="${query.id}"><img src="${deleteImg}">  </button>
        `;
        queryItem.addEventListener('click', (e) => {
           const target = e.target as HTMLElement;
           if (target.closest('button[data-query-id]')) {
             // 删除按钮点击
             const queryId = parseInt(target.closest('button[data-query-id]')!.getAttribute('data-query-id')!);
             deleteQueryItem(queryId);
           } else {
             // 查询项点击
             selectQuery(query);
           }
         });
        historyContainer.appendChild(queryItem);
      });
    }
  } catch (error) {
    console.error('加载查询历史失败:', error);
  }
}

function selectQuery(query: any) {
  const resultsDiv = document.getElementById('query-results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '<div class="text-gray-400 p-4">查询结果将显示在这里</div>';
  }

  if (currentQueryId === query.id) {
    // 再次点击，退出选中
    currentQueryId = null;
    const textarea = document.getElementById('query-sql-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = '';
    }
  } else {
    // 选中
    currentQueryId = query.id;
    const textarea = document.getElementById('query-sql-input') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = query.queries;
    }
  }
  // updateSaveButton();
  loadQueryHistory(); // 重新加载历史以更新选中状态样式
}

async function deleteQueryItem(queryId: number) {
  const confirmed = await blocks.popupConfirm('确定要删除这个查询吗？');
  if (!confirmed) return;

  try {
    await sql.deleteQuery(queryId);
    await loadQueryHistory();
    if (currentQueryId === queryId) {
      currentQueryId = null;
      const textarea = document.getElementById('query-sql-input') as HTMLTextAreaElement;
      if (textarea) textarea.value = '';
      const resultsDiv = document.getElementById('query-results');
      if (resultsDiv) {
        resultsDiv.innerHTML = '<div class="text-gray-400 p-4">查询结果将显示在这里</div>';
      }
      // updateSaveButton();
    }
  } catch (error) {
    console.error('删除查询失败:', error);
  }
}

// function updateSaveButton() {
//   const saveBtn = document.getElementById('query-save-btn') as HTMLButtonElement;
//   if (saveBtn) {
//     saveBtn.textContent = currentQueryId ? '更新' : '保存';
//   }
// }

function displayQueryResult(result: any) {
  const resultsDiv = document.getElementById('query-results');
  if (!resultsDiv) return;

  if (result.error) {
    resultsDiv.innerHTML = `<div class="text-red-400 p-4">${result.error}</div>`;
    return;
  }

  let html = '<div class="p-4 text-gray-200">';
  if (result.items && Array.isArray(result.items)) {
    // 分页结果
    const items = result.items;
    if (items.length === 0) {
      html += '无结果';
    } else {
      html += '<table class="w-full border-collapse border border-gray-600">';
      // 表头
      const keys = Object.keys(items[0]);
      html += '<thead><tr>';
      keys.forEach(key => {
        html += `<th class="border border-gray-600 p-2 bg-[#2B2F31]">${key}</th>`;
      });
      html += '</tr></thead>';
      // 表体
      html += '<tbody>';
      items.forEach((row: any) => {
        html += '<tr>';
        keys.forEach(key => {
          html += `<td class="border border-gray-600 p-2">${row[key]}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
  } else if (Array.isArray(result)) {
    // 直接数组结果
    if (result.length === 0) {
      html += '无结果';
    } else {
      html += '<table class="w-full border-collapse border border-gray-600">';
      // 表头
      const keys = Object.keys(result[0]);
      html += '<thead><tr>';
      keys.forEach(key => {
        html += `<th class="border border-gray-600 p-2 bg-[#2B2F31]">${key}</th>`;
      });
      html += '</tr></thead>';
      // 表体
      html += '<tbody>';
      result.forEach((row: any) => {
        html += '<tr>';
        keys.forEach(key => {
          html += `<td class="border border-gray-600 p-2">${row[key]}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table>';
    }
  } else {
    html += `<pre>${JSON.stringify(result, null, 2)}</pre>`;
  }
  html += '</div>';
  resultsDiv.innerHTML = html;
}

mainWorkspace.addEventListener('keydown', async (e) => {
const sqlNotice = document.getElementById('sql-notice') as HTMLElement;
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
        sqlNotice.style.color = "red"
        sqlNotice.textContent = "请输入正确的SQL语句"
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
  // 设置默认选中Create DB
  const createDbBtn = document.getElementById('create-db') as HTMLElement;
  if (createDbBtn) {
    createDbBtn.style.backgroundColor = '#2B2F31';
  }

  rightSidebar.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement;

    if (target.closest('#permissions')) {
      currentSection = "permissions";
      mainWorkspace.innerHTML = workspaceContent.permissions;
      await conponents.showPermissions();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        (btn as HTMLElement).style.backgroundColor = '';
      });
      (target.closest('#permissions') as HTMLElement).style.backgroundColor = '#2B2F31';
      return;
    }

    if (target.closest('#create-db')) {
      mainWorkspace.innerHTML = workspaceContent.database;
      initializeDatabaseView();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        (btn as HTMLElement).style.backgroundColor = '';
      });
      (target.closest('#create-db') as HTMLElement).style.backgroundColor = '#2B2F31';
      return;
    }

    if (target.closest('#Query-db')) {
      mainWorkspace.innerHTML = workspaceContent.query;
      initializeQueryView();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        (btn as HTMLElement).style.backgroundColor = '';
      });
      (target.closest('#Query-db') as HTMLElement).style.backgroundColor = '#2B2F31';
      return;
    }
  });

  mainWorkspace.addEventListener('click', async(e) => { 
    const target = e.target as HTMLElement;

     if (target.closest('#api-docs-btn')) {
       console.log('API docs button clicked');
       conponents.showRightSlidebar("API 文档", slideBarContent.api_md);
       await conponents.setupTableButtons();
       return;
     }
     if (target.closest('#ai-generated')) {
       console.log('AI generated button clicked');
       conponents.showRightSlidebar("AI 助手", slideBarContent.ai_generated);
       aichat.setupChatDisplay();

       setupAIChatListeners(); // <--- 关键修复：在这里绑定事件

       return;
     }

    if(target.closest('#sql-send')){
       const sqlSendBtn = document.getElementById('sql-send') as HTMLButtonElement;
      const success = await blocks.popupConfirm("提交后将不能修改")
      if(success){
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
         if (sqlSendBtn) {
           sqlSendBtn.disabled = true;
           sqlSendBtn.style.opacity = '0.5';
         }
      }
      }
     }

     if (target.closest('#query-save-btn')) {
       const textarea = document.getElementById('query-sql-input') as HTMLTextAreaElement;
       if (textarea && textarea.value.trim()) {
          if (currentQueryId) {
            // 更新
            await sql.updateQuery(currentQueryId,{"queries": textarea.value});
            await loadQueryHistory();
          } else {
            // 保存
            await sql.createQuery({"queries":textarea.value});
            await loadQueryHistory();
          }
       }
       return;
     }

      if (target.closest('#query-execute-btn')) {
        const textarea = document.getElementById('query-sql-input') as HTMLTextAreaElement;
        if (textarea && textarea.value.trim()) {
          try {
            const result = await sql.runQuery({"queries":textarea.value});
            displayQueryResult(result);
            // 执行查询后，清除选中状态，按钮变回保存
            currentQueryId = null;
            // updateSaveButton();
            loadQueryHistory(); // 更新历史样式
          } catch (error) {
            console.error('执行查询失败:', error);
            displayQueryResult({ error: '执行查询失败' });
          }
        }
        return;
      }

         if (target.closest( '#view-full-sql-btn')) {
        const textarea = document.getElementById('sql-input') as HTMLTextAreaElement;
        const fullSQL = textarea.value;

        if (fullSQL.trim()) {
            // 显示模态框
            const modal = document.getElementById('full-sql-modal') as HTMLElement;
            const content = document.getElementById('full-sql-content') as HTMLTextAreaElement;

            content.value = fullSQL;
            content.readOnly = true; // 放大窗口总是只读，不能修改内容
            modal.classList.remove('hidden');
            modal.classList.add('flex');

            // 移除同步输入，因为总是只读
        } else {
            alert('SQL语句为空！');
        }
    }
  });
}


document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    

    if (target.id === 'close-full-sql-modal') {
        const modal = document.getElementById('full-sql-modal') as HTMLElement;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    
    if (target.id === 'copy-full-sql') {
        const content = document.getElementById('full-sql-content') as HTMLTextAreaElement;
        const text = content.value || '';

        const btn = target as HTMLButtonElement;
        const originalText = btn.textContent;

        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '已复制！';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 500);
        }).catch(e => {
            btn.textContent = originalText;
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
function setupAIChatListeners() {
    const sendButton = document.getElementById('send-ai-message') as HTMLButtonElement;
    const chatInput = document.getElementById('ai-chat-input') as HTMLTextAreaElement;

    sendButton?.addEventListener('click', () => {
        aichat.handleChatSubmit();
    });

    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // 阻止默认换行
            aichat.handleChatSubmit();
        }
    });
}

function setupAccountSettings() {
    const changePasswordBtn = document.getElementById('change-password-btn') as HTMLButtonElement;
    const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

    changePasswordBtn?.addEventListener('click', async () => {
        const currentPassword = (document.getElementById('current-password') as HTMLInputElement).value;
        const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            await blocks.popupConfirm('请填入所有内容');
            return;
        }

        if (newPassword !== confirmPassword) {
           await blocks.popupConfirm('新密码不相同')
           return;
        }

        const payload = {
            set: { password_hash: newPassword },
            WHERE: `id = 1`
        };

        try {
            const lb = new lighterBase(URL);
            await lb.updateTable(payload, 'users');
            await blocks.popupConfirm('密码更新成功')
            } catch (error) {
              await blocks.popupConfirm('更新失败')
        }
    });

    logoutBtn?.addEventListener('click', async () => {
        const confirmed = await blocks.popupConfirm('确定要登出吗？');
        if (confirmed) {
            // Clear token
            document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
            // Redirect to welcome
            window.location.href = `/projects`;
        }
    });
}


