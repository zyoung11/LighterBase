import { sidebarContent, workspaceContent ,slideBarContent} from "./utils/contents";
import conponents from "./utils/conponents";
import gojsER from "./utils/gojsER";
// import sql from "./apis/sql";
import sqliteParser from "sqlite-parser";
import {authToken,URL} from "./apis/api";
import blocks from "./modules/blocks";
import admin from "./apis/admin";
import sql from "./apis/sql";
import {jwtDecode} from "jwt-decode"
import auth from "./apis/auth"
import aichat from "./modules/aiChat";
import lighterBase from "./apis/auto";

// Import images
import logoImg from './icons/logoWhite.png';
import databaseImg from './icons/databaseWhite.svg';
import folderImg from './icons/folderWhite.svg';
import recordsImg from './icons/analysisWhite.svg';
import settingsImg from './icons/settingsWhite.svg';

// 认证检查函数
function checkAuthentication() {
  // 检查是否有token
  if (!authToken) {
    console.log("没有找到JWT token，跳转到登录页面");
    window.location.href = `/welcome.html?apiUrl=${encodeURIComponent(URL)}`;
    return false;
  }

  try {
    const decoded = jwtDecode(authToken);
    const exp = Number(decoded.exp) * 1000;

    // 检查token是否过期
    if (exp && exp < Date.now()) {
      console.log("token已经过期，尝试刷新");
      return true; // 继续执行刷新逻辑
    }

    return true; // token有效，继续执行
  } catch (e) {
    console.log("token解析失败，跳转到登录页面", e);
    window.location.href = `/welcome.html?apiUrl=${encodeURIComponent(URL)}`;
    return false;
  }
}

// 初始化应用
async function initializeApp() {
  // 首先检查认证
  if (!checkAuthentication()) {
    return; // 认证失败，停止初始化
  }

  // 认证通过后，处理token刷新
  const exp = Number(jwtDecode(authToken).exp)*1000;
  try{
    if(exp){
     if(exp < Date.now()){
     console.log("token已经过期",authToken);
       const newToken = await auth.reflashToken(URL,authToken);
      document.cookie = `authToken=${newToken}; path=/;`;
       console.log("Token更新成功");
     }
    }
   }catch(e){
     window.location.href=`/welcome.html?apiUrl=${encodeURIComponent(URL)}`;
     return;
   }
}

// 启动应用
initializeApp();

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
            window.location.href = `/welcome.html?apiUrl=${encodeURIComponent(URL)}`;
        }
    });
}


