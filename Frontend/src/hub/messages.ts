import projects from "./projects";
import defaultImg from "../icons/projectsDefault.jpg";
import auth from "../apis/auth";
import { theURL,setBaseUrl } from "../apis/api";
import blocks from "../modules/blocks";
// --- 类型定义 ---
interface Project {
    project_id: number;
    user_id: number;
    project_name: string;
    project_description: string;
    project_avatar: string;
    create_at: string;
    update_at: string;
}
const init = () => {
    // 初始化筛选下拉菜单
    setupStatusDropdown('filter-received-btn', 'filter-received-menu', 'received-current-status', (status) => {
        loadReceivedInvitations(status);
    });

    setupStatusDropdown('filter-invited-btn', 'filter-invited-menu', 'invited-current-status', (status) => {
        loadSentInvitations(status);
    });

    // 初始化项目选择与邀请逻辑
    initProjectInviteWorkflow();

    // 初始加载列表
    loadReceivedInvitations('all');
    loadSentInvitations('all');
};

/**
 * 通用下拉菜单逻辑
 * 处理：点击切换、选择后更新文字、点击外部关闭
 */
function setupStatusDropdown(btnId: string, menuId: string, labelId: string, onSelect: (status: string) => void) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    const label = document.getElementById(labelId);

    btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        menu?.classList.toggle('hidden');
    });

    menu?.querySelectorAll('[data-status]').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget as HTMLElement;
            const status = target.dataset.status || 'all';
            
            // 更新显示文本 (白色文字)
            if (label) label.textContent = target.textContent;
            
            onSelect(status);
            menu.classList.add('hidden');
        });
    });

    document.addEventListener('click', (e) => {
        if (!btn?.contains(e.target as Node)) menu?.classList.add('hidden');
    });
}

/**
 * 项目邀请流程：+按钮 -> 下拉栏 -> 弹窗
 */
function initProjectInviteWorkflow() {
    const addBtn = document.getElementById('add-invite-btn');
    const selectorMenu = document.getElementById('project-selector-menu');
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal-btn');

    // 1. 点击 + 号显示/隐藏项目选择器
    addBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectorMenu) return;

        if (selectorMenu.classList.contains('hidden')) {
            const projectsData = await projects.getAllProjects();
            renderProjectSelector(projectsData);
            selectorMenu.classList.remove('hidden');
        } else {
            selectorMenu.classList.add('hidden');
        }
    });

    // 2. 渲染项目选择下拉栏
    function renderProjectSelector(projectsData: Project[]) {
        if (!selectorMenu) return;
        selectorMenu.innerHTML = '';

        if (!projectsData || projectsData.length === 0) {
            selectorMenu.innerHTML = `<div class="p-4 text-gray-500 text-sm italic text-center">No projects available</div>`;
            return;
        }

        projectsData.forEach(proj => {
            const item = document.createElement('div');
            item.className = "flex items-center p-3 hover:bg-white/10 cursor-pointer transition border-b border-white/5 last:border-0";
            item.innerHTML = `
                <img src="${proj.project_avatar || defaultImg}" class="w-8 h-8 rounded object-cover mr-3 border border-white/10">
                <span class="text-sm text-gray-200 truncate font-medium">${proj.project_name}</span>
            `;
            item.onclick = async() => {
                console.log("查看选中的：",proj)
                const userId = proj.user_id;
                const projectId = proj.project_id;
                const projectUrl = `${theURL}/${userId}/${projectId}`;
                setBaseUrl(projectUrl)
                const isEmpty = await auth.isLogin();
                if(isEmpty){
                    openInviteModal(proj);
                    selectorMenu.classList.add('hidden');
                    setBaseUrl()
                }else{
                    blocks.popupConfirm("请先注册")                    
                    setBaseUrl()
                    return
                }
            };
            selectorMenu.appendChild(item);
        });
    }

    // 3. 点击外部关闭选择器
    document.addEventListener('click', (e) => {
        if (!selectorMenu?.contains(e.target as Node)) selectorMenu?.classList.add('hidden');
    });

    // 4. 关闭弹窗
    const closeModal = () => overlay?.classList.add('hidden');
    closeBtn?.addEventListener('click', closeModal);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

/**
 * 打开中央邀请弹窗
 */
async function openInviteModal(project: Project) {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    // 填充项目区块内容 (样式参考 projectTool.ts)
    (document.getElementById('modal-proj-img') as HTMLImageElement).src = project.project_avatar || defaultImg;
    (document.getElementById('modal-proj-name') as HTMLElement).textContent = project.project_name;
    (document.getElementById('modal-proj-desc') as HTMLElement).textContent = project.project_description || "No description.";
    (document.getElementById('modal-proj-created') as HTMLElement).textContent = `Created: ${new Date(project.create_at).toLocaleDateString()}`;
    (document.getElementById('modal-proj-updated') as HTMLElement).textContent = `Updated: ${new Date(project.update_at).toLocaleDateString()}`;

    // 重置输入
    const emailInput = document.getElementById('modal-invite-email') as HTMLInputElement;
    const permSelect = document.getElementById('modal-invite-permission') as HTMLSelectElement;
    emailInput.value = '';

    overlay.classList.remove('hidden');

    // 绑定发送按钮
    const sendBtn = document.getElementById('modal-send-btn');
    if (sendBtn) {
        sendBtn.onclick = async () => {
            const email = emailInput.value.trim();
            if (!email) return alert("Please enter an email");

            const success = await projects.sendInvitation({
                email: email,
                permissions: permSelect.value,
                projectId: project.project_id
            });

            if (success) {
                overlay.classList.add('hidden');
                loadSentInvitations('all'); // 刷新列表
            }
        };
    }
}

/**
 * 加载收到的邀请
 */
async function loadReceivedInvitations(status: string) {
    const list = document.getElementById('received-list');
    if (!list) return;

    const data = await projects.getReceivedInvitations(status);
    list.innerHTML = '';

    data?.forEach(async (msg: any) => {
        const permission = msg.content.includes('admin') ? 'admin' : 'readonly';

        const item = document.createElement('div');
        item.className = "bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-center hover:border-white/20 transition";
        item.innerHTML = `
            <p class="text-[14px] text-gray-300">
                <span class="text-[#46A3FF] font-medium">${msg.sender.user_name}</span> 
                has invited you to collaborate with <span class="text-[#46A3FF] font-medium">${msg.project.project_name} | ${msg.project_id}</span> <span class="text-[#46A3FF]">(${permission})</span>
            </p>
            ${msg.status === 'pending' ? `
                <div class="flex space-x-2 ml-4">
                    <button onclick="handleConfirm(${msg.notification_id}, 'agree')" class="px-3 py-1 bg-[#46A3FF] rounded text-xs text-white hover:bg-blue-600 transition">Agree</button>
                    <button onclick="handleConfirm(${msg.notification_id}, 'disagree')" class="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400 hover:bg-red-500 hover:text-white transition">Reject</button>
                </div>
            ` : `
                <span class="text-xs text-gray-500 italic ml-4 capitalize">${msg.status}</span>
            `}
        `;
        list.appendChild(item);
    });
}

/**
 * 加载发出的邀请
 */
async function loadSentInvitations(status: string) {
    const list = document.getElementById('invited-list');
    if (!list) return;

    const data = await projects.getSentInvitations(status);
    list.innerHTML = '';

    data?.forEach(async (msg: any) => {
        const item = document.createElement('div');
        item.className = "bg-white/5 p-4 rounded-lg border border-white/10 hover:border-white/20 transition";
        item.innerHTML = `
            <p class="text-[14px] text-gray-300">
                You have invited <span class="text-[#46A3FF] font-medium">${msg.receiver.user_name || 'User'}</span> to collaborate with  <span class="text-[#46A3FF] font-medium">${msg.project.project_name} | ${msg.project_id}</span>
            </p>
            <div class="flex justify-between mt-3 items-center">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest">${msg.create_at}</span>
                <span class="text-xs font-medium ${msg.status === 'agree' ? 'text-green-400' : 'text-yellow-400'} px-2 py-0.5 bg-white/5 rounded capitalize border border-white/5">${msg.status}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

(window as any).handleConfirm = async (id: number, status: string) => {
    const res = await projects.confirmInvitation(id, status);
    if (res) {
        loadReceivedInvitations('all');
    }
};

// 启动
document.addEventListener('DOMContentLoaded', init);
