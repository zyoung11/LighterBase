import { sidebarContent, workspaceContent ,slideBarContent} from "./utils/contents";
import conponents from "./utils/conponents";
import gojsER from "./utils/gojsER";
import sqliteParser from "sqlite-parser";
import {authToken,URL} from "./apis/api";
import blocks from "./modules/blocks";
import sql from "./apis/sql";
import aichat from "./modules/aiChat";
import lighterBase from "./apis/auto";
import { renderUserTable } from "./modules/table";
import { initSqlEditor, getSqlValue, setSqlValue } from "./modules/sqlEditor";
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
// await checkAuthentication(authToken,'authToken','projects')
// 启动应用
// initializeApp();
// console.log(authToken)

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


//===================================setting======================================


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
      aiBtn.classList.add('selected');
    }
    rightSidebar.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;

       if (target.closest('#account-settings')) {
         mainWorkspace.innerHTML = workspaceContent.accountSettings;
         setupAccountSettings();
         document.querySelectorAll('#right-sidebar button').forEach(btn => {
           btn.classList.remove('selected');
         });
          (target.closest('#account-settings') as HTMLElement).classList.add('selected');
           return;
       }
      if (target.closest('#ai-settings')) {
          mainWorkspace.innerHTML = workspaceContent.aiSettings; //
          aichat.setupAISettings(); // 重新设置 AI 设置
          document.querySelectorAll('#right-sidebar button').forEach(btn => {
            btn.classList.remove('selected');
          });
          (target.closest('#ai-settings') as HTMLElement).classList.add('selected');
          return;
      }
    });
  }
);



//===================================log======================================



  (document.getElementById('records-btn') as HTMLElement).addEventListener('click', () => {
    rightSidebar.classList.add('hidden');
    currentSection = 'records';
    defaultWorkspace.style.display = 'none';
    mainWorkspace.innerHTML = workspaceContent.records; 
    conponents.showLogs(); 
  });

//===================================table======================================

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

//===================================database======================================


(document.getElementById("database-btn") as HTMLElement).addEventListener(
  "click",
  () => {
    showDefaultWorkspace();
    initializeDatabaseView();
  }
);


async function initializeDatabaseView() {
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

  // 初始化SQL编辑器
  initSqlEditor(hasExistingContent, initialSQL.length, initialSQL, "sql-input-wrapper", async (sqlValue) => {
    // 当按Enter时渲染ER图
    const sqlNotice = document.getElementById('sql-notice') as HTMLElement;
    try {
      const ast = sqliteParser(sqlValue);
      const tables = gojsER.extract(ast);
      requestAnimationFrame(() => {
        gojsER.drawER(tables, 'mount');
      });
    } catch (e) {
      console.error("SQL解析错误:", e);
      sqlNotice.style.color = "red";
      if (err instanceof Error && err.message) {
        sqlNotice.textContent = err.message;
      } else {
        sqlNotice.textContent = "SQL语法错误";
      }
      setTimeout(() => {
        sqlNotice.style.color = "";
        sqlNotice.textContent = "请输入大写SQLite语句, Enter 渲染E-R图";
      }, 2000);
    }
  });


mainWorkspace.addEventListener('manual-render-trigger', async (e: any) => {
  const sqlValue = e.detail.sql;
  const sqlNotice = document.getElementById('sql-notice') as HTMLElement;

  try {
    const ast = sqliteParser(sqlValue);
    const tables = gojsER.extract(ast);
    requestAnimationFrame(() => {
      gojsER.drawER(tables, 'mount');
    });
  } catch (err) {
    console.error("SQL解析错误:", err);
    sqlNotice.style.color = "red";
    sqlNotice.textContent = "SQL语法错误";
    setTimeout(() => {
      sqlNotice.style.color = "";
      sqlNotice.textContent = "请输入大写SQLite语句, Enter 渲染E-R图";
    }, 2000);
  }
});
// mainWorkspace.addEventListener('keydown', async (e) => {
//   const target = e.target as HTMLElement;

//   // 只有点击在 sql-input-wrapper 内部才触发
//   if (target.closest('#sql-input-wrapper')) {
//     // 修改这里：Ctrl + Enter (或 Cmd + Enter) 才渲染，单独 Enter 允许换行
//     if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
//       e.preventDefault(); // 阻止默认行为

//       const sqlNotice = document.getElementById('sql-notice') as HTMLElement;
//       try {
//         const sqlValue = getSqlValue();
//         const ast = sqliteParser(sqlValue);
//         const tables = gojsER.extract(ast);
//         requestAnimationFrame(() => {
//           gojsER.drawER(tables, 'mount');
//         });
//       } catch (err) {
//         console.error("SQL解析错误:", err);
//         sqlNotice.style.color = "red";
//         sqlNotice.textContent = "SQL语法错误";
//         setTimeout(() => {
//           sqlNotice.style.color = "";
//           sqlNotice.textContent = "请输入大写SQLite语句, Ctrl+Enter 渲染E-R图";
//         }, 2000);
//       }
//     }
//   }
// });




  // 如果有现有内容，设置为只读（但CodeMirror没有简单只读，需要扩展）
  // 暂时不设置只读

  try {
    const ast = sqliteParser(initialSQL);
    const tables = gojsER.extract(ast);
    // console.log("提取的表结构:", tables);
    requestAnimationFrame(() => {
      gojsER.drawER(tables, 'mount');
    });
  } catch (e) {
    console.error("初始SQL解析错误:", e);
  }
}

async function initializeQueryView() {
  currentQueryId = null;

  // 初始化SQL编辑器
  initSqlEditor(false, 0, "", "query-sql-input", async (sqlValue) => {
    // 当按Enter时执行查询
    try {
      const result = await sql.runQuery({"queries": sqlValue});
      renderUserTable(result,'query-results');
      // 执行查询后，清除选中状态，按钮变回保存
      currentQueryId = null;
      loadQueryHistory();
    } catch (e) {
      console.error('执行查询失败:', e);
      displayQueryResult({ error: '执行查询失败' });
    }
  });

  await loadQueryHistory();
  // 默认渲染第一个查询历史
  try {
    const response = await sql.getAllQueries();
    if (response && response.queries && response.queries.length > 0) {
      const firstQuery = response.queries[0];
      currentQueryId = firstQuery.id;
      setSqlValue(firstQuery.queries);
      // 执行查询并渲染表格
      try {
        const result = await sql.runQuery({"queries": firstQuery.queries});
        renderUserTable(result,'query-results');
      } catch (e) {
        console.error('执行查询失败:', e);
        displayQueryResult({ error: '执行查询失败' });
      }
      // 重新加载历史以更新选中状态样式
      loadQueryHistory();
    }
  } catch (error) {
    console.error('加载查询历史失败:', error);
  }
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
        queryItem.setAttribute('data-query-id', query.id.toString()); queryItem.innerHTML = `
          <div class="w-[80%] text-sm text-gray-300" title="${query.queries}">
            ${query.queries.substring(0, 30)}${query.queries.length > 30 ? '...' : ''}
          </div>
          <button class="w-[10%] bg-teansparent " data-query-id="${query.id}"><img src="${deleteImg}">  </button>
        `;
        queryItem.addEventListener('click', async (e) => {
           const target = e.target as HTMLElement;
           if (target.closest('button[data-query-id]')) {
             // 删除按钮点击
             const queryId = parseInt(target.closest('button[data-query-id]')!.getAttribute('data-query-id')!);
             deleteQueryItem(queryId);
           } else {
             // 查询项点击
             await selectQuery(query);
           }
         });
        historyContainer.appendChild(queryItem);
      });
    }
  } catch (error) {
    console.error('加载查询历史失败:', error);
  }
}

async function selectQuery(query: any) {
  const resultsDiv = document.getElementById('query-results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '<div class="text-gray-400 p-4">查询结果将显示在这里</div>';
  }

  if (currentQueryId === query.id) {
    // 再次点击，退出选中
    currentQueryId = null;
    setSqlValue('');
  } else {
    // 选中
    currentQueryId = query.id;
    setSqlValue(query.queries);
    // 执行查询并渲染表格
    try {
      const result = await sql.runQuery({"queries": query.queries});
      renderUserTable(result,'query-results');
    } catch (e) {
      console.error('执行查询失败:', e);
      displayQueryResult({ error: '执行查询失败' });
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
      setSqlValue('');
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

// mainWorkspace.addEventListener('keydown', async (e) => {
//   const sqlNotice = document.getElementById('sql-notice') as HTMLElement;
//     const target = e.target as HTMLElement;

//     if (target.closest('#sql-input-wrapper')) {
//       if (e.key === 'Enter' && !e.shiftKey) {
//         e.preventDefault();

//         try {
//           const sqlValue = getSqlValue();
//           const ast = sqliteParser(sqlValue);
//           const tables = gojsER.extract(ast);
//           requestAnimationFrame(() => {
//             gojsER.drawER(tables, 'mount');
//           });
//         } catch (e) {
//           console.error("SQL解析错误:", e);
//           sqlNotice.style.color = "red"
//           sqlNotice.textContent = "请输入正确的SQL语句"
//           setTimeout(() => {
//             sqlNotice.style.color = "";
//             sqlNotice.textContent = "请输入大写SQLite语句,\"enter\"渲染E-R图,点击右侧确认按钮提交";
//           }, 500);
//         }
//      }
//    }
//  });









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
    createDbBtn.classList.add('selected');
  }

  rightSidebar.addEventListener('click', async(e) => {
    const target = e.target as HTMLElement;

    if (target.closest('#permissions')) {
      currentSection = "permissions";
      mainWorkspace.innerHTML = workspaceContent.permissions;
      await conponents.showPermissions();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        btn.classList.remove('selected');
      });
      (target.closest('#permissions') as HTMLElement).classList.add('selected');
      return;
    }

    if (target.closest('#create-db')) {
      mainWorkspace.innerHTML = workspaceContent.database;
      initializeDatabaseView();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        btn.classList.remove('selected');
      });
      (target.closest('#create-db') as HTMLElement).classList.add('selected');
      return;
    }

    if (target.closest('#Query-db')) {
      mainWorkspace.innerHTML = workspaceContent.query;
      initializeQueryView();
      // 切换选中状态
      document.querySelectorAll('#right-sidebar button').forEach(btn => {
        btn.classList.remove('selected');
      });
      (target.closest('#Query-db') as HTMLElement).classList.add('selected');
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
         let sqlValue = getSqlValue();

          const usersTablePattern = /CREATE TABLE users \([\s\S]*?;\n*/i;
          sqlValue = sqlValue.replace(usersTablePattern, '');

          sqlValue = sqlValue.replace(/^\s*[\r\n]/gm, '').trim();

          try {
            sqliteParser(sqlValue);
          } catch (e) {
            await blocks.popupConfirm("请输入正确的sql");
            return;
          }

          const success = await blocks.popupConfirm("提交后将不能修改")
          if(success){
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

      if (target.closest('#query-save-btn')) {
        const sqlValue = getSqlValue();
        if (sqlValue && sqlValue.trim()) {
           if (currentQueryId) {
             // 更新
             await sql.updateQuery(currentQueryId,{"queries": sqlValue});
             await loadQueryHistory();
           } else {
             // 保存
             await sql.createQuery({"queries": sqlValue});
             await loadQueryHistory();
           }
        }
        return;
      }

       if (target.closest('#query-execute-btn')) {
         const sqlValue = getSqlValue();
         if (sqlValue && sqlValue.trim()) {
           try {
             const result = await sql.runQuery({"queries": sqlValue});
             renderUserTable(result,'query-results')
             // displayQueryResult(result);
             // 执行查询后，清除选中状态，按钮变回保存
             currentQueryId = null;
             // updateSaveButton();
             loadQueryHistory(); // 更新历史样式
           } catch (e) {
             console.error('执行查询失败:', e);
             displayQueryResult({ error: '执行查询失败' });
           }
         }
         return;
       }

          if (target.closest( '#view-full-sql-btn')) {
         const fullSQL = getSqlValue();

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

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                btn.textContent = '已复制！';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 500);
            }).catch(() => {
                btn.textContent = originalText;
            });
        } else {
            // 备用方法 for HTTP
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                btn.textContent = '已复制！';
                setTimeout(() => {
                    btn.textContent = originalText;
                }, 500);
            } catch (e) {
                btn.textContent = originalText;
            }
            document.body.removeChild(textArea);
        }
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


