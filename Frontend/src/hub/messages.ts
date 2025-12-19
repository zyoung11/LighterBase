import projects from "./projects";

class MessageManager {
    constructor() {
        this.initEventListeners();
        this.refreshLists('all', 'all');
    }

    private initEventListeners() {
        this.setupDropdown('filter-received-btn', 'filter-received-menu', (status) => {
            this.loadReceived(status);
        });
        this.setupDropdown('filter-invited-btn', 'filter-invited-menu', (status) => {
            this.loadInvited(status);
        });
    }

    private setupDropdown(btnId: string, menuId: string, onSelect: (status: string) => void) {
        const btn = document.getElementById(btnId);
        const menu = document.getElementById(menuId);
        
        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            menu?.classList.toggle('hidden');
        });

        menu?.querySelectorAll('[data-status]').forEach(item => {
            item.addEventListener('click', (e) => {
                const status = (e.target as HTMLElement).dataset.status || 'all';
                onSelect(status);
                menu.classList.add('hidden');
            });
        });

        document.addEventListener('click', (e) => {
            if (!btn?.contains(e.target as Node) && !menu?.contains(e.target as Node)) {
                menu?.classList.add('hidden');
            }
        });
    }

    async refreshLists(receivedStatus: string, invitedStatus: string) {
        await Promise.all([
            this.loadReceived(receivedStatus),
            this.loadInvited(invitedStatus)
        ]);
    }

    async loadReceived(status: string) {
        const list = document.getElementById('received-list');
        if (!list) return;
        
        const data = await projects.getReceivedInvitations(status);
        list.innerHTML = '';

        data?.forEach(async(msg: any) => {
            // 根据内容或权限字段判断权限
            const permission = msg.content.includes('admin') ? 'admin' : 'readonly';
            const sender = await projects.getSingleUser(msg.sender_id);
            const project = await projects.getSingleProject(msg.project_id);
            const senderHTML = `<span class="text-[#46A3FF]">User#${sender.user_name.slice(0,8)}</span>`;
            const projectHTML = `<span class="text-[#46A3FF]">${project.project_name.slice(0,8)} | ${msg.project_id} (${permission})</span>`;
            
            const displayContent = `${senderHTML} has invited you to collaborate with ${projectHTML}`;

            const item = document.createElement('div');
            item.className = "bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-center";
            item.innerHTML = `
                <p class="text-[15px] text-gray-200">${displayContent}</p>
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

    async loadInvited(status: string) {
        const list = document.getElementById('invited-list');
        if (!list) return;

        const data = await projects.getSentInvitations(status);
        list.innerHTML = '';

        data?.forEach(async(msg: any) => {
            const item = document.createElement('div');
            const sender = await projects.getSingleUser(msg.sender_id);
            const project = await projects.getSingleProject(msg.project_id)
            item.className = "bg-white/5 p-4 rounded-lg border border-white/10";
            item.innerHTML = `
                <p class="text-[15px] text-gray-200">
                    You have invited <span class="text-[#46A3FF]">User#${sender.user_name.slice(0,8)}</span> to collaborate with <span class="text-[#46A3FF]">${project.project_name.slice(0,8)} | ${msg.project_id} </span>
                </p>
                <div class="flex justify-between mt-3 items-center">
                    <span class="text-[10px] text-gray-500 uppercase tracking-tighter">${new Date(msg.create_at).toLocaleString()}</span>
                    <span class="text-xs font-medium ${msg.status === 'agree' ? 'text-green-400' : 'text-yellow-400'} px-2 py-0.5 bg-white/5 rounded capitalize">${msg.status}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

(window as any).handleConfirm = async (id: number, status: string) => {
    const res = await projects.confirmInvitation(id, status);
    if (res) {
        // 使用更平滑的刷新方式，或者重新调用 loadReceived
        window.location.reload();
    }
};

new MessageManager();
