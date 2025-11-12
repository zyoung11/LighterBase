// --- 配置 ---
const GRID_SIZE = 3; // 3列
const CELL_SIZE = 100; // 每个格子的大小 (px)
const ANIMATION_DURATION = 500; // 动画持续时间 (ms)
const GAP = 20; // 项目间隔 (px)

// --- 导入 ---
import projects from "./projects";

// --- 状态管理 ---
let blocks = [];

// --- DOM 操作 ---
const app = document.getElementById('app');

// 创建网格容器
const gridContainer = document.createElement('div');
gridContainer.className = `relative`;
gridContainer.style.width = '100%';
gridContainer.style.padding = '2%';
gridContainer.style.justifyContent = 'center';
gridContainer.style.background = 'transparent';
app.appendChild(gridContainer);

// 创建项目详情区域
const projectDetails = document.createElement('div');
projectDetails.className = 'absolute right-[5%] top-[12%] w-3/5 h-4/5 bg-gray-800 p-4 hidden z-5';
projectDetails.innerHTML = `
  <h2 id="detail-name" class="text-2xl font-bold mb-4"></h2>
  <div id="detail-description" class="text-lg mb-4"></div>
  <button id="delete-btn" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Delete</button>
 `;
app.appendChild(projectDetails);

// 创建返回按钮
const backBtn = document.createElement('button');
backBtn.textContent = 'Back';
backBtn.className = 'fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded hidden z-10';
backBtn.addEventListener('click', () => {
  // 重新排列回3列网格
  blocks.forEach((block, index) => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    block.position = [row, col];
  });
  // 更新容器高度
  const rows = Math.ceil(blocks.length / GRID_SIZE);
  gridContainer.style.height = `${rows * (window.innerHeight * 0.25)}px`;
  // 禁用y轴滚动
  gridContainer.style.overflowY = 'hidden';
  // 隐藏详情和按钮
  projectDetails.classList.add('hidden');
  backBtn.classList.add('hidden');
  // 重新render
  blocks.forEach(renderBlock);
});
app.appendChild(backBtn);

// --- 辅助函数 ---
// 将网格坐标转换为像素坐标
function gridToPixel(position) {
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
function renderBlock(block) {
  if (!block.element) {
    // 首次创建元素
    block.element = document.createElement('div');
    block.element.className = `absolute bg-gray-700 rounded-md shadow-lg p-2 transition-all ease-in-out cursor-pointer`;
    block.element.style.width = '28%';
    block.element.style.height = '22vh';
    block.element.style.transitionDuration = `${ANIMATION_DURATION}ms`;
    block.element.innerHTML = `
      <div class="flex items-center mr-3">
        <img src="${block.project.project_avatar || ''}" class="w-12 h-12 rounded-full mr-2" onerror="this.style.display='none'">
        <div>
          <p class="text-gray-400 text-xs">Created: ${block.project.create_at}</p>
          <p class="text-gray-400 text-xs">Updated: ${block.project.update_at}</p>
        </div>
      </div>
      <h3 class="text-white text-sm font-bold truncate">${block.project.project_name}</h3>
      <p class="text-gray-300 text-xs truncate">${block.project.project_description}</p>
    `;
    block.element.addEventListener('click', () => selectBlock(block.id));
    gridContainer.appendChild(block.element);
  }

  // 更新位置
  const { x, y } = gridToPixel(block.position);
  block.element.style.transform = `translate(${x}px, ${y}px)`;
}

// --- 核心逻辑 ---
// 初始化区块
async function initializeBlocks() {
  // 获取token
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }
  const token = getCookie('hubAuthToken');
  if (!token) return;

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
  gridContainer.style.height = `${rows * (window.innerHeight * 0.25)}px`;
}

// 选择区块的函数
function selectBlock(selectedId) {
  const selected = blocks.find(b => b.id === selectedId);
  if (!selected) return;
console.log("查看选中的是什么？",selected.element.style)
selected.element.style.border = '2px solid white'
// selected.element.
  // 重新排列：selected to [0,0], others in order to [1,0], [2,0], etc.
  const others = blocks.filter(b => b.id !== selectedId);
  selected.position = [0, 0];
  others.forEach((b, index) => {
    b.position = [index + 1, 0];
  });

  // 更新容器高度
  const maxRow = Math.max(...blocks.map(b => b.position[0]));
  gridContainer.style.height = `${(maxRow + 1) * (window.innerHeight * 0.25)}px`;
  // 启用y轴滚动
  gridContainer.style.overflowY = 'auto';
  // gridContainer.style.border = '2px solid white'---------------------------这个容器是id='app'下的容器

  // 显示详情
  const detailName = projectDetails.querySelector('#detail-name') as HTMLElement;
  const detailDescription = projectDetails.querySelector('#detail-description') as HTMLElement;
  const deleteBtn = projectDetails.querySelector('#delete-btn') as HTMLButtonElement;
  if (detailName && detailDescription) {
    detailName.textContent = selected.project.project_name;
    detailDescription.textContent = selected.project.project_description;
  }
  // 添加删除事件
  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      // 获取token
      function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      }
      const token = getCookie('hubAuthToken');
      if (!token) return;

      // 删除项目
      await projects.deleteProject(selectedId, token);

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
        // 无项目，隐藏详情和按钮
        projectDetails.classList.add('hidden');
        backBtn.classList.add('hidden');
      }

      // 重新render
      blocks.forEach(renderBlock);
    };
  }
  projectDetails.classList.remove('hidden');

  // 显示返回按钮
  backBtn.classList.remove('hidden');

  // 重新render所有
  blocks.forEach(renderBlock);
}

// 移动区块的函数
function moveBlock(blockId, targetPosition) {
  const blockToMove = blocks.find(b => b.id === blockId);

  if (blockToMove) {
    console.log(`Moving block ${blockId} from [${blockToMove.position}] to [${targetPosition}]`);
    blockToMove.position = targetPosition;
    renderBlock(blockToMove); // 重新渲染会触发 CSS transition
  } else {
    console.error(`Block with id "${blockId}" not found.`);
  }
}

// --- 启动 ---
initializeBlocks();
