import uPlot from "uplot";
import projects from "../hubUtils/projects";
import { getCookie } from "../modules/tools";

const userTableBody = document.getElementById('userTableBody') as HTMLTableSectionElement;
const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
let token = getCookie("hubAuthToken")!;

// --- 状态管理 ---
const MAX_POINTS = 60; // 保留最近 30 秒数据 (60 * 500ms)
let dataStackCpu: [number[], number[], number[]] = [[], [], []]; // [timestamp, pid_cpu, os_cpu]
let dataStackRam: [number[], number[], number[]] = [[], [], []]; // [timestamp, ram, os_ram]
let cpuChart: uPlot;
let ramChart: uPlot;
let maxRam = 0;

/**
 * 初始化 CPU uPlot 图表
 */
function initCpuChart() {
    const container = document.getElementById('cpuChart')!;
    const opts: uPlot.Options = {
        width: container.clientWidth,
        height: 160,
        series: [
            {}, // 时间轴
            {
                label: "PID CPU (%)",
                stroke: "#46A3FF",
                width: 2,
                fill: "rgba(70, 163, 255, 0.1)",
            },
            {
                label: "OS CPU (%)",
                stroke: "#10B981",
                width: 2,
                fill: "rgba(16, 185, 129, 0.1)",
            }
        ],
        axes: [
            { show: false },
            { grid: { stroke: "#2D2D2D" }, font: "10px Arial", stroke: "#A0A0A0" }
        ],
        scales: {
            cpu: {
                range: [0, 100]
            }
        },
        cursor: { show: true, drag: { setScale: false } },
        legend: { show: true }
    };

    cpuChart = new uPlot(opts, dataStackCpu, container);
}

/**
 * 初始化 RAM uPlot 图表
 */
function initRamChart() {
    const container = document.getElementById('ramChart')!;
    const opts: uPlot.Options = {
        width: container.clientWidth,
        height: 160,
        series: [
            {}, // 时间轴
            {
                label: "RAM (MB)",
                stroke: "#10B981",
                width: 2,
                fill: "rgba(16, 185, 129, 0.1)",
            },
            {
                label: "OS Memory (MB)",
                stroke: "#F59E0B",
                width: 2,
                fill: "rgba(245, 158, 11, 0.1)",
            }
        ],
        axes: [
            { show: false },
            { grid: { stroke: "#2D2D2D" }, font: "10px Arial", stroke: "#A0A0A0", scale: 'ram' }
        ],
        scales: {
            ram: {
                range: [0, maxRam || 1024] // 默认1GB
            }
        },
        cursor: { show: true, drag: { setScale: false } },
        legend: { show: true }
    };

    ramChart = new uPlot(opts, dataStackRam, container);
}

/**
 * 核心：每 500ms 执行一次的监控函数
 */
async function startMonitoring() {
    setInterval(async () => {
        try {
            const start = performance.now();
            const metrics = await (projects as any).getMetrics();
            const end = performance.now();

            // 更新实时数值
            const rt = (end - start).toFixed(0);
            document.getElementById('rtDisplay')!.innerText = `RT: ${rt}ms`;
            document.getElementById('connCount')!.innerText = metrics.pid.conns.toString();
            document.getElementById('loadAvg')!.innerText = metrics.os.load_avg.toFixed(2);
            document.getElementById('osRamText')!.innerText = 
                `OS Memory: ${(metrics.os.ram / 1024 / 1024 / 1024).toFixed(1)}GB / ${(metrics.os.total_ram / 1024 / 1024 / 1024).toFixed(1)}GB`;

            // 更新图表数据
            const now = Math.floor(Date.now() / 1000);
            dataStackCpu[0].push(now);
            dataStackCpu[1].push(metrics.pid.cpu);
            dataStackCpu[2].push(metrics.os.cpu);

            dataStackRam[0].push(now);
            dataStackRam[1].push(metrics.pid.ram / 1024 / 1024);
            dataStackRam[2].push(metrics.os.ram / 1024 / 1024);

            maxRam = Math.max(maxRam, metrics.os.total_ram / 1024 / 1024);
            ramChart.setScale('ram', { min: 0, max: maxRam });

            if (dataStackCpu[0].length > MAX_POINTS) {
                dataStackCpu[0].shift();
                dataStackCpu[1].shift();
                dataStackCpu[2].shift();
                dataStackRam[0].shift();
                dataStackRam[1].shift();
                dataStackRam[2].shift();
            }

            cpuChart.setData(dataStackCpu);
            ramChart.setData(dataStackRam);
        } catch (e) {
            console.error("Monitoring fail:", e);
        }
    }, 500);
}

/**
 * 用户列表加载逻辑
 */
async function loadUsers() {
    // 1. 修复：调用 getAllUsers 时补充必要的 page 和 perPage 参数
    // 2. 修改：接收返回的完整对象，从中提取 users 数组
    const response = await projects.getAllUsers(1, 30);
    
    userTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-gray-500">Loading users...</td></tr>';
    
    if (!response || !response.users || !Array.isArray(response.users)) {
        userTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-10 text-center text-red-400">Failed to load users.</td></tr>';
        return;
    }

    userTableBody.innerHTML = '';
    response.users.forEach((user: any) => {
        const row = document.createElement('tr');
        row.className = "hover:bg-white/5 transition-colors group";
        
        // 3. 修改：删除了 "Edit" 按钮及其相关调用
        row.innerHTML = `
            <td class="px-6 py-4 font-mono text-sm text-gray-400">${user.user_id}</td>
            <td class="px-6 py-4 font-medium text-white">${user.user_name}</td>
            <td class="px-6 py-4 text-gray-400">${user.email}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${new Date(user.create_at).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-right">
                <button onclick="handleDelete(${user.user_id})" class="text-red-400 hover:text-red-300 text-sm">Delete</button>
            </td>
        `;
        userTableBody.appendChild(row);
    });
}

// 绑定到 window 的删除功能
(window as any).handleDelete = async (id: number) => {
    if (confirm(`Delete user #${id}?`)) {
        if (await projects.deleteUser(id) === null) {
            alert("Deleted");
            loadUsers();
        }
    }
};

// 4. 修改：已移除 window.editUser 绑定

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    if (!token) {
        window.location.href = 'login';
        return;
    }

    initCpuChart();
    initRamChart();
    startMonitoring();
    loadUsers();

    refreshBtn.addEventListener('click', loadUsers);
    window.addEventListener("resize", () => {
        cpuChart.setSize({ width: document.getElementById('cpuChart')!.clientWidth, height: 160 });
        ramChart.setSize({ width: document.getElementById('ramChart')!.clientWidth, height: 160 });
    });
});
