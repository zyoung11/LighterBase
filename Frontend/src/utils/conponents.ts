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
  try {
    const permissions = await sql.getTableAll(); 
    const records = await admin.getRecords();

    const recordsMap = new Map();
    if (records && Array.isArray(records)) {
      records.forEach((record: any) => {
        recordsMap.set(record.table_name, record);// 创建一个Map对象，将记录的表名作为键，记录对象作为值
      });
    }
  
    permissionTableBody.innerHTML = permissions.map((permission) => {
      const record = recordsMap.get(permission);

      const createWhere = record?.create_where || null;
      const deleteWhere = record?.delete_where || null;
      const updateWhere = record?.update_where || null;
      const viewWhere = record?.view_where || null;

      return `
        <tr class="border border-gray-300">
          <td class="px-4 py-2 border border-gray-300 ">${permission}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="create_where" data-current-value="${createWhere}">${createWhere}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="delete_where" data-current-value="${deleteWhere}">${deleteWhere}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="update_where" data-current-value="${updateWhere}">${updateWhere}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="view_where" data-current-value="${viewWhere}">${viewWhere}</td>
        </tr>
      `;
    }).join('');

  
    permissionTableBody.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TD' && target.classList.contains('cursor-pointer')) {
        
        const row = target.closest('tr');
        if (!row) return;

        const table = target.getAttribute('data-table');
        const field = target.getAttribute('data-field');

        const createWhere = (row.querySelector('[data-field="create_where"]') as HTMLElement)?.getAttribute('data-current-value');
        const deleteWhere = (row.querySelector('[data-field="delete_where"]') as HTMLElement)?.getAttribute('data-current-value');
        const updateWhere = (row.querySelector('[data-field="update_where"]') as HTMLElement)?.getAttribute('data-current-value');
        const viewWhere = (row.querySelector('[data-field="view_where"]') as HTMLElement)?.getAttribute('data-current-value');

        const toggleValue = (currentValue: string) => (currentValue === '1' ? null : '1');

        const payload = {
            create_where: field === 'create_where' ? toggleValue(createWhere) : createWhere,
            delete_where: field === 'delete_where' ? toggleValue(deleteWhere) : deleteWhere,
            update_where: field === 'update_where' ? toggleValue(updateWhere) : updateWhere,
            view_where: field === 'view_where' ? toggleValue(viewWhere) : viewWhere,
        };
        
        if (table) {
            try {
                await admin.updateAuth(table, payload);
                console.log(`更新表 ${table} 的权限为:`, payload);
                await this.showPermissions(); 
            } catch (error) {
                console.error(`更新表 ${table} 权限时出错:`, error);
                console.log(payload);
            }
        } else {
            console.warn('缺少表名，无法更新权限');
        }
      }
    }, { once: true }); // 使用 { once: true } 确保每次调用 showPermissions 都能移除旧监听器

  } catch(e) {
    console.log(e);
  }
},

};



export default conponents;
