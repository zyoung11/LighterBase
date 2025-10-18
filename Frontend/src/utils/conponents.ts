import sql from "../apis/sql";
import admin from "../apis/admin";
import { apiMarked } from "./contents";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight"; // 如果使用 marked-highlight 扩展
import hljs from 'highlight.js';
import 'highlight.js/styles/vs2015.css';
// import 'highlight.js/styles/rainbow.css'
import lighterBase from "../apis/auto";

marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  }
}));

const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
const slidebarContent = document.getElementById("slidebar-content") as HTMLElement;


const conponents = {
  hideRightSlidebar() {
    rightSlidebar.classList.add("translate-x-full");
  },

  showRightSlidebar(title: string, content: string) {
    // slidebarTitle.textContent = title;
    slidebarContent.innerHTML = content;
    rightSlidebar.classList.remove("translate-x-full");
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
        selectedCell.classList.remove('bg-blue-800');
      }
      selectedCell = cell;
      cell.classList.add('bg-blue-800');
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
        selectedCell.classList.remove('bg-blue-800');
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

    const btnBar = document.createElement('div');
    btnBar.className = 'flex gap-2';
    tables.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'px-3 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] rounded-t transition-colors'; 
      btn.textContent = t;
      btn.dataset.table = t;
      btn.dataset.pattern = pattern;
      btnBar.appendChild(btn);
    });

    const contentBox = document.createElement('div');
    contentBox.className = ' w-full h-[80%] bg-[#3a3f41] rounded-b text-gray-300 p-4 whitespace-normal overflow-y-auto'; 
    contentBox.innerHTML = ``; 

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
    });
    
    block.appendChild(btnBar);
    block.appendChild(contentBox);
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
      this.setupResponseToggle()

      firstBtn.classList.remove('bg-[#2B2F31]');
      firstBtn.classList.add('bg-[#3a3f41]');
    };
    renderFirstTable();
  }
}
  });
},

setupResponseToggle() {
  const btnBars = document.querySelectorAll('.response-btn-bar');
  if (!btnBars.length) return;

  btnBars.forEach(btnBar => {
    btnBar.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (!target.classList.contains('response-btn')) return;

      const status = target.dataset.status;
      if (!status) return;

      // 只操作当前btnBar内的按钮
      btnBar.querySelectorAll('.response-btn').forEach(btn => {
        btn.classList.remove('bg-[#DCEEF3]', 'active');
        btn.classList.add('bg-gray-300', 'hover:bg-gray-400');
      });
      
      target.classList.remove('bg-gray-300', 'hover:bg-gray-400');
      target.classList.add('bg-[#DCEEF3]', 'active');

      // 查找与当前btnBar关联的内容区域
      const contentBox = btnBar.nextElementSibling as HTMLElement;
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
  const container = document.getElementById('tables-api');
  if (!container) return;
  container.innerHTML = '';

  const tables = await sql.getTableAll();

  // 不创建 tableBar，也不插入 DOM
  const contentDiv = document.createElement('div');
  contentDiv.className = 'table-md w-[90%] h-full items-center justify-center p-4'; 
  container.appendChild(contentDiv);

  // 手动传入默认 tableId
  if (tables.length > 0) {
    this.showTableMdContent();
  }
},

_showLogsPage: 1, 

showLogs() {
  const render = async () => {
    const search = (document.getElementById('logs-search') as HTMLInputElement)?.value.trim() || '';
    const page    = Number(this._showLogsPage || 1);
    const perPage = Number((document.getElementById('logs-perpage') as HTMLSelectElement)?.value || 30);

    let { logs, totalPages } = await sql.getLogs(page, perPage);

    if (search) {
      logs = logs.filter((l: any) =>
        `${l.id} ${l.log_text}`.toLowerCase().includes(search.toLowerCase())
      );
    }

    /* 级别样式 */
    const levelStyle = (lvl: number) => {
      const map: { [k: number]: string } = { 0: 'bg-green-600', 8: 'bg-red-600' };
      const bg = map[lvl] || 'bg-gray-600';
      return `inline-block px-2 py-0.5 text-xs text-white rounded-full ${bg}`;
    };

    /* 渲染表格 */
    const tbody = document.getElementById('logs-tbody') as HTMLElement;
    tbody.innerHTML = logs
      .map(
        (l: any) => `
<tr class="border-b border-gray-700 hover:bg-[#3a3f41] cursor-pointer" data-id="${l.id}">
  <td class="px-3 py-2"><input type="checkbox" class="log-row-checkbox rounded" data-id="${l.id}"></td>
  <td class="px-3 py-2"><span class="${levelStyle(l.level)}">${l.level}</span></td>
  <td class="px-3 py-2">${l.id}</td>
  <td class="px-3 py-2 break-all">${l.log_text}</td>
  <td class="px-3 py-2">${l.created_at}</td>
</tr>`
      )
      .join('');

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
        const log = logs.find((l: any) => l.id === id);
        
        // 修复1: 替换 slideBarContent.log_detail 为实际的HTML内容
        const logDetailContent = `
          <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">日志详情</h3>
            <div class="space-y-2">
              <p><strong>ID:</strong> <span id="log-id">${log.id}</span></p>
              <p><strong>级别:</strong> <span id="log-level">${log.level}</span></p>
              <p><strong>创建时间:</strong> <span id="log-created">${log.created_at}</span></p>
              <p><strong>内容:</strong> <pre id="log-text" class="mt-2 p-2 bg-[#2B2F31] rounded">${log.log_text}</pre></p>
            </div>
          </div>
        `;
        
        this.showRightSlidebar('日志详情', logDetailContent);
      });
    });

    const updateBottom = () => {
      const checked = Array.from(
        document.querySelectorAll('.log-row-checkbox:checked') as NodeListOf<HTMLInputElement>
      ).map((i) => Number(i.dataset.id));
      if (checked.length) {
        // 实现一个简单的确认弹窗替代原来的 blocks.bottomPopupConfirm
        if (confirm(`确定删除选中的 ${checked.length} 条日志吗？`)) {
          admin.deleteLogs(checked).then(() => {
            this._showLogsPage = 1;
            render();
          }).catch(error => {
            console.error('删除日志失败:', error);
          });
        }
      }
    };

    /* 全选 */
    (document.getElementById('logs-select-all') as HTMLInputElement).onchange = (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      tbody.querySelectorAll('.log-row-checkbox').forEach((i: any) => (i.checked = checked));
      updateBottom();
    };
    tbody.querySelectorAll('.log-row-checkbox').forEach((i: any) =>
      i.addEventListener('change', updateBottom)
    );
  };

  /* 首次渲染 & 绑定事件 */
  render();
  document.getElementById('logs-search')?.addEventListener('input', render);
  document.getElementById('logs-perpage')?.addEventListener('change', () => {
    this._showLogsPage = 1;
    render();
  });
},


async showFolderTables() {
  const sidebarBox = document.getElementById('folder-table-list');
  if (!sidebarBox) return;
  sidebarBox.innerHTML = '';

  const tables = await sql.getTableAll();
  tables.forEach((t: string) => {
    const btn = document.createElement('button');
    btn.className =
      'w-full text-left px-3 py-2 rounded hover:bg-[#2B2F31] transition-colors text-sm';
    btn.textContent = t;
    btn.dataset.table = t;
    sidebarBox.appendChild(btn);
  });

  /* 点击表名 -> 主区渲染数据 */
  sidebarBox.addEventListener('click', async (e) => {
    const tgt = e.target as HTMLElement;
    const table = tgt.dataset.table;
    if (!table) return;

    const payload = { SELECT: '*', WHERE: '' };
    try {
      const lb = new lighterBase('http://localhost:8080');
      const res = await lb.searchTable(payload, table, 1, 30);
      renderTableInMain(res.items || [], table);
    } catch (err) {
      console.error(`查询表 ${table} 失败：`, err);
    }
  });

  /* 主区渲染函数（Tailwind 表格） */
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
    const headHTML = cols.map(k => `<th class="px-4 py-2 text-left">${k}</th>`).join('');
    const bodyHTML = items.map(row =>
      '<tr class="border-t border-gray-700">' +
      cols.map(k => `<td class="px-4 py-2">${row[k] ?? ''}</td>`).join('') +
      '</tr>'
    ).join('');

    main!.innerHTML = `
      <div class="flex-1 bg-[#1B1E1F] p-6 flex flex-col">
        <h3 class="text-base font-semibold mb-4 text-gray-200">表：${table}</h3>
        <div class="flex-1 overflow-auto rounded-lg border border-gray-700">
          <table class="min-w-full bg-[#2B2F31] text-sm text-gray-300">
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


  const tip=document.createElement('div');
  tip.className='fixed hidden backdrop-blur-md bg-black/60 text-white text-xs rounded px-2 py-1 pointer-events-none transition-opacity';
  document.body.appendChild(tip);
  document.getElementById('main-workspace')!.addEventListener('mouseover',e=>{
    const cel=(e.target as HTMLElement).closest('td');
    if(!cel) return;
    const full=cel.textContent??'';
    if(full.length<20) return;   
    tip.textContent=full;
    tip.classList.remove('hidden');
    const rect=cel.getBoundingClientRect();
    tip.style.left=rect.left+'px';
    tip.style.top =(rect.top -28)+'px';
  });
  document.getElementById('main-workspace')!.addEventListener('mouseout',e=>{
    if(!(e.relatedTarget as HTMLElement)?.closest('td')) tip.classList.add('hidden');
  });
}

};



export default conponents;
