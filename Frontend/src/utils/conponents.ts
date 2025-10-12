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

async showPermissions() { 
  const permissionTableBody = document.getElementById("permissions-table-body") as HTMLElement;
  try {
    const permissions = await sql.getTableAll(); 
    const records = await admin.getRecords();

    const recordsMap = new Map();
    if (records && Array.isArray(records)) {
      records.forEach((record: any) => {
        console.log("显示",record.CreateWhere.String);
        recordsMap.set(record.TableName, record);// 创建一个Map对象，将记录的表名作为键，记录对象作为值
      });
    }
  
    permissionTableBody.innerHTML = permissions.map((permission) => {
      const record = recordsMap.get(permission);
      return `
        <tr class="border border-gray-300">
          <td class="px-4 py-2 border border-gray-300 ">${permission}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="create_where">${record?.CreateWhere.String || ''}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="delete_where">${record?.DeleteWhere.String || ''}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="update_where">${record?.UpdateWhere.String || ''}</td>
          <td class="px-4 py-2 border border-gray-300 hover:bg-[#3a3f41] transition-all duration-200 transform hover:scale-105 cursor-pointer" 
              data-table="${permission}" data-field="view_where">${record?.ViewWhere.String || ''}</td>
        </tr>
      `;
    }).join('');

    permissionTableBody.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TD' && target.classList.contains('cursor-pointer')) {
        const table = target.getAttribute('data-table');
        const field = target.getAttribute('data-field');
        const currentValue = target.textContent;
        
        const textarea = document.getElementById('permission-editor') as HTMLTextAreaElement;
        if (textarea) {
          textarea.dataset.table = table || '';
          textarea.dataset.field = field || '';
          textarea.value = currentValue || '';
          textarea.placeholder = `编辑 ${table} 表的 ${field} 权限条件...`;


          textarea.disabled = false;
          textarea.focus();
        }
      }
    });
      
  } catch(e) {
    console.log(e);
  }
},

};



export default conponents;
