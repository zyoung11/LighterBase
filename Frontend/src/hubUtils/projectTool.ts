const GRID_SIZE = 3; // 3列 (桌面端)
const GRID_SIZE_MOBILE = 1; // 1列 (手机端)
const CELL_SIZE = 100; // 每个格子的大小 (px)
const ANIMATION_DURATION = 500; // 动画持续时间 (ms)
const GAP = 20; // 项目间隔 (px)
const GAP_MOBILE = 30; // 手机端项目间隔
import projects from "./projects";
import {theURL,URL, setBaseUrl } from "../apis/api";
import { compressImage,getCookie,parseJwt } from "../modules/tools";
import { i18n } from "../modules/i18n";
import sql from "../apis/sql";
import gojsER from "../utils/gojsER";
import sqliteParser from "sqlite-parser";
import defaultImg from "../icons/projectsDefault.jpg";
import popBlocks from "../modules/blocks";
import auth from "../apis/auth";

let token = getCookie("hubAuthToken")!

function convertToBeijingTime(utcTimeString: string): string {
  if (!utcTimeString) return '';
  const date = new Date(utcTimeString);
  const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const year = beijingDate.getFullYear();
  const month = String(beijingDate.getMonth() + 1).padStart(2, '0');
  const day = String(beijingDate.getDate()).padStart(2, '0');
  const hours = String(beijingDate.getHours()).padStart(2, '0');
  const minutes = String(beijingDate.getMinutes()).padStart(2, '0');
  const seconds = String(beijingDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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
//oldColor:bg-[#1B1E1F]
projectDetails.className = 'absolute right-[2%] top-[12%] w-3/5 h-4/5 bg-white/5 shadow-md shadow-white/30 border border-white/10 bg-opacity-90 p-4 rounded-lg hidden z-5';
projectDetails.innerHTML = `
    <div class=" flex space-x-4 justify-end mb-4">
        <div id="project-size" class="w-14 h-6 border border-white/50 rounded-full flex items-center justify-center text-white text-sm font-bold"></div>
        <button id="start-btn" class="relative overflow-hidden w-10 h-10 border border-white/50 rounded-lg flex items-center justify-center transition-all duration-500 ease-in-out hover:scale-110 hover:shadow-lg hover:border-white dynamic-glow">
         <svg class="w-6 h-6 text-white z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
         </svg>
       </button>
       <button id="download-btn" class="w-10 h-10 border border-white/50 rounded-lg flex items-center justify-center transition-colors">
         <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
         </svg>
       </button>
        <button id="invite-btn" class="w-10 h-10 border border-white/50 rounded-lg flex items-center justify-center transition-colors">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
        </svg>
        </button>
       <button id="delete-btn" class="w-10 h-10 border border-white/50 rounded-lg flex items-center justify-center transition-colors">
         <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
         </svg>
       </button>
     </div>
<div class="w-full h-[40%] flex">
  <img id="detail-avatar" class="w-[45%] h-full object-cover mb-4 rounded-md border border-white/60" src="${defaultImg}" onerror="this.src='${defaultImg}'">
  <div class="ml-3 w-[50%] h-full flex flex-col">
  <h2 id="detail-name" class="text-2xl font-bold mb-4"></h2>
  <textarea id="detail-description" class="w-full h-full bg-[#1B1E1F] border border-white/10 bg-opacity-50 text-white p-2 rounded resize-none overflow-y-auto mb-4" readonly style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; cursor: default; pointer-events: none; outline: none; box-shadow: none;"></textarea>
  </div>
</div>
  <div id="mount" class="mt-3 w-full h-[50%] rounded-sm bg-transparent "></div>
 `;
if(app)
  app.appendChild(projectDetails);

 // 手机端详情窗口（全屏）
const mobileProjectDetails = document.createElement('div');
mobileProjectDetails.id = 'mobileProjectDetails';
mobileProjectDetails.className = 'fixed inset-0 bg-black/80 z-50 hidden flex items-center justify-center md:hidden p-4';
mobileProjectDetails.innerHTML = `
  <div class="max-w-md w-full bg-[#181A1B] rounded-lg p-4 max-h-[90vh] overflow-y-auto my-8">
    <button id="mobile-close-details" class="absolute top-4 right-4 text-white text-2xl p-2">&times;</button>
    <div class="flex justify-between items-center mb-6">
      <div id="mobile-project-size" class="px-3 py-1 border border-white/50 rounded-full text-white text-sm font-bold"></div>
    </div>
    <img id="mobile-detail-avatar" class="w-full aspect-square object-cover rounded-lg mb-4" src="${defaultImg}" onerror="this.src='${defaultImg}'">
    <h2 id="mobile-detail-name" class="text-2xl font-bold mb-2"></h2>
    <textarea id="mobile-detail-description" class="w-full min-h-[100px] bg-[#1B1E1F] border border-white/10 bg-opacity-50 text-white p-3 rounded resize-none mb-4" readonly></textarea>

    <div class="flex justify-around mb-6">
      <button id="mobile-start-btn" class="w-14 h-14 border border-white/50 rounded-lg flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </button>
      <button id="mobile-download-btn" class="w-14 h-14 border border-white/50 rounded-lg flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </button>
      <button id="mobile-invite-btn" class="w-14 h-14 border border-white/50 rounded-lg flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
        </svg>
      </button>
      <button id="mobile-delete-btn" class="w-14 h-14 border border-white/50 rounded-lg flex items-center justify-center">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
    <div id="mobile-mount" class="w-full min-h-[200px] rounded-sm bg-transparent"></div>
  </div>
`;
if(app)
  app.appendChild(mobileProjectDetails);

 // 创建点击外部返回的功能
 function handleOutsideClick(event: MouseEvent) {
   if (isDetailsOpening) {
     isDetailsOpening = false;
     return;
   }
  const target = event.target as HTMLElement;
  const mobile = isMobile();

  // 手机端：点击详情窗口外部关闭
  if (mobile) {
    const mobileDetails = document.getElementById('mobileProjectDetails');
    if (mobileDetails && !mobileDetails.classList.contains('hidden')) {
      const isClickOnDetails = target.closest('#mobileProjectDetails') ||
                                target.closest('#mobile-detail-avatar') ||
                                target.closest('#mobile-detail-name') ||
                                target.closest('#mobile-detail-description') ||
                                target.closest('#mobile-start-btn') ||
                                target.closest('#mobile-download-btn') ||
                                target.closest('#mobile-invite-btn') ||
                                target.closest('#mobile-delete-btn') ||
                                target.closest('#mobile-close-details');
      if (!isClickOnDetails) {
        mobileDetails.classList.add('hidden');
        gridContainer.classList.remove('hidden');
      }
      return;
    }
  }

  // 检查是否点击在项目区块上
  const isClickOnBlock = target.closest('.absolute.flex.bg-gray-700');

  // 检查是否点击在详情区域内
    const isClickOnDetails = target.closest('#projectDetails') ||
                              target.closest('#detail-avatar') ||
                              target.closest('#detail-name') ||
                              target.closest('#detail-description') ||
                              target.closest('#start-btn') ||
                              target.closest('#download-btn') ||
                              target.closest('#invite-btn') ||
                              target.closest('#delete-btn');
    const isClickOnLogin = target.closest("#start-modal")
    const isClickOnUpdate = target.closest('#update-modal') ||
                            target.closest('#update-preview-avatar') ||
                            target.closest('#update-preview-name') ||
                            target.closest('#update-preview-description') ||
                            target.closest('#update-btn') ||
                            target.closest('#cancel-update')
     const isClickOnInvite = target.closest('#invite-modal')
     const isClickOnPopup = target.closest('.fixed.inset-0.z-\\[9999\\]')
       // 如果点击在项目区块或详情区域内，不执行返回操作
      if (isClickOnBlock || isClickOnDetails ||isClickOnLogin|| isClickOnUpdate || isClickOnInvite || isClickOnPopup || projectDetails.classList.contains('hidden')) {
      return;
    }

  // 执行返回操作（仅桌面端）
  blocks.forEach((block, index) => {
    const blockSize = isMobile() ? GRID_SIZE_MOBILE : GRID_SIZE;
    const row = Math.floor(index / blockSize);
    const col = index % blockSize;
    block.position = [row, col];
  });
  // 更新容器高度
  const blockSize = isMobile() ? GRID_SIZE_MOBILE : GRID_SIZE;
  const rows = Math.ceil(blocks.length / blockSize);
  const needsScroll = rows * (window.innerHeight * 0.25) > window.innerHeight * 0.9;
  gridContainer.style.height = needsScroll ? `${rows * (window.innerHeight * 0.25)}px` : '90vh';
  // 根据需要启用/禁用y轴滚动
  gridContainer.style.overflowY = needsScroll ? 'auto' : 'hidden';
  // 隐藏详情
  projectDetails.classList.add('hidden');
  // 重新render
  blocks.forEach(renderBlock);
}

 // 添加全局点击事件监听
 let isDetailsOpening = false;
 document.addEventListener('click', handleOutsideClick);

 function isMobile() {
  return window.innerWidth < 768;
}

// 将网格坐标转换为像素坐标
function gridToPixel(position:any) {
  const [row, col] = position;
  const containerWidth = gridContainer.clientWidth;
  const mobile = isMobile();
  const blockSize = mobile ? GRID_SIZE_MOBILE : GRID_SIZE;
  const gap = mobile ? GAP_MOBILE : GAP;
  
  const blockWidth = mobile ? containerWidth * 0.92 : containerWidth * 0.28;
  const blockHeight = mobile ? window.innerHeight * 0.2 : window.innerHeight * 0.25;
  const gridTotalWidth = mobile ? blockWidth : (blockSize * blockWidth) + ((blockSize - 1) * gap);
  const offsetX = mobile ? (containerWidth - blockWidth) / 2 : Math.max(0, (containerWidth - gridTotalWidth) / 2 * 0.7);
  
  return {
    x: offsetX + col * (blockWidth + gap),
    y: row * (blockHeight + gap),
  };
}

// 创建或更新一个区块的 DOM 元素
async function renderBlock(block:any) {
  const payload = parseJwt(token);
  const currentUserId = payload ? payload.user_id || payload.id : null;
  const mobile = isMobile();
  
  if (!block.element) {
    // 首次创建元素
    const originAvatar = block.project.project_avatar
    const compressedAvatar = await compressImage(block.project.project_avatar || '', 120, 0.4);
    block.element = document.createElement('div');
    //oldColor:bg-[#1B1E1F]
    block.element.className = `absolute flex ${mobile ? 'flex-col items-center' : 'bg-white/5 shadow-sm shadow-white/40 border border-white/10 rounded-md shadow-lg p-2'} grid grid-cols-2 transition-all ease-in-out cursor-pointer pointer-events-auto`;
    block.element.style.width = mobile ? '92%' : '28%';
    block.element.style.height = mobile ? '22vh' : '22vh';
    // block.element.style.aspectRatio = "3/1"
    block.element.style.transitionDuration = `${ANIMATION_DURATION}ms`;
    
    if (mobile) {
      // 手机端布局（与桌面端相同）
      block.element.className = `absolute flex bg-white/5 shadow-sm shadow-white/40 border border-white/10 rounded-md shadow-lg p-2 transition-all ease-in-out cursor-pointer pointer-events-auto`;
      block.element.innerHTML = `
          <img src="${originAvatar}" class="w-3/4 p-1 rounded-lg object-cover rounded"
               onerror="this.src='${defaultImg}'; this.style.display='block'; this.style.objectFit='cover';" style="aspect-ratio:1/1;">
          <div class = "flex flex-col mt-2 h-full">
            <div>
              <h3 class="text-white text-sm font-bold break-words line-clamp-1">${block.project.project_name}</h3>
              <p class="text-gray-300 text-xs break-words line-clamp-3 mt-1">${block.project.project_description}</p>
            </div>
            <div class="flex-grow"></div>
            <div class="flex flex-col justify-end pb-2">
              <div class="mb-2">
                <p class="text-gray-400 text-xs">${i18n.t('common.created')}${convertToBeijingTime(block.project.create_at)}</p>
                <p class="text-gray-400 text-xs">${i18n.t('common.updated')}${convertToBeijingTime(block.project.update_at)}</p>
              </div>
              <div class="flex justify-end items-center">
                 ${block.project.user_id !== currentUserId ? '<div class="w-2 h-2 bg-[#46A3FF] rounded-full mr-2"></div>' : ''}
                 <button id="update-btn-${block.id}" class="w-6 h-6 border border-white/50 rounded flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            </div>
        </div>
      `;
    } else {
      // 桌面端布局
      block.element.innerHTML = `
          <img src="${originAvatar}" class="w-3/4 p-1 rounded-lg object-cover rounded" 
               onerror="this.src='${defaultImg}'; this.style.display='block'; this.style.objectFit='cover';" style="aspect-ratio:1/1;">
          <div class = "flex flex-col mt-2 h-full">
            <div>
              <h3 class="text-white text-sm font-bold break-words line-clamp-1">${block.project.project_name}</h3>
              <p class="text-gray-300 text-xs break-words line-clamp-3 mt-1">${block.project.project_description}</p>
            </div>
            <div class="flex-grow"></div> <!-- Spacer to push dates and button to bottom -->
            <div class="flex flex-col justify-end pb-2"> <!-- Container for dates and button -->
              <div class="mb-2"> <!-- Dates container -->
                <p class="text-gray-400 text-xs">${i18n.t('common.created')}${convertToBeijingTime(block.project.create_at)}</p>
                <p class="text-gray-400 text-xs">${i18n.t('common.updated')}${convertToBeijingTime(block.project.update_at)}</p>
              </div>
              <div class="flex justify-end items-center"> <!-- Button container -->
                 ${block.project.user_id !== currentUserId ? '<div class="w-2 h-2 bg-[#46A3FF] rounded-full mr-2"></div>' : ''}
                 <button id="update-btn-${block.id}" class="w-6 h-6 border border-white/50 rounded flex items-center justify-center transition-colors">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </div>
            </div>
        </div>
      `;
    }
    block.element.addEventListener('click', (event: MouseEvent) => {
  event.stopPropagation();
  // console.log('点击区块:', block.id);
  // 确保元素可以接收点击事件
  block.element.style.pointerEvents = 'auto';
  selectBlock(block.id);
});

    // 添加更新按钮事件（桌面端和手机端）
    const updateBtn = block.element.querySelector(`#update-btn-${block.id}`) as HTMLButtonElement;
    if (updateBtn) {
      updateBtn.addEventListener('click', (event: MouseEvent) => {
        event.stopPropagation();
        showUpdateModal(block);
      });
    }

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
    window.location.href = 'login';
    return;
  }

  // 获取项目数据
  const projectsData = await projects.getAllProjects();
  // if (!projectsData) return;

  if (projectsData) {
    projectsData.sort((a: any, b: any) => b.project_id - a.project_id);
  }

  if (!projectsData) {
    // 没有项目时，显示中央SVG
    const emptyStateDiv = document.createElement('div');
    emptyStateDiv.className = 'flex items-center justify-center h-full';
    emptyStateDiv.innerHTML = `
      <svg t="1765968429601" class="icon" viewBox="0 0 2282 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5492" width="200" height="200">
        <path d="M3.2768 1009.371429V9.479314h137.6256l216.2688 602.463086h2.808686V9.479314H503.222857V1009.371429H368.405943L149.328457 408.312686h-2.808686V1009.371429H3.2768zM623.996343 245.408914c0-40.257829 7.021714-75.834514 21.065143-106.730057s32.768-56.641829 56.173714-77.238857c22.469486-19.6608 47.981714-34.640457 76.536686-44.938971C806.326857 6.202514 835.115886 1.053257 864.138971 1.053257s57.812114 5.149257 86.367086 15.447772A254.5664 254.5664 0 0 1 1028.447086 61.44c22.469486 20.597029 40.725943 46.343314 54.769371 77.238857 14.043429 30.895543 21.065143 66.472229 21.065143 106.730057v528.032915c0 42.130286-7.021714 78.175086-21.065143 108.1344s-32.299886 54.769371-54.769371 74.430171c-23.405714 20.597029-49.386057 36.0448-77.941029 46.343314-28.554971 10.298514-57.344 15.447771-86.367086 15.447772s-57.812114-5.149257-86.367085-15.447772a225.338514 225.338514 0 0 1-76.536686-46.343314c-23.405714-19.6608-42.130286-44.470857-56.173714-74.430171s-21.065143-66.004114-21.065143-108.1344V245.408914z m143.242971 528.032915c0 34.640457 9.596343 60.152686 28.789029 76.536685 19.192686 16.384 41.896229 24.576 68.110628 24.576 26.2144 0 48.917943-8.192 68.110629-24.576 19.192686-16.384 28.789029-41.896229 28.789029-76.536685V245.408914c0-34.640457-9.596343-60.152686-28.789029-76.536685-19.192686-16.384-41.896229-24.576-68.110629-24.576-26.2144 0-48.917943 8.192-68.110628 24.576-19.192686 16.384-28.789029 41.896229-28.789029 76.536685v528.032915zM1225.055086 1009.371429V9.479314h137.6256l216.2688 602.463086h2.808685V9.479314h143.242972V1009.371429h-134.816914l-219.077486-601.058743h-2.808686V1009.371429h-143.242971z m629.1456 0V9.479314h426.920228v134.816915h-283.677257v293.507657h247.164343v134.816914h-247.164343v293.507657h283.677257V1009.371429h-426.920228z" p-id="5493" fill="#bfbfbf"></path>
      </svg>
    `;
    gridContainer.appendChild(emptyStateDiv);
    gridContainer.style.height = '90vh';
    return;
  }

  const mobile = isMobile();
  const blockSize = mobile ? GRID_SIZE_MOBILE : GRID_SIZE;

  // 创建blocks
  for (let i = 0; i < projectsData.length; i++) {
    const row = Math.floor(i / blockSize);
    const col = i % blockSize;
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
  const rows = Math.ceil(projectsData.length / blockSize);
  // gridContainer.style.height = `${rows * (window.innerHeight * 0.25)}px`;
    gridContainer.style.height = '90vh';
}

// 选择区块的函数
function selectBlock(selectedId:number) {
  const selected = blocks.find(b => b.id === selectedId);
  if (!selected) return;
  const mobile = isMobile();
  const userId = selected.project.user_id
  if (!userId) {
    return;
  }
  const size = selected.project.project_size || 0;
  if (size > 100) {
    popBlocks.popupConfirm(`项目连接已关闭：项目大小超过限制（${size} MB > 100 MB）`);
    return;
  }
  const projectId = selected.project.project_id;
  const payload = parseJwt(token);
  const currentUserId = payload ? payload.user_id || payload.id : null;
  
  // 手机端：隐藏项目列表，显示全屏详情窗口
  if (mobile) {
    showMobileDetails(selected, userId, projectId, currentUserId);
    return;
  }
  
  // 桌面端：原来的逻辑（3列布局变成1列布局）
  // 移除所有项目的边框
  blocks.forEach(block => {
    if (block.element) {
      block.element.style.border = 'none';
    }
  });

  // 重新排列：selected to [0,0], others in order to [1,0], [2,0], etc.
  const others = blocks.filter(b => b.id !== selectedId);
  selected.position = [0, 0];
  others.forEach((b, index) => {
    b.position = [index + 1, 0];
  });

  // 更新容器高度
  const maxRow = Math.max(...blocks.map(b => b.position[0]));
  gridContainer.style.height = '90vh';
  // 启用y轴滚动
  gridContainer.style.overflowY = 'auto';

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
    detailName.textContent = selected.project.project_name;
    detailDescription.textContent = selected.project.project_description;
    const projectSizeElement = projectDetails.querySelector('#project-size') as HTMLElement;
    if (projectSizeElement) {
      const size = selected.project.project_size;
      projectSizeElement.textContent = `${size} Mb`;
      let bgColor = '';
      if (size < 50) bgColor = 'bg-green-500';
      else if (size < 80) bgColor = 'bg-yellow-500';
      else if (size < 100) bgColor = 'bg-orange-500';
      else bgColor = 'bg-red-500';
      projectSizeElement.className = `w-16 h-10 border border-white/50 rounded-full flex items-center justify-center text-white text-sm font-bold ${bgColor}`;
    }
    initializeDatabaseView(URL,projectId)
     }
   // 添加开始事件
   const desktopStartBtn = projectDetails.querySelector('#start-btn') as HTMLButtonElement;
   if (desktopStartBtn) {
     desktopStartBtn.onclick = () => {
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
    const desktopDownloadBtn = projectDetails.querySelector('#download-btn') as HTMLButtonElement;
    if (desktopDownloadBtn) {
      desktopDownloadBtn.onclick = async () => {
        if (!token) return;
        await projects.downloadProject(selectedId, token);
      };
    }

     // 添加邀请事件
     const desktopInviteBtn = projectDetails.querySelector('#invite-btn') as HTMLButtonElement;
     if (desktopInviteBtn) {
       desktopInviteBtn.onclick = async () => {
         if (selected.project.user_id !== currentUserId) {
           await popBlocks.popupConfirm("你不是当前项目的创建者");
           return;
         }

         setBaseUrl();
const projectUrl = theURL + '/' + userId + '/' + projectId;
         // console.log(projectUrl)
         setBaseUrl(projectUrl);

         const isEmpty = await auth.isLogin();

        if (!isEmpty) {
          await popBlocks.popupConfirm("请先注册用户");
          setBaseUrl();
          return;
        }
        // 创建邀请弹窗
        const inviteModal = document.createElement('div');
        inviteModal.id = 'invite-modal';
        inviteModal.className = 'fixed bg-[#1B1E1F] border border-white/50 shadow-md shadow-white/30 bg-opacity-90 p-4 rounded-lg z-50';
        inviteModal.style.width = '350px';
        inviteModal.innerHTML = `
          <div class="flex justify-center items-center mb-4">
            <h3 class="text-white text-lg font-bold">发送邀请</h3>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-center">
              <label class="block text-white mr-2">权限</label>
              <select id="invite-permissions" class="flex-1 bg-[#1B1E1F] border border-white/10 text-white p-2 rounded">
                <option value="readonly">readonly</option>
                <option value="admin">high-privileges</option>
              </select>
            </div>
            <div class="flex">
              <label class="block text-white mr-2">邮箱</label>
              <input type="email" id="invite-email" class="flex-1 bg-[#1B1E1F] border border-white/10 text-white p-2 rounded focus:outline-none focus:ring-0" placeholder="输入邮箱">
            </div>
            <button id="send-invite-btn" class="bg-white text-black px-4 py-2 rounded w-full">发送</button>
          </div>
        `;
        if(app) app.appendChild(inviteModal);

        // 定位到按钮正下方
        const rect = desktopInviteBtn.getBoundingClientRect();
        inviteModal.style.top = `${rect.bottom + 10}px`;
        inviteModal.style.left = `${rect.left -200 }px`;

        // 点击外部关闭
        const closeInviteModal = () => {
          if (inviteModal.parentNode) {
            if(app) app.removeChild(inviteModal);
          }
          document.removeEventListener('click', closeHandler);
          setBaseUrl();
        };
        const closeHandler = (e: MouseEvent) => {
          if (!inviteModal.contains(e.target as Node)) {
            closeInviteModal();
          }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 0);

        const emailInput = inviteModal.querySelector('#invite-email') as HTMLInputElement;

        const sendInvite = async () => {
          const permissions = (inviteModal.querySelector('#invite-permissions') as HTMLSelectElement).value;
          const email = emailInput.value;
          if (!email) {
            alert('请输入邮箱');
            return;
          }
          const payload = {
            "projectId": projectId,
            "permissions":permissions,
            "email":email
          };
          await projects.sendInvitation(payload);
          closeInviteModal();
        };

        // 发送邀请
        const sendBtn = inviteModal.querySelector('#send-invite-btn') as HTMLButtonElement;
        sendBtn.onclick = sendInvite;

        // 回车键触发发送
        emailInput.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            sendInvite();
          }
        };
      };
    }

    // 添加删除事件
    if (deleteBtn) {
     deleteBtn.onclick = async () => {
       if (!token) return;

       if (selected.project.user_id !== currentUserId) {
         await popBlocks.popupConfirm("你不是当前项目的创建者");
         return;
       }

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

  isDetailsOpening = true;

  // 滚动到顶部
  gridContainer.scrollTop = 0;

  // 重新render所有
  blocks.forEach(renderBlock);
}

// 显示手机端详情窗口
function showMobileDetails(selected: any, userId: string, projectId: number, currentUserId: any) {
  const mobileDetails = document.getElementById('mobileProjectDetails');
  if (!mobileDetails) return;

  // 隐藏项目列表，显示详情窗口
  gridContainer.classList.add('hidden');
  mobileDetails.classList.remove('hidden');
  mobileDetails.classList.add('flex');

  isDetailsOpening = true;

  // 填充数据
  const mobileDetailAvatar = mobileDetails.querySelector('#mobile-detail-avatar') as HTMLImageElement;
  const mobileDetailName = mobileDetails.querySelector('#mobile-detail-name') as HTMLElement;
  const mobileDetailDescription = mobileDetails.querySelector('#mobile-detail-description') as HTMLElement;
  const mobileProjectSize = mobileDetails.querySelector('#mobile-project-size') as HTMLElement;

  if (mobileDetailAvatar) {
    mobileDetailAvatar.src = selected.project.project_avatar || defaultImg;
    mobileDetailAvatar.onerror = function() {
      this.src = defaultImg;
    };
  }
  if (mobileDetailName) {
    mobileDetailName.textContent = selected.project.project_name;
  }
  if (mobileDetailDescription) {
    mobileDetailDescription.textContent = selected.project.project_description;
  }
  if (mobileProjectSize) {
    const size = selected.project.project_size;
    mobileProjectSize.textContent = `${size} Mb`;
    let bgColor = '';
    if (size < 50) bgColor = 'bg-green-500';
    else if (size < 80) bgColor = 'bg-yellow-500';
    else if (size < 100) bgColor = 'bg-orange-500';
    else bgColor = 'bg-red-500';
    mobileProjectSize.className = `px-3 py-1 border border-white/50 rounded-full text-white text-sm font-bold ${bgColor}`;
  }

  // 初始化数据库视图
  initializeDatabaseView(URL, projectId);

  // 绑定关闭按钮（返回项目列表）
  const closeBtn = mobileDetails.querySelector('#mobile-close-details') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.onclick = () => {
      mobileDetails.classList.add('hidden');
      mobileDetails.classList.remove('flex');
      gridContainer.classList.remove('hidden');
    };
  }

  // 绑定其他按钮
  const mobileStartBtn = mobileDetails.querySelector('#mobile-start-btn') as HTMLButtonElement;
  if (mobileStartBtn) {
    mobileStartBtn.onclick = () => {
      const startModal = document.getElementById('start-modal') as HTMLDivElement;
      if (startModal) {
        startModal.classList.remove('hidden');
        startModal.classList.add('flex');
        initializeStartModal(Number(userId), projectId);
      }
    };
  }

  const mobileDownloadBtn = mobileDetails.querySelector('#mobile-download-btn') as HTMLButtonElement;
  if (mobileDownloadBtn) {
    mobileDownloadBtn.onclick = async () => {
      if (!token) return;
      await projects.downloadProject(selected.id, token);
    };
  }

  const mobileInviteBtn = mobileDetails.querySelector('#mobile-invite-btn') as HTMLButtonElement;
  if (mobileInviteBtn) {
    mobileInviteBtn.onclick = async () => {
      await popBlocks.popupConfirm("手机端暂不支持邀请功能");
    };
  }

  const mobileDeleteBtn = mobileDetails.querySelector('#mobile-delete-btn') as HTMLButtonElement;
  if (mobileDeleteBtn) {
    mobileDeleteBtn.onclick = async () => {
      if (!token) return;
      if (selected.project.user_id !== currentUserId) {
        await popBlocks.popupConfirm("你不是当前项目的创建者");
        return;
      }

      const confirm = await popBlocks.popupConfirm("Are you sure to delete the project?")
      if(confirm){
        await projects.deleteProject(selected.id, token);
      }
      else{
        return;
      }

      blocks = blocks.filter(b => b.id !== selected.id);
      mobileDetails.classList.add('hidden');
      mobileDetails.classList.remove('flex');
      gridContainer.classList.remove('hidden');
      await initializeBlocks();
    };
  }
}

// 更新项目详情文本的函数
// function updateProjectDetailText(selected: any) {
//   const startBtn = projectDetails.querySelector('#start-btn') as HTMLButtonElement;
//   const deleteBtn = projectDetails.querySelector('#delete-btn') as HTMLButtonElement;
  
//   if (startBtn) startBtn.textContent = i18n.t('common.start');
//   if (deleteBtn) deleteBtn.textContent = i18n.t('common.delete');
// }

// --- 开始项目模态窗口逻辑 ---
async function initializeStartModal(userId: number, projectId: number) {
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

  const projectUrl = theURL + '/' + userId + '/' + projectId;
    setBaseUrl(projectUrl);

  const payload = parseJwt(token);
  const currentUserId = payload ? payload.user_id || payload.id : null;

  const isOwner = currentUserId == userId;
  const isEmpty = await auth.isLogin();
  const isInvited = await projects.checkInvited(projectId);

  if (!isOwner) {
    if(!isInvited){
    startEmailField.style.display = 'block';
    startEmailInput.required = true;
    // const userData = await projects.getSingleUser(userId, "http://localhost:8080");
    // if (userData && userData.email) {
    //   startEmailInput.value = userData.email;
    //   startEmailInput.readOnly = true;
    //   startEmailInput.style.cursor = 'not-allowed';
    // }
    }else{
    startEmailField.style.display = 'none';
    startEmailInput.required = false;
    }
  }else{
  if (!isEmpty) {
    startEmailField.style.display = 'block';
    startEmailInput.required = true;
  } else {
    startEmailField.style.display = 'none';
    startEmailInput.required = false;
  }
}
  startModal.onclick = (e) => {
    if (e.target === startModal) {
      startModal.classList.add('hidden');
      startModal.classList.remove('flex');
      setBaseUrl()
      startForm.reset();
    }
  };

  startForm.onsubmit = async (e) => {
    e.preventDefault();

    const hiddenUsername = document.getElementById('start-hidden-username') as HTMLInputElement;
    const hiddenPassword = document.getElementById('start-hidden-password') as HTMLInputElement;

    if (!hiddenUsername || !hiddenPassword) {
      return;
    }

    if (!isOwner ) {
      if(!isInvited){
      hiddenUsername.value = startUsernameInput.value;
      hiddenPassword.value = startPasswordInput.value;
      const success = await auth.userRegister(startUsernameInput.value, startPasswordInput.value, startEmailInput.value);
      if (success) {
        await auth.userLogin(startUsernameInput.value, startPasswordInput.value);
        }
      }else {
      await auth.userLogin(startUsernameInput.value, startPasswordInput.value);
    }

    } else{
      if(!isEmpty){
      hiddenUsername.value = startUsernameInput.value;
      hiddenPassword.value = startPasswordInput.value;
      const success = await auth.userRegister(startUsernameInput.value, startPasswordInput.value, startEmailInput.value);
      if (success) {
        await auth.userLogin(startUsernameInput.value, startPasswordInput.value);
      }
    }else {
      await auth.userLogin(startUsernameInput.value, startPasswordInput.value);

      }
    }

  };
}

// --- 数据库视图初始化 ---
async function initializeDatabaseView(baseUrl: string, projectId: number) {
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
      initialSQL += tableStatements + '\n';
      hasExistingContent = true;
      if (sqlSendBtn) {
        sqlSendBtn.disabled = true;
        sqlSendBtn.style.opacity = '0.5';
      }
    } else {
      if (sqlSendBtn) {
        sqlSendBtn.disabled = false;
        sqlSendBtn.style.opacity = '1';
      }
    }
  } catch (error) {
    console.warn("获取表数据失败，使用默认SQL:", error);
    const sqlSendBtn = document.getElementById('sql-send') as HTMLButtonElement;
    if (sqlSendBtn) {
      sqlSendBtn.disabled = false;
      sqlSendBtn.style.opacity = '1';
    }
  }

  const { initSqlEditor, setSqlValue } = await import('../modules/sqlEditor');

  const mountId = isMobile() ? 'mobile-mount' : 'mount';
  
  initSqlEditor(hasExistingContent, initialSQL.length, initialSQL, "sql-input-wrapper", async (sqlValue) => {
    const sqlNotice = document.getElementById('sql-notice') as HTMLElement;
    try {
      const ast = sqliteParser(sqlValue);
      const tables = gojsER.extract(ast);
      requestAnimationFrame(() => {
        gojsER.drawER(tables, mountId);
      });
    } catch (e) {
      console.error("SQL解析错误:", e);
      if (e instanceof Error && e.message) {
        console.error(e.message);
      }
    }
  });

  try {
    const ast = sqliteParser(initialSQL);
    const tables = gojsER.extract(ast);
    requestAnimationFrame(() => {
      gojsER.drawER(tables, mountId);
    });
  } catch (e) {
    console.error("初始SQL解析错误:", e);
  }
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

  previewName.value = block.project.project_name;
  previewDescription.value = block.project.project_description;
  previewAvatar.src = block.project.project_avatar || defaultImg;

  updateModal.classList.remove('hidden');
  updateModal.classList.add('flex');

  updateModal.onclick = (e) => {
    if (e.target === updateModal) {
      updateModal.classList.add('hidden');
      updateModal.classList.remove('flex');
    }
  };

  previewAvatar.onclick = () => avatarInput.click();
  avatarInput.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      previewAvatar.src = window.URL.createObjectURL(file);
    }
  };

  cancelBtn.onclick = () => {
    updateModal.classList.add('hidden');
    updateModal.classList.remove('flex');
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const name = previewName.value || block.project.project_name || 'My Project';
    const description = previewDescription.value || block.project.project_description || 'This is my project description';
    const file = avatarInput.files?.[0];
    let avatar = block.project.project_avatar;
    if (file) {
      avatar = await compressImage(window.URL.createObjectURL(file), 120, 0.4);
    }
    const data = { project_name: name, project_description: description, project_avatar: avatar };
    await projects.updateProject(block.id, data, token);
    updateModal.classList.add('hidden');
    updateModal.classList.remove('flex');
    location.reload();
  };
}

// --- 启动 ---
initializeBlocks();
