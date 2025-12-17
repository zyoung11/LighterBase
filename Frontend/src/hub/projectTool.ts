const GRID_SIZE = 3; // 3列
const CELL_SIZE = 100; // 每个格子的大小 (px)
const ANIMATION_DURATION = 500; // 动画持续时间 (ms)
const GAP = 20; // 项目间隔 (px)
import projects from "./projects";
import {URL, setBaseUrl } from "../apis/api";
import { compressImage,getCookie } from "../modules/tools";
import { i18n } from "../modules/i18n";
import sql from "../apis/sql";
import gojsER from "../utils/gojsER";
import sqliteParser from "sqlite-parser";
import defaultImg from "../icons/projectsDefault.jpg";
import popBlocks from "../modules/blocks";
import auth from "../apis/auth";

let token = getCookie("hubAuthToken")!
let theURL = "http://localhost:8080"
// let theURL = "http://www.smallwoodice.cn:8080"


let blocks:any[] = [];
const app = document.getElementById('app');
const gridContainer = document.createElement('div');
gridContainer.className = `relative`;
gridContainer.style.width = '100%';
gridContainer.style.height = '90vh';
gridContainer.style.padding = '2%';
gridContainer.style.justifyContent = 'center';
gridContainer.style.background = 'transparent';
if(app)
app.appendChild(gridContainer);

// 创建项目详情区域
const projectDetails = document.createElement('div');
projectDetails.id = 'projectDetails';
projectDetails.className = 'absolute right-[5%] top-[12%] w-3/5 h-4/5 bg-[#1B1E1F] shadow-md shadow-white/30 bg-opacity-90 p-4 rounded-lg hidden z-5';
projectDetails.innerHTML = `
<div class="w-full h-[40%] flex">
  <img id="detail-avatar" class="w-[45%] h-full object-cover mb-4 rounded-md" src="${defaultImg}" onerror="this.src='${defaultImg}'">
  <div class="ml-3 w-[50%] h-full flex flex-col">
  <h2 id="detail-name" class="text-2xl font-bold mb-4"></h2>
  <textarea id="detail-description" class="w-full h-full bg-[#1B1E1F] border border-white/10 bg-opacity-50 text-white p-2 rounded resize-none overflow-y-auto mb-4" readonly style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; cursor: default; pointer-events: none; outline: none; box-shadow: none;"></textarea>
  </div>
</div>
  <div id="mount" class="mt-3 w-full h-[50%] rounded-sm bg-[#1B1E1F] "></div>
   <div class="absolute bottom-4 right-4 flex space-x-4">
     <button id="start-btn" class="w-10 h-10 bg-[#3D8FEF] hover:bg-[#46A3FF] rounded-lg flex items-center justify-center transition-colors">
       <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
       </svg>
     </button>
     <button id="download-btn" class="w-10 h-10 bg-[#E8A948] hover:bg-[#F0B151] rounded-lg flex items-center justify-center transition-colors">
       <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
       </svg>
     </button>
     <button id="delete-btn" class="w-10 h-10 bg-[#EF4B3D] hover:bg-[#FF6B6B] rounded-lg flex items-center justify-center transition-colors">
       <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
       </svg>
     </button>
   </div>
 `;
if(app)
  app.appendChild(projectDetails);

// 创建点击外部返回的功能
function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  // 检查是否点击在项目区块上
  const isClickOnBlock = target.closest('.absolute.flex.bg-gray-700');
  
  // 检查是否点击在详情区域内
    const isClickOnDetails = target.closest('#projectDetails') ||
                             target.closest('#detail-avatar') ||
                             target.closest('#detail-name') ||
                             target.closest('#detail-description') ||
                             target.closest('#start-btn') ||
                             target.closest('#download-btn') ||
                             target.closest('#delete-btn');
   const isClickOnLogin = target.closest("#start-modal")
   const isClickOnUpdate = target.closest('#update-modal') ||
                           target.closest('#update-preview-avatar') ||
                           target.closest('#update-preview-name') ||
                           target.closest('#update-preview-description') ||
                           target.closest('#update-btn') ||
                           target.closest('#cancel-update')
   // 如果点击在项目区块或详情区域内，不执行返回操作
   if (isClickOnBlock || isClickOnDetails ||isClickOnLogin|| isClickOnUpdate || projectDetails.classList.contains('hidden')) {
     return;
   }
  
  // 执行返回操作
  blocks.forEach((block, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    block.position = [row, col];
  });
  // 更新容器高度
  const rows = Math.ceil(blocks.length / GRID_SIZE);
  gridContainer.style.height = '90vh';
  // 禁用y轴滚动
  gridContainer.style.overflowY = 'hidden';
  // 隐藏详情
  projectDetails.classList.add('hidden');
  // 重新render
  blocks.forEach(renderBlock);
}

// 添加全局点击事件监听
document.addEventListener('click', handleOutsideClick);

// --- 辅助函数 ---
// 将网格坐标转换为像素坐标
function gridToPixel(position:any) {
  const [row, col] = position;
  const containerWidth = window.innerWidth;
  const blockWidth = containerWidth * 0.28;
  const blockHeight = window.innerHeight * 0.25;
  return {
    x: col * (blockWidth + GAP),
    y: row * (blockHeight + GAP),
  };
}

// 创建或更新一个区块的 DOM 元素
async function renderBlock(block:any) {
  if (!block.element) {
    // 首次创建元素
    const originAvatar = block.project.project_avatar
    const compressedAvatar = await compressImage(block.project.project_avatar || '', 120, 0.4);
    block.element = document.createElement('div');
    block.element.className = `absolute flex bg-[#1B1E1F] shadow-sm shadow-white/40 rounded-md shadow-lg p-2 transition-all ease-in-out cursor-pointer pointer-events-auto`;
    block.element.style.width = '28%';
    block.element.style.height = '22vh';
    block.element.style.transitionDuration = `${ANIMATION_DURATION}ms`;
    block.element.innerHTML = `
        <img src="${originAvatar}" class="w-[16vh] h-[16vh] p-1 rounded-md object-cover rounded" 
             onerror="this.src='${defaultImg}'; this.style.display='block'; this.style.objectFit='cover';">
        <div class = "flex flex-col flex-1 ml-2 mt-2">
        <h3 class="text-white text-sm font-bold break-words line-clamp-1 min-h-5">${block.project.project_name}</h3>
        <p class="text-gray-300 text-xs break-words line-clamp-3 min-h-12 mt-1">${block.project.project_description}</p>
        <div class="mt-3">
          <p class="text-gray-400 text-xs">${i18n.t('common.created')}${block.project.create_at}</p>
          <p class="text-gray-400 text-xs">${i18n.t('common.updated')}${block.project.update_at}</p>
        </div>
        <div class="flex justify-end mt-2">
          <button id="update-btn-${block.id}" class="w-6 h-6 bg-[#E8A948] hover:bg-[#F0B151] rounded flex items-center justify-center transition-colors">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
</div>
    `;
    block.element.addEventListener('click', (event: MouseEvent) => {
  event.stopPropagation();
  console.log('Block clicked:', block.id);
  // 确保元素可以接收点击事件
  block.element.style.pointerEvents = 'auto';
  selectBlock(block.id);
});

    // 添加更新按钮事件
    const updateBtn = block.element.querySelector(`#update-btn-${block.id}`) as HTMLButtonElement;
    updateBtn.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      showUpdateModal(block);
    });

// 确保元素可以接收点击事件
block.element.style.pointerEvents = 'auto';
    gridContainer.appendChild(block.element);
  }

  // 更新位置
  const { x, y } = gridToPixel(block.position);
  block.element.style.transform = `translate(${x}px, ${y}px)`;
}

// 初始化区块
async function initializeBlocks() {
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // 获取项目数据
  const projectsData = await projects.getAllProjects(token);
  if (!projectsData) return;

  // 创建blocks
  for (let i = 0; i < projectsData.length; i++) {
    const row = Math.floor(i / GRID_SIZE);
    const col = i % GRID_SIZE;
    const block = {
      id: projectsData[i].project_id,
      position: [row, col],
      element: null,
      project: projectsData[i],
    };
    blocks.push(block);
    renderBlock(block);
  }

  // 设置容器高度
  const rows = Math.ceil(projectsData.length / GRID_SIZE);
  // gridContainer.style.height = `${rows * (window.innerHeight * 0.25)}px`;
    gridContainer.style.height = '90vh';
}

// 选择区块的函数
function selectBlock(selectedId:number) {
  const selected = blocks.find(b => b.id === selectedId);
  if (!selected) return;
function parseJwt(token: string) {
        try {
          const base64Url = token.split('.')[1];
const base64 = (base64Url || '').replace(/-/g, '+').replace(/_/g, '/');
const jsonPayload = decodeURIComponent(atob(base64 || '').split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(jsonPayload);
        } catch (e) {
          console.error('Token parsing failed:', e);
          return null;
        }
      }
  const payload = parseJwt(token);
  const userId = payload ? payload.user_id || payload.id : null;
  if (!userId) {
     console.error('Unable to get userid from token');
    return;
  }

  const projectId = selected.project.project_id;
  // const sqlUrl = `http://localhost:8080/${userId}/${projectId}`;
  // 移除所有项目的边框
  blocks.forEach(block => {
    if (block.element) {
      block.element.style.border = 'none';
    }
  });

  // 移除选中项目的边框
  // selected.element.style.border = '2px solid white';
// selected.element.
  // 重新排列：selected to [0,0], others in order to [1,0], [2,0], etc.
  const others = blocks.filter(b => b.id !== selectedId);
  selected.position = [0, 0];
  others.forEach((b, index) => {
    b.position = [index + 1, 0];
  });

  // 更新容器高度
  const maxRow = Math.max(...blocks.map(b => b.position[0]));
  // gridContainer.style.height = `${(maxRow + 1) * (window.innerHeight * 0.25)}px`;
  gridContainer.style.height = '90vh';
  // 启用y轴滚动
  gridContainer.style.overflowY = 'auto';
  // gridContainer.style.border = '2px solid white'---------------------------这个容器是id='app'下的容器

  // 显示详情
  const detailAvatar = projectDetails.querySelector('#detail-avatar') as HTMLImageElement;
  const detailName = projectDetails.querySelector('#detail-name') as HTMLElement;
  const detailDescription = projectDetails.querySelector('#detail-description') as HTMLElement;
  const deleteBtn = projectDetails.querySelector('#delete-btn') as HTMLButtonElement;
  if (detailAvatar && detailName && detailDescription) {
    detailAvatar.src = selected.project.project_avatar || defaultImg;
    detailAvatar.onerror = function() {
      this.src =defaultImg;
    };
    // compressImage(selected.project.project_avatar || '', 300, 0.6).then(compressedSrc => {
    //   detailAvatar.src = compressedSrc;
    // });
    detailName.textContent = selected.project.project_name;
    detailDescription.textContent = selected.project.project_description;
    initializeDatabaseView(URL,projectId)
     }
   // 添加开始事件
   const startBtn = projectDetails.querySelector('#start-btn') as HTMLButtonElement;
   if (startBtn) {
     startBtn.onclick = () => {
       // 显示开始模态窗口
       const startModal = document.getElementById('start-modal') as HTMLDivElement;
       if (startModal) {
         startModal.classList.remove('hidden');
         startModal.classList.add('flex');
         // 初始化模态窗口
         initializeStartModal(userId, projectId);
       }
     };
    }

   // 添加下载事件
   const downloadBtn = projectDetails.querySelector('#download-btn') as HTMLButtonElement;
   if (downloadBtn) {
     downloadBtn.onclick = async () => {
       if (!token) return;
       await projects.downloadProject(selectedId, token);
     };
   }

   // 添加删除事件
   if (deleteBtn) {
    deleteBtn.onclick = async () => {
      if (!token) return;

       const confirm = await popBlocks.popupConfirm("Are you sure to delete the project?")
      if(confirm){
      // 删除项目
      await projects.deleteProject(selectedId, token);
      }
      else{
        return;
      }
      // 移除DOM元素
      const removedBlock = blocks.find(b => b.id === selectedId);
      if (removedBlock && removedBlock.element) {
        gridContainer.removeChild(removedBlock.element);
      }

      // 移除block
      blocks = blocks.filter(b => b.id !== selectedId);

      // 重新排列到第一列
      blocks.forEach((b, index) => b.position = [index, 0]);

      // 更新高度
      gridContainer.style.height = `${blocks.length * (window.innerHeight * 0.25)}px`;

      // 如果有blocks，选择第一个
      if (blocks.length > 0) {
        selectBlock(blocks[0].id);
      } else {
        // 无项目，隐藏详情
        projectDetails.classList.add('hidden');
      }

      // 重新render
      blocks.forEach(renderBlock);
    };
  }
  projectDetails.classList.remove('hidden');

  // 滚动到顶部
  gridContainer.scrollTop = 0;

  // 重新render所有
  blocks.forEach(renderBlock);

  // 监听语言变化事件，更新项目详情文本
  // window.addEventListener('languageChanged', () => {
  //   updateProjectDetailText(selected);
  // });
}

async function initializeDatabaseView(hubUrl:string,projectId:number) {
  // const textarea = document.getElementById('hub-ER') as HTMLTextAreaElement | null;
  // if (textarea) {
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
      if(token){
      const tableStatements = await sql.hubLastestSql(hubUrl,projectId);
      if (tableStatements) {
        initialSQL += tableStatements + '\n';
      }
      }
    } catch (error) {
       console.warn("Failed to get table data, using default SQL:", error);
    }
    
    // textarea.value = initialSQL;

    try {
      const ast = sqliteParser(initialSQL);
      const tables = gojsER.extract(ast);
      console.log("提取的表结构:", tables);
      requestAnimationFrame(() => { 
        gojsER.drawER(tables, 'mount');
      });
    } catch (error) {
       console.error("Initial SQL parsing error:", error);
    }
  // }
}




// 更新项目详情文本的函数
// function updateProjectDetailText(selected: any) {
//   const startBtn = projectDetails.querySelector('#start-btn') as HTMLButtonElement;
//   const deleteBtn = projectDetails.querySelector('#delete-btn') as HTMLButtonElement;
  
//   if (startBtn) startBtn.textContent = i18n.t('common.start');
//   if (deleteBtn) deleteBtn.textContent = i18n.t('common.delete');
// }

// --- 开始项目模态窗口逻辑 ---
async function initializeStartModal(userId: string, projectId: number) {
  const startModal = document.getElementById('start-modal') as HTMLDivElement;
  const startForm = document.getElementById('start-form') as HTMLFormElement;
  const startUsernameInput = document.getElementById('start-username') as HTMLInputElement;
  const startPasswordInput = document.getElementById('start-password') as HTMLInputElement;
  const startEmailInput = document.getElementById('start-email') as HTMLInputElement;
  const startEmailField = document.getElementById('start-email-field') as HTMLDivElement;

  // 检查必要元素是否存在
  if (!startModal || !startForm || !startUsernameInput || !startPasswordInput || !startEmailInput || !startEmailField) {
     console.error('Necessary elements for login modal not found');
    return;
  }


    const projectUrl = `${theURL}/${userId}/${projectId}`;
    // const projectUrl = `http://www.smallwoodice.cn:8080/${userId}/${projectId}`;
    console.log(projectUrl)
    setBaseUrl(projectUrl);

  // 检查是否为空数据库
  const isEmpty = await auth.isLogin();
  if (!isEmpty) {
    startEmailField.style.display = 'block';
    startEmailInput.required = true;
  } else {
    startEmailField.style.display = 'none';
    startEmailInput.required = false;
  }

  // 点击背景关闭模态窗口
  startModal.onclick = (e) => {
    if (e.target === startModal) {
      startModal.classList.add('hidden');
      startModal.classList.remove('flex');
      setBaseUrl()
      startForm.reset();
    }
  };

  // 表单提交
  startForm.onsubmit = async (e) => {
    e.preventDefault();

    const hiddenUsername = document.getElementById('start-hidden-username') as HTMLInputElement;
    const hiddenPassword = document.getElementById('start-hidden-password') as HTMLInputElement;

    if (!hiddenUsername || !hiddenPassword) {
      return;
    }

    if (!isEmpty) {
      // 设置注册输入
      hiddenUsername.value = startUsernameInput.value;
      hiddenPassword.value = startPasswordInput.value;
      const success = await auth.userRegister(startUsernameInput.value, startPasswordInput.value, startEmailInput.value);
      if (success) {
        await auth.userLogin(startUsernameInput.value, startPasswordInput.value);
      }
    } else {
      await auth.userLogin(startUsernameInput.value, startPasswordInput.value);
    }

    // 设置URL并跳转
    window.location.href = `/index?apiUrl=${encodeURIComponent(projectUrl)}`;
  };
}

// --- 更新项目模态窗口逻辑 ---
async function showUpdateModal(block: any) {
  const updateModal = document.getElementById('update-modal') as HTMLDivElement;
  const previewName = updateModal.querySelector('#update-preview-name') as HTMLInputElement;
  const previewDescription = updateModal.querySelector('#update-preview-description') as HTMLTextAreaElement;
  const previewAvatar = updateModal.querySelector('#update-preview-avatar') as HTMLImageElement;
  const avatarInput = updateModal.querySelector('#update-project-avatar') as HTMLInputElement;
  const form = updateModal.querySelector('#update-project-form') as HTMLFormElement;
  const cancelBtn = updateModal.querySelector('#cancel-update') as HTMLButtonElement;

  // 填充数据
  previewName.value = block.project.project_name;
  previewDescription.value = block.project.project_description;
  previewAvatar.src = block.project.project_avatar || defaultImg;

  // 显示modal
  updateModal.classList.remove('hidden');
  updateModal.classList.add('flex');

  // 点击外部关闭
  updateModal.onclick = (e) => {
    if (e.target === updateModal) {
      updateModal.classList.add('hidden');
      updateModal.classList.remove('flex');
    }
  };

  // 图片上传
  previewAvatar.onclick = () => avatarInput.click();
  avatarInput.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      previewAvatar.src = window.URL.createObjectURL(file);
    }
  };

  // 取消
  cancelBtn.onclick = () => {
    updateModal.classList.add('hidden');
    updateModal.classList.remove('flex');
  };

  // 表单提交
  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = previewName.value;
    const description = previewDescription.value;
    const file = avatarInput.files?.[0];
    let avatar = block.project.project_avatar;
    if (file) {
      avatar = await compressImage(window.URL.createObjectURL(file), 120, 0.4);
    }
    const data = { project_name: name, project_description: description, project_avatar: avatar };
    await projects.updateProject(block.id, data, token);
    updateModal.classList.add('hidden');
    updateModal.classList.remove('flex');
    // 重新加载页面以更新
    location.reload();
  };
}

// --- 启动 ---
initializeBlocks();
