
const blocks={
popupConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className =
      'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

    const panel = document.createElement('div');
    panel.className =
      'min-w-[280px] rounded-xl bg-[#1a1a1a] text-gray-200 shadow-2xl p-6 border border-gray-700';

    panel.innerHTML = `
      <p class="mb-5 text-center">${text}</p>
      <div class="flex justify-end gap-3">
        <button id="cancelBtn" class="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition">取消</button>
        <button id="okBtn" class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition">确认</button>
      </div>
    `;

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    const clean = (result: boolean) => {
      backdrop.remove();
      resolve(result);
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) clean(false); // 点击背景关闭
    });

    (panel.querySelector('#cancelBtn') as HTMLButtonElement).addEventListener('click', () => clean(false));
    (panel.querySelector('#okBtn') as HTMLButtonElement).addEventListener('click', () => clean(true));
  });
},

bottomPopupConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    // 创建背景遮罩
    const backdrop = document.createElement('div');
    backdrop.className = 'fixed inset-0 z-[9999] bg-black/50';

    // 创建底部弹窗
    const modal = document.createElement('div');
    modal.className = 'fixed bottom-4 left-0 right-0  bg-[#181A1B] p-6 shadow-lg transform translate-y-full transition-transform duration-300 w-[30%] h-[8%] mx-auto rounded-xl';
    
    modal.innerHTML = `
      <div class="flex justify-between items-center">
        <span id="modal-message" class="text-gray-200">${text}</span>
        <div class="space-x-4">
          <button id="modal-cancel" class="px-4 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] text-gray-200 rounded transition-colors">
            取消
          </button>
          <button id="modal-confirm" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
            确认
          </button>
        </div>
      </div>
    `;

    // 添加到DOM
    document.body.appendChild(backdrop);
    backdrop.appendChild(modal);
    // document.body.appendChild(modal);

    // 触发显示动画
    setTimeout(() => {
      modal.classList.remove('translate-y-full');
    }, 10);

    // 清理函数
    const clean = (result: boolean) => {
      modal.classList.add('translate-y-full');
      setTimeout(() => {
        backdrop.remove();
        modal.remove();
        resolve(result);
      }, 300);
    };

    // 事件监听
    backdrop.addEventListener('click', () => clean(false));
    
    (modal.querySelector('#modal-cancel') as HTMLButtonElement).addEventListener('click', () => clean(false));
    (modal.querySelector('#modal-confirm') as HTMLButtonElement).addEventListener('click', () => clean(true));
  });
}




}

export default blocks;
