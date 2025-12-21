import projects from "../hubUtils/projects";

const userTableBody = document.getElementById('userTableBody') as HTMLTableSectionElement;
const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;

/**
 * 渲染用户列表
 */
async function loadUsers() {
    userTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Loading users...</td></tr>';
    
    try {
        const users = await projects.getAllUsers();
        
        if (!users || !Array.isArray(users)) {
            userTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-red-400">Failed to load users or unauthorized.</td></tr>';
            return;
        }

        userTableBody.innerHTML = ''; // 清空加载状态

        users.forEach((user: any) => {
            const row = document.createElement('tr');
            row.className = "hover:bg-white/5 transition-colors group";
            row.innerHTML = `
                <td class="px-6 py-4 font-mono text-sm text-gray-400">${user.user_id}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-3">
                        <img src="${user.user_avatar || '../icons/default-avatar.png'}" class="w-8 h-8 rounded-full border border-white/10">
                        <span class="font-medium text-white">${user.user_name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-400">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${new Date(user.create_at).toLocaleDateString()}</td>
                <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="editUser(${user.user_id})" class="text-[#46A3FF] hover:underline text-sm">Edit</button>
                    <button onclick="handleDelete(${user.user_id})" class="text-red-400 hover:text-red-300 text-sm ml-4">Delete</button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Admin Load Error:", error);
    }
}

/**
 * 删除用户处理
 */
(window as any).handleDelete = async (id: number) => {
    if (confirm(`Are you sure you want to delete user #${id}?`)) {
        const result = await projects.deleteUser(id);
        // deleteUser 返回 null 表示成功 (204 No Content)
        if (result === null) {
            alert("User deleted successfully");
            loadUsers();
        } else {
            alert("Delete failed");
        }
    }
};

/**
 * 编辑用户处理 (简单示例，实际可弹出 Modal)
 */
(window as any).editUser = async (id: number) => {
    const newName = prompt("Enter new username:");
    if (!newName) return;

    const updateData = {
        user_name: newName,
        password: "", // 注意：实际应用中不应留空或需逻辑处理
        user_avatar: ""
    };

    const res = await projects.updateUser(id, updateData);
    if (res) {
        alert("Update successful");
        loadUsers();
    }
};

// 初始化加载
refreshBtn.addEventListener('click', loadUsers);
loadUsers();
