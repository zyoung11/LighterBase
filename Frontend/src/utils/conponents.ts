import sql from "../apis/sql";
import admin from "../apis/admin";
const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
const slidebarContent = document.getElementById("slidebar-content") as HTMLElement;

const conponents = {
  hideRightSlidebar() {
    rightSlidebar.classList.add("translate-x-full");
  },

  showRightSlidebar(title: string, content: string) {
    slidebarTitle.textContent = title;
    slidebarContent.innerHTML = content;
    rightSlidebar.classList.remove("translate-x-full");
  },

// conponents.ts
async showPermissions() {
  const permissionTableBody = document.getElementById("permissions-table-body") as HTMLElement;
  const permissionsInputArea = document.getElementById("permissions-input-area") as HTMLElement; // 假设此ID存在于 workspaceContent.permissions 中
  
  // 初始状态显示提示信息
  if (permissionsInputArea) {
    permissionsInputArea.innerHTML = '<p class="text-gray-400">请先选择一个单元格</p>';
  }

  // 移除旧的监听器，防止重复添加
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
      records.forEach((record: any) => {
        recordsMap.set(record.table_name, record);// 创建一个Map对象，将记录的表名作为键，记录对象作为值
      });
    }
  
    // 渲染表格
    permissionTableBody.innerHTML = permissions.map((permission) => {
      const record = recordsMap.get(permission);

      const createWhere = record?.create_where || ''; // 使用空字符串而不是 null
      const deleteWhere = record?.delete_where || '';
      const updateWhere = record?.update_where || '';
      const viewWhere = record?.view_where || '';

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
        </tr>
      `;
    }).join('');

    // 定义新的点击事件处理函数
    const newListener = async (e: Event) => {
      const target = e.target as HTMLElement;
      const selectedCell = target.closest('td.cursor-pointer'); // 确保点击的是权限单元格

      // 清除之前选中的样式
      permissionTableBody.querySelectorAll('.bg-blue-800').forEach(cell => {
          cell.classList.remove('bg-blue-800');
          cell.classList.add('text-left'); // 保持原有样式
      });

      if (selectedCell && permissionsInputArea) {
        selectedCell.classList.add('bg-blue-800'); // 添加选中样式

        const row = selectedCell.closest('tr');
        if (!row) return;

        const table = selectedCell.getAttribute('data-table');
        const field = selectedCell.getAttribute('data-field');
        const currentValue = selectedCell.getAttribute('data-current-value') || '';

        permissionsInputArea.innerHTML = `
            <h4 class="text-md font-semibold mb-2">编辑权限: ${table} - ${field}；where = ？</h4>
            <textarea
                id="permission-textarea"
                data-table="${table}"
                data-field="${field}"
                class="w-full h-24 bg-[#2B2F31] border border-[#4a4f52] rounded-lg p-3 text-gray-200 resize-none focus:outline-none"
            >${currentValue}</textarea>
            <button id="save-permission-btn" class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                保存修改
            </button>
        `;
        
        (document.getElementById('save-permission-btn') as HTMLElement).addEventListener('click', async () => {
            const textarea = document.getElementById('permission-textarea') as HTMLTextAreaElement;
            const newValue = textarea.value.trim();
            const tableToUpdate = textarea.getAttribute('data-table');
            const fieldToUpdate = textarea.getAttribute('data-field');

            if (tableToUpdate && fieldToUpdate) {
                const payload: { [key: string]: string | null } = {
                    "create_where": null, "delete_where": null, "update_where": null, "view_where": null
                };
                
                // 获取当前行所有权限的*值*，如果为空则设为 null，否则设为当前值
                payload.create_where = (row.querySelector('[data-field="create_where"]') as HTMLElement)?.getAttribute('data-current-value') || null;
                payload.delete_where = (row.querySelector('[data-field="delete_where"]') as HTMLElement)?.getAttribute('data-current-value') || null;
                payload.update_where = (row.querySelector('[data-field="update_where"]') as HTMLElement)?.getAttribute('data-current-value') || null;
                payload.view_where = (row.querySelector('[data-field="view_where"]') as HTMLElement)?.getAttribute('data-current-value') || null;
                
                payload[fieldToUpdate] = newValue === '' ? null : newValue;

                try {
                    await admin.updateAuth(tableToUpdate, payload);
                    console.log(`更新表 ${tableToUpdate} 的权限为:`, payload);
                    await this.showPermissions(); // 重新渲染表格
                } catch (error) {
                    console.error(`更新表 ${tableToUpdate} 权限时出错:`, error,"输入的内容为：",payload);
                }
            } else {
                console.warn('缺少表名或字段名，无法更新权限');
            }
        });
        
      } else if(permissionsInputArea) {
          permissionsInputArea.innerHTML = '<p class="text-gray-400">请先选择一个单元格</p>';
      }
    };

    // 为新的监听器生成一个唯一的名称，并将其存储在 window 上，以便后续可以移除
    const listenerName = `permissionListener_${Date.now()}`;
    (window as any)[listenerName] = newListener;
    permissionTableBody.dataset.listener = listenerName;

    permissionTableBody.addEventListener('click', newListener);


  } catch(e) {
    console.log(e);
  }
},


// 在 conponents.ts 文件中添加以下方法

async showTableMdContent(tableId: string) {
  const tableMd = document.querySelector('.table-md') as HTMLElement;
  if (!tableMd) return;

  // 根据不同的 tableId 显示不同的内容
  switch (tableId) {
    case 'table-1':
      tableMd.innerHTML = `
        <div class="p-4">
          <h4 class="text-lg font-semibold mb-3">Table 1 详情</h4>
          <p class="text-gray-300">这是 table-1 的详细信息内容</p>
          <div class="mt-4 bg-[#1B1E1F] p-3 rounded">
            <p>字段1: varchar(255)</p>
            <p>字段2: int</p>
            <p>字段3: datetime</p>
          </div>
        </div>
      `;
      break;
    case 'table-2':
      tableMd.innerHTML = `
        <div class="p-4">
          <h4 class="text-lg font-semibold mb-3">Table 2 详情</h4>
          <p class="text-gray-300">这是 table-2 的详细信息内容</p>
          <div class="mt-4 bg-[#1B1E1F] p-3 rounded">
            <p>字段A: text</p>
            <p>字段B: boolean</p>
            <p>字段C: decimal(10,2)</p>
          </div>
        </div>
      `;
      break;
    case 'table-3':
      tableMd.innerHTML = `
        <div class="p-4">
          <h4 class="text-lg font-semibold mb-3">Table 3 详情</h4>
          <p class="text-gray-300">这是 table-3 的详细信息内容</p>
          <div class="mt-4 bg-[#1B1E1F] p-3 rounded">
            <p>字段X: bigint</p>
            <p>字段Y: json</p>
            <p>字段Z: timestamp</p>
          </div>
        </div>
      `;
      break;
    case 'table-4':
      tableMd.innerHTML = `
        <div class="p-4">
          <h4 class="text-lg font-semibold mb-3">Table 4 详情</h4>
          <p class="text-gray-300">这是 table-4 的详细信息内容</p>
          <div class="mt-4 bg-[#1B1E1F] p-3 rounded">
            <p>字段M: uuid</p>
            <p>字段N: blob</p>
            <p>字段O: enum</p>
          </div>
        </div>
      `;
      break;
    default:
      tableMd.innerHTML = '<p class="text-gray-400 p-4">请选择一个表查看详细信息</p>';
  }
},

async setupTableButtons() {
  // 确保侧边栏内容已经加载
  const tableCreate = document.getElementById('table-create');
  if (!tableCreate) return;

  // 为每个按钮添加点击事件监听器
  const buttons = tableCreate.querySelectorAll('.table-btn button');
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const tableId = target.getAttribute('data-id');
      
      // 移除所有按钮的 active 状态
      buttons.forEach(btn => {
        btn.classList.remove('bg-[#3a3f41]');
        btn.classList.add('bg-[#2B2F31]');
      });
      
      // 为当前点击的按钮添加 active 状态
      target.classList.remove('bg-[#2B2F31]');
      target.classList.add('bg-[#3a3f41]');
      
      // 显示对应的内容
      if (tableId) {
        this.showTableMdContent(tableId);
      }
    });
  });

  // 默认显示第一个表的内容
  if (buttons.length > 0) {
    const firstButton = buttons[0] as HTMLElement;
    firstButton.classList.remove('bg-[#2B2F31]');
    firstButton.classList.add('bg-[#3a3f41]');
    const firstTableId = firstButton.getAttribute('data-id');
    if (firstTableId) {
      this.showTableMdContent(firstTableId);
    }
  }
}


};



export default conponents;
