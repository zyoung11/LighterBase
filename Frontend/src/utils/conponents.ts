import {URL} from "../apis/api"
import sql from "../apis/sql";
import admin from "../apis/admin";
import { apiMarked } from "./contents";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight"; // 如果使用 marked-highlight 扩展
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
// import 'highlight.js/styles/rainbow.css'
import lighterBase from "../apis/auto";
import blocks from "../modules/blocks";
import manageIcon from "../icons/manageWhite.svg"

let logDeletePopup: {
  element: HTMLElement | null;
  isOpen: boolean;
  checkedIds: number[];
} = {
  element: null,
  isOpen: false,
  checkedIds: []
};

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
// const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
const slidebarContent = document.getElementById("slidebar-content") as HTMLElement;


function extractStatusCode(logText: string): number | null {
    const parts = logText.split(' ');
    if (parts.length > 3 && parts[3]) {
        const statusCodeStr = parts[3];
        const statusCode = parseInt(statusCodeStr, 10);

        if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
            return statusCode;
        }
    }
    return null;
}

interface LogDisplay {
    level: string; // 日志级别名称 (e.g., INFO, WARN, ERROR)
    color: string; // 样式类 (e.g., Tailwind CSS class for color)
}

function getLogLevelDisplay(statusCode: number): LogDisplay {
    if (statusCode >= 200 && statusCode < 300) {
        return { level: 'INFO', color: 'text-green-400' }; 
    } else if (statusCode >= 300 && statusCode < 400) {
        return { level: 'WARN', color: 'text-yellow-400' }; 
    } else if (statusCode >= 400 && statusCode < 500) {
        return { level: 'WARN', color: 'text-orange-400' }; 
    } else if (statusCode >= 500 && statusCode < 600) {
        return { level: 'ERROR', color: 'text-red-500' }; 
    } else {
        return { level: 'DEBUG', color: 'text-gray-400' }; 
    }
}

const conponents = {
  justOpened: false,

  hideRightSlidebar() {
     console.log('Hiding right slidebar');
     rightSlidebar.classList.add("translate-x-[110%]");
   },

  showRightSlidebar(title: string, content: string) {
     console.log('Showing right slidebar with title:', title);
     // slidebarTitle.textContent = title;
     slidebarContent.innerHTML = content;
     rightSlidebar.classList.remove("translate-x-[110%]");
     conponents.justOpened = true;
     setTimeout(() => conponents.justOpened = false, 0); // Reset after current event loop
   },

  initRightSlidebarClose() {
     document.addEventListener('click', (e) => {
        const rightSlidebar = document.getElementById('right-slidebar') as HTMLElement;
        if (rightSlidebar && !rightSlidebar.classList.contains('translate-x-[110%]') && !conponents.justOpened) {
           if (!rightSlidebar.contains(e.target as Node)) {
              conponents.hideRightSlidebar();
           }
        }
     });
  },

async showPermissions() {
  const permissionTableBody = document.getElementById("permissions-table-body") as HTMLElement;
  const permissionsInputArea = document.getElementById("permissions-input-area") as HTMLElement;
  if (permissionsInputArea) {
    permissionsInputArea.innerHTML = '<p class="text-gray-400">请先选择一个单元格</p>';
  }

  const oldListener = permissionTableBody.dataset.listener;
  if (oldListener) {
    permissionTableBody.removeEventListener('click', (window as any)[oldListener]);
    delete permissionTableBody.dataset.listener;
  }

  try {
    const permissions = await sql.getTableAll();
    const records = await admin.getRecords();
    const recordsMap = new Map();
    if (records && Array.isArray(records)) {
      records.forEach((record: any) => recordsMap.set(record.table_name, record));
    }

    permissionTableBody.innerHTML = permissions
      .map((permission) => {
        const record = recordsMap.get(permission);
        const createWhere = record?.create_where ?? '';
        const deleteWhere = record?.delete_where ?? '';
        const updateWhere = record?.update_where ?? '';
        const viewWhere = record?.view_where ?? '';
        return `
          <tr class="border border-gray-700 hover:bg-[#2B2F31]">
            <td class="px-4 py-3 text-left w-1/5">${permission}</td>
            <td class="px-4 py-3 text-left cursor-pointer border-l border-gray-700"
                data-table="${permission}" data-field="create_where" data-current-value="${createWhere}">${createWhere}</td>
            <td class="px-4 py-3 text-left cursor-pointer border-l border-gray-700"
                data-table="${permission}" data-field="delete_where" data-current-value="${deleteWhere}">${deleteWhere}</td>
            <td class="px-4 py-3 text-left cursor-pointer border-l border-gray-700"
                data-table="${permission}" data-field="update_where" data-current-value="${updateWhere}">${updateWhere}</td>
            <td class="px-4 py-3 text-left cursor-pointer border-l border-gray-700"
                data-table="${permission}" data-field="view_where" data-current-value="${viewWhere}">${viewWhere}</td>
          </tr>`;
      })
      .join('');

    let selectedCell: HTMLTableCellElement | null = null;
    const selectCell = (cell: HTMLTableCellElement) => {
      if (selectedCell) {
        selectedCell.style.backgroundColor = '';
      }
      selectedCell = cell;
      cell.style.backgroundColor = '#2B2F31';
    };

    const newListener = async (e: Event) => {
      const target = e.target as HTMLElement;
      const cell = target.closest('td.cursor-pointer') as HTMLTableCellElement;
      if (!cell) return;               
      if (cell === selectedCell) return; 

      selectCell(cell);

      const table = cell.dataset.table!;
      const field = cell.dataset.field!;
      const currentValue = cell.dataset.currentValue ?? '';


      permissionsInputArea.innerHTML = `
        <h4 class="text-md font-semibold mb-2">编辑权限: ${table} - ${field}；where = ？</h4>
        <textarea
          id="permission-textarea"
          data-table="${table}"
          data-field="${field}"
          class="w-full h-24 bg-[#2B2F31] border border-[#4a4f52] rounded-lg p-3 text-gray-200 resize-none focus:outline-none"
        >${currentValue}</textarea>`;


      const textarea = document.getElementById('permission-textarea') as HTMLTextAreaElement;
      textarea.focus();


      textarea.addEventListener('keydown', async (ke) => {
        if (ke.key === 'Enter' && !ke.shiftKey) {
          ke.preventDefault();
          const newValue = textarea.value.trim();
          const row = cell.closest('tr')!;
          const payload: any = {
            create_where: null,
            delete_where: null,
            update_where: null,
            view_where: null,
          };

          row.querySelectorAll<HTMLElement>('td[data-field]').forEach((td) => {
            const f = td.dataset.field!;
            payload[f] = td.dataset.currentValue || null;
          });
          payload[field] = newValue === '' ? null : newValue;

          try {
            await admin.updateAuth(table, payload);
            cell.dataset.currentValue = payload[field] ?? '';
            cell.textContent = payload[field] ?? '';

          } catch (err) {
            console.error(`更新表 ${table} 权限时出错:`, err);
          }
        }
      });
    };


    document.addEventListener('click', (e) => {
      const inTable = (e.target as HTMLElement).closest('#permissions-table');
      const inInput = (e.target as HTMLElement).closest('#permissions-input-area');
      if (!inTable && !inInput && selectedCell) {
        selectedCell.style.backgroundColor = '';
        selectedCell = null;
        permissionsInputArea.innerHTML = '<p class="text-gray-400">请先选择一个单元格</p>';
      }
    });


    const listenerName = `perm_${Date.now()}`;
    (window as any)[listenerName] = newListener;
    permissionTableBody.dataset.listener = listenerName;
    permissionTableBody.addEventListener('click', newListener);
  } catch (e) {
    console.error(e);
  }
},


async showTableMdContent() {
  const tableMd = document.querySelector('.table-md') as HTMLElement;
  if (!tableMd) return;
  tableMd.innerHTML = '';

  const tables = await sql.getTableAll();
  const patterns = ['create', 'delete', 'update', 'search'];
  const apiMarkedMap: { [key: string]: string } = apiMarked;

  patterns.forEach(pattern => {
    const block = document.createElement('div');
    block.className = 'w-full h-auto mb-4';
    block.setAttribute('data-pattern', pattern);

    const btnBar = document.createElement('div');
    btnBar.className = 'flex gap-2';
    tables.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'px-3 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-t transition-colors';
      btn.textContent = t
      btn.dataset.table = t;
      btn.dataset.pattern = pattern;
      btnBar.appendChild(btn);
    });

    const contentBox = document.createElement('div');
    contentBox.className = 'w-full h-[90%] bg-[#3a3f41] rounded-b text-gray-300 p-4 whitespace-normal overflow-y-auto';
    contentBox.innerHTML = '';

    const responseDiv = document.createElement('div');
    responseDiv.className = 'w-full bg-[#3a3f41] text-gray-300 p-4';
    btnBar.addEventListener('click', async(e) => {
      const target = e.target as HTMLElement;
      if (target.dataset.table && target.dataset.pattern) {
        btnBar.querySelectorAll('button').forEach(b => {
          b.classList.remove('bg-[#3a3f41]');
          b.classList.add('bg-[#2B2F31]');
        });
        target.classList.remove('bg-[#2B2F31]');
        target.classList.add('bg-[#3a3f41]');

        const selectedPattern = target.dataset.pattern as keyof typeof apiMarked;

        const markdownContent = apiMarkedMap[selectedPattern] || '';

        const table = target.dataset.table;
        const finalMarkdown = markdownContent.replace(/table_name/g, table || '');

        const htmlContent = await marked.parse(finalMarkdown);
        contentBox.innerHTML = htmlContent;
      }
  this.setupResponseToggle();
    });

    block.appendChild(btnBar);
    block.appendChild(contentBox);
    block.appendChild(responseDiv);
    tableMd.appendChild(block);

    if (tables.length > 0) {
      const firstBtn = btnBar.querySelector('button') as HTMLButtonElement;
      if (firstBtn) {
        const renderFirstTable = async () => {
          const selectedPattern = firstBtn.dataset.pattern as keyof typeof apiMarked;
          const markdownContent = apiMarkedMap[selectedPattern] || '';
          const table = firstBtn.dataset.table || '';
          const finalMarkdown = markdownContent.replace(/table_name/g, table);
          const htmlContent = await marked.parse(finalMarkdown);
          contentBox.innerHTML = htmlContent;

          firstBtn.classList.remove('bg-[#2B2F31]');
          firstBtn.classList.add('bg-[#3a3f41]');
  this.setupResponseToggle();
        };
        renderFirstTable();

      }
    }
  });
  this.setupResponseToggle();
},

// 响应部分的按钮点击切换功能，与table的切换逻辑独立，不会互相影响
 setupResponseToggle() {
   const btnBars = document.querySelectorAll('.response-btn-bar');
   if (!btnBars.length) return;

   btnBars.forEach(btnBar => {
     const bar = btnBar as HTMLElement;
     if (bar.dataset.bound === 'true') return; // 防止重复绑定
      bar.dataset.bound = 'true';
      bar.addEventListener('click', (e) => {
       const target = e.target as HTMLButtonElement;
       if (!target.classList.contains('response-btn')) return;

       const status = target.dataset.status;
       if (!status) return;

       // 只操作当前btnBar内的按钮
       bar.querySelectorAll('.response-btn').forEach(btn => {
         btn.classList.remove('bg-[#DCEEF3]', 'active');
         btn.classList.add('bg-gray-300', 'hover:bg-gray-400');
       });

       target.classList.remove('bg-gray-300', 'hover:bg-gray-400');
       target.classList.add('bg-[#DCEEF3]', 'active');

       // 查找与当前btnBar关联的内容区域
       const contentBox = bar.nextElementSibling as HTMLElement;
      if (contentBox && contentBox.classList.contains('response-content-box')) {
        contentBox.querySelectorAll('.response-content-item').forEach(item => {
          item.classList.add('hidden');
          item.classList.remove('block');
        });
        
        const targetContent = contentBox.querySelector(`[data-status-content="${status}"]`);
        if (targetContent) {
          targetContent.classList.remove('hidden');
          targetContent.classList.add('block');
        }
      }
    });
  });
},


  async setupTableButtons() {
   const container = document.getElementById('api-content');
   if (!container) return;
   container.innerHTML = '';

   const tables = await sql.getTableAll();

   // 不创建 tableBar，也不插入 DOM
   const contentDiv = document.createElement('div');
   contentDiv.className = 'table-md w-full h-full p-4';
   container.appendChild(contentDiv);
   // console.log("查看tables:",tables)
   // 手动传入默认 tableId
   if (tables.length > 0) {
     this.showTableMdContent();
   }

   // 添加导航点击事件
   const navButtons = document.querySelectorAll('#tables-api .nav-btn');
   navButtons.forEach(btn => {
     btn.addEventListener('click', () => {
       const nav = btn.getAttribute('data-nav');
       const targetBlock = document.querySelector(`[data-pattern="${nav}"]`);
       if (targetBlock) {
         targetBlock.scrollIntoView({ behavior: 'smooth' });
       }
     });
   });
 },

 _showLogsPage: 1,
 selectedIds: [] as number[],
 currentSearch: '',

 showLogs() {
  const render = async () => {
    const search = (document.getElementById('logs-search') as HTMLInputElement)?.value.trim() || '';
    const page    = Number(this._showLogsPage || 1);
    const perPage = Number((document.getElementById('logs-perpage') as HTMLSelectElement)?.value || 30);

    // 修复变量作用域问题
    let logsResult;
    let totalPages;

    this.currentSearch = search;

    if (search) {
      // 当有搜索关键词时，使用搜索接口
      const result = await sql.searchLogs(page, perPage, search);
      logsResult = result.logs;
      totalPages = result.totalPages;
    } else {
      // 当无搜索关键词时，使用普通分页接口
      const result = await sql.getLogs(page, perPage);
      logsResult = result.logs;
      totalPages = result.totalPages;
    }


const tbody = document.getElementById('logs-tbody') as HTMLElement;
    tbody.innerHTML = logsResult
      .map(
        (l: any) => {
          // 1. 提取状态码
          const statusCode = extractStatusCode(l.log_text || '');
          // 2. 根据状态码获取级别和颜色 (如果提取失败，默认使用 DEBUG)
          const logDisplay = getLogLevelDisplay(statusCode ?? 0); 
          
           return `
 <tr class="border-b border-gray-700 hover:bg-[#3a3f41] cursor-pointer" data-id="${l.id}">
   <td class="px-3 py-2"><input type="checkbox" class="log-row-checkbox rounded" data-id="${l.id}" ${this.selectedIds.includes(l.id) ? 'checked' : ''}></td>
  <td class="px-3 py-2">
    <span class="inline-block px-2 py-0.5 text-xs text-white rounded-full ${logDisplay.color.replace('text-', 'bg-')} font-bold">
      ${logDisplay.level} 
    </span>
  </td>
  <td class="px-3 py-2">${l.id}</td>
  <td class="px-3 py-2 break-all ">${l.log_text}</td>
  <td class="px-3 py-2">${l.created_at}</td>
</tr>`
        }
      )
       .join('');

    // 绑定复选框事件
    tbody.querySelectorAll('.log-row-checkbox').forEach((checkbox: any) => {
      const id = Number(checkbox.dataset.id);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          if (!this.selectedIds.includes(id)) this.selectedIds.push(id);
        } else {
          this.selectedIds = this.selectedIds.filter(i => i !== id);
        }
        updateBottom();
      });
    });

     const pag = document.getElementById('logs-pagination') as HTMLElement;
    pag.innerHTML='';
    const range=(s:number,e:number)=>Array.from({length:e-s+1},(_,i)=>s+i);
    const make=(n:number| string,active=false)=>{
      const btn=document.createElement('button');
      btn.textContent=String(n);
      btn.className=`px-2 py-1 rounded border text-sm ${active?'bg-blue-600 border-blue-600':'bg-[#2B2F31] border-gray-600'}`;
      if(typeof n==='number') btn.addEventListener('click',()=>{ this._showLogsPage=n; render(); });
      return btn;
    };
    const dots=()=>{const d=document.createElement('span'); d.textContent='…'; return d; };
    const total=totalPages, cur=page, delta=2;
    const left =Math.max(2, cur-delta);
    const right=Math.min(total-1,cur+delta);
    pag.appendChild(make(1,cur===1));
    if(left>2) pag.appendChild(dots());
    range(left,right).forEach(i=>pag.appendChild(make(i,i===cur)));
    if(right<total-1) pag.appendChild(dots());
    if(total>1) pag.appendChild(make(total,cur===total));

    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).tagName === 'INPUT') return;
        const id = Number(tr.dataset.id);
        const log = logsResult.find((l: any) => l.id === id);
        if (!log) return;
                  // 1. 提取状态码
          const statusCode = extractStatusCode(log.log_text || '');
          // 2. 根据状态码获取级别和颜色 (如果提取失败，默认使用 DEBUG)
          const logDisplay = getLogLevelDisplay(statusCode ?? 0);
        const logDetailContent = `
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">日志详情</h3>
            <div class="space-y-2">
              <p><strong>ID:</strong> <span id="log-id">${log.id}</span></p>
              <p><strong>级别:</strong> <span id="log-level"  class ="inline-block px-2 py-0.5 text-xs text-white rounded-full  ${logDisplay.color.replace('text-', 'bg-')} font-bold">${logDisplay.level}</span></p>
              <p><strong>创建时间:</strong> <span id="log-created">${log.created_at}</span></p>
              <p><strong>内容:</strong> <pre id="log-text" class="mt-2 p-2 bg-[#2B2F31] rounded ">${log.log_text}</pre></p>
            </div>
          </div>
        `;

        this.showRightSlidebar('日志详情', logDetailContent);
      });
    });



// 修改 showLogs 方法中的 updateBottom 函数部分
const updateBottom = () => {
  const checked = this.selectedIds;

  logDeletePopup.checkedIds = checked;

  if (checked.length > 0) {
    if (!logDeletePopup.isOpen) {
       blocks.bottomPopupConfirm(`确定下载选中的 ${checked.length} 条日志为CSV文件吗？`)
        .then(async (confirmed) => {
          logDeletePopup.isOpen = false;
          if (confirmed) {
            let allLogs: any[] = [];
            if (this.currentSearch) {
              const result = await sql.searchLogs(1, perPage, this.currentSearch);
              const total = result.totalPages;
              for (let p = 1; p <= total; p++) {
                const res = await sql.searchLogs(p, perPage, this.currentSearch);
                allLogs = allLogs.concat(res.logs);
              }
            } else {
              const result = await sql.getLogs(1, perPage);
              const total = result.totalPages;
              for (let p = 1; p <= total; p++) {
                const res = await sql.getLogs(p, perPage);
                allLogs = allLogs.concat(res.logs);
              }
            }
            const selectedLogs = allLogs.filter((l: any) => checked.includes(l.id));
            const csvHeader = 'ID,Level,Log Text,Created At\n';
            const csvRows = selectedLogs.map((l: any) => {
              const statusCode = extractStatusCode(l.log_text || '');
              const logDisplay = getLogLevelDisplay(statusCode ?? 0);
              return `${l.id},${logDisplay.level},${l.log_text.replace(/"/g, '""')},${l.created_at.replace(/\n/g, ' ').replace(/\r/g, '')}`;
            }).join('\n');
            const csvContent = csvHeader + csvRows;
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = globalThis.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logs.csv';
            a.click();
            globalThis.URL.revokeObjectURL(url);
          } else {
            // 如果取消，取消勾选内容，回复勾选框为初始状态
            this.selectedIds = [];
            tbody.querySelectorAll('.log-row-checkbox').forEach((checkbox: any) => {
              checkbox.checked = false;
            });
            (document.getElementById('logs-select-all') as HTMLInputElement).checked = false;
            updateBottom();
          }
        });

      logDeletePopup.isOpen = true;

      // 等待 DOM 更新后获取弹窗元素
      setTimeout(() => {
        logDeletePopup.element = document.querySelector('.fixed.bottom-4') as HTMLElement;
      }, 100);
    } else if (logDeletePopup.element) {
      // 如果弹窗已打开，只更新文本内容
      const messageElement = logDeletePopup.element.querySelector('#modal-message');
      if (messageElement) {
        messageElement.textContent = `确定下载选中的 ${checked.length} 条日志为CSV文件吗？`;
      }
    }
  } else {
    // 如果没有选中项且弹窗打开，则关闭弹窗
    if (logDeletePopup.isOpen && logDeletePopup.element) {
      const cancelBtn = logDeletePopup.element.querySelector('#modal-cancel') as HTMLButtonElement;
      if (cancelBtn) {
        cancelBtn.click();
      }
    }
  }
};

    /* 全选 */
    (document.getElementById('logs-select-all') as HTMLInputElement).onchange = (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      logsResult.forEach((l: any) => {
        if (checked) {
          if (!this.selectedIds.includes(l.id)) this.selectedIds.push(l.id);
        } else {
          this.selectedIds = this.selectedIds.filter(i => i !== l.id);
        }
      });
      tbody.querySelectorAll('.log-row-checkbox').forEach((i: any) => (i.checked = checked));
      updateBottom();
    };
  };

  /* 首次渲染 & 绑定事件 */
  render();
  document.getElementById('logs-search')?.addEventListener('input', () => {
    this._showLogsPage = 1; // 搜索时重置到第一页
    render();
  });
  document.getElementById('logs-perpage')?.addEventListener('change', () => {
    this._showLogsPage = 1;
    render();
  });
  },

  showImageTooltip(imageSrc: string, left: number, top: number) {
    const tooltip = document.createElement('div');
    tooltip.className = 'fixed z-50 bg-[#2B2F31] text-gray-200 p-4 rounded-lg shadow-lg';
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.innerHTML = `<img src="${imageSrc}" alt="图片" style="max-width: 300px; max-height: 300px;">`;
    document.body.appendChild(tooltip);

    tooltip.addEventListener('mouseleave', () => {
      tooltip.remove();
    });
  },

  async showFolderTables() {
  const sidebarBox = document.getElementById('folder-table-list');
  if (!sidebarBox) return;
  sidebarBox.innerHTML = '';

  let selectedTableBtn: HTMLElement | null = null;

  const tables = await sql.getTableAll();
  tables.forEach((t: string) => {
    const btn = document.createElement('button');
    btn.className =
      'w-full text-left flex px-2 py-2 rounded hover:bg-[#2B2F31] transition-colors items-center text-base font-medium truncate';
    btn.innerHTML = `<img src="${manageIcon}" alt="管理" class="w-[10%] mr-3">${t}`;
    btn.dataset.table = t;
    sidebarBox.appendChild(btn);
  });

  sidebarBox.addEventListener('click', async (e) => {
    const tgt = e.target as HTMLElement;
    const table = tgt.dataset.table;
    if (!table) return;

    // 切换选中状态
    if (selectedTableBtn) {
      selectedTableBtn.style.backgroundColor = '';
    }
    selectedTableBtn = tgt;
    tgt.style.backgroundColor = '#2B2F31';

    const payload = { SELECT: [],WHERE:'' };
    try {
      const lb = new lighterBase(URL);
      const res = await lb.searchTable(payload, table, 1, 30);
      console.log("查看表的响应res:",res)
      renderTableInMain(res.items || [], table);
    } catch (err) {
      console.error(`查询表 ${table} 失败：`, err);
    }
  });

  function renderTableInMain(items: any[], table: string) {
    const main = document.getElementById('main-workspace');
    if (!items.length) {
      main!.innerHTML = `
        <div class="flex-1 bg-[#1B1E1F] flex items-center justify-center">
          <div class="text-gray-400 text-sm">表 “${table}” 暂无数据</div>
        </div>`;
      return;
    }

    const cols = Object.keys(items[0]);
    const headHTML = cols.map(k => {
      const displayK = k.length > 15 ? k.substring(0,15) + '...' : k;
      return `<th class=" px-4 py-2 text-left truncate" title="${k}">${displayK}</th>`;
    }).join('');
    const bodyHTML = items.map(row =>
      '<tr class="w-full border-t border-gray-700">' +
      cols.map(k => {
        const val = row[k] ?? '';
        const displayVal = val.length > 15 ? val.substring(0,15) + '...' : val;
        return `<td class="px-4 py-2 text-left truncate" title="${val}">${displayVal}</td>`;
      }).join('') +
      '</tr>'
    ).join('');

    main!.innerHTML = `
      <div class="flex-1 bg-[#1B1E1F] p-6 flex flex-col">
        <h3 class="text-base font-semibold mb-4 text-gray-200">表：${table}</h3>
        <div class="flex-1 overflow-auto rounded-lg border border-gray-700">
          <table class="min-w-full bg-[#2B2F31] text-sm text-gray-300" style="table-layout: fixed;">
            <thead class="sticky top-0 bg-[#2B2F31]">
              <tr>${headHTML}</tr>
            </thead>
            <tbody>${bodyHTML}</tbody>
          </table>
        </div>
      </div>`;
  }

  if(tables.length){
    const first=tables[0];
    (sidebarBox.querySelector('button') as HTMLButtonElement).click();
  }

  document.getElementById('main-workspace')!.addEventListener('mouseover', e => {
    const cel = (e.target as HTMLElement).closest('td');
    if (!cel) return;
    const full = cel.getAttribute('title') || '';
    if (!full || full.length <= 15) return;
    const rect = cel.getBoundingClientRect();

    if (full.startsWith('data:image/')) {
      // 显示图片tooltip
      this.showImageTooltip(full, rect.left, rect.top - 5);
    } else {
      // 显示文本tooltip
      blocks.showTooltipWithCopy(full, rect.left, rect.top - 5);
    }
  });
}

};



// 初始化右侧滑入栏外部点击关闭功能
conponents.initRightSlidebarClose();

export default conponents;
