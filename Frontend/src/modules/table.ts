import {
  createTable,
  getCoreRowModel,
  createColumnHelper,
  type ColumnDef
} from '@tanstack/table-core';

export type User = {
  id: number;
  name: string;
  password_hash: string;
  email: string;
  avatar: string | null;
  create_at: string;
  update_at: string;
};

export type ApiResponse = {
  columns: string[];
  count: number;
  data: any[];
  success: boolean;
};

function flexRender(comp: any, props: any) {
  return typeof comp === 'function' ? comp(props) : comp;
}

function createColumns(columnsArray: string[]): ColumnDef<any, any>[] {
  const columnHelper = createColumnHelper<any>();
  return columnsArray.map(col => columnHelper.accessor(col, {
    header: col,
    cell: info => info.getValue()
  }));
}

export function renderUserTable(response: ApiResponse, elementId: string) {
  const container = document.getElementById(elementId) as HTMLDivElement;
  if (!container) {
    console.error(`Element with ID '${elementId}' not found.`);
    return;
  }

  // 检查查询是否成功，如果失败仍显示表头但数据为空
  const columns = createColumns(response.columns || []);
  const data = response.success ? response.data : [];

  const table = createTable({
    data: response.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {},
    onStateChange: () => {},
    renderFallbackValue: null,
  });

  table.options.state = { ...table.initialState };

  // 清空容器
  container.innerHTML = '';

  // 1. 创建表头容器 (X轴可滚动)
  const theadContainer = document.createElement('div');
  theadContainer.className = "overflow-x-auto overflow-y-hidden border-b border-[#2B2F31] bg-[#15151D]";
  
  const tableHeader = document.createElement('table');
  tableHeader.className = "w-full text-left border-collapse";
  
  const thead = document.createElement('thead');
  table.getHeaderGroups().forEach(headerGroup => {
    const trElement = document.createElement('tr');
    trElement.className = "bg-[#1F2326] text-gray-400 text-sm uppercase tracking-wider";
    headerGroup.headers.forEach(header => {
      const thElement = document.createElement('th');
      thElement.innerHTML = header.isPlaceholder ? '' : flexRender(header.column.columnDef.header, header.getContext());
      // 关键样式：固定宽度，防止被内容撑开
      thElement.className = "px-4 py-3 text-left border-b border-[#2B2F31] font-medium min-w-[8rem]"; 
      trElement.appendChild(thElement);
    });
    thead.appendChild(trElement);
  });
  tableHeader.appendChild(thead);
  theadContainer.appendChild(tableHeader);
  container.appendChild(theadContainer);

  // 2. 创建表体容器 (X, Y轴都可滚动)
  const tbodyContainer = document.createElement('div');
  tbodyContainer.className = "overflow-auto flex-1 custom-scrollbar bg-[#15151D]";
  
  const tableBody = document.createElement('table');
  tableBody.className = "w-full text-left border-collapse";

  const tbody = document.createElement('tbody');
  table.getRowModel().rows.forEach(row => {
    const trElement = document.createElement('tr');
    trElement.className = "hover:bg-[#2B2F31] transition-colors border-b border-[#2B2F31]";
    
    row.getVisibleCells().forEach(cell => {
      const tdElement = document.createElement('td');
      const cellValue = flexRender(cell.column.columnDef.cell, cell.getContext());
      
      tdElement.textContent = String(cellValue ?? '');
      
      // 关键样式：
      // 1. max-w-[8rem] 约等于 128px，通常显示8-10个字符
      // 2. truncate 强制截断
      tdElement.className = "px-4 py-3 text-sm text-gray-300 min-w-[8rem] max-w-[8rem] truncate";
      
      // Tooltip
      tdElement.title = String(cellValue ?? '');

      trElement.appendChild(tdElement);
    });
    tbody.appendChild(trElement);
  });
  tableBody.appendChild(tbody);
  tbodyContainer.appendChild(tableBody);
  container.appendChild(tbodyContainer);
}
