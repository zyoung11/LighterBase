
const blocks={
popupConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className =
      'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

    const panel = document.createElement('div');
    panel.className =
      'min-w-[280px] justify-center items-center rounded-xl bg-[#1a1a1a] text-gray-200 shadow-2xl p-6 border border-gray-700';

    panel.innerHTML = `
      <p class="mb-5 text-center">${text}</p>
      <div class="flex justify-center gap-3">
        <button id="cancelBtn" class="px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-600 transition">取消</button>
        <button id="okBtn" class="text-black px-4 py-2 rounded-md bg-white transition">确认</button>
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
    // const backdrop = document.createElement('div');
    // backdrop.className = 'fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm';

    // 创建底部弹窗
    const modal = document.createElement('div');
    modal.className = 'max-w-[30%] flex fixed bottom-4 left-4 mx-auto justify-center items-center right-4 bg-[#1a1a1a] p-3 shadow-2xl rounded-full border border-gray-700';

    modal.innerHTML = `
      <p id="modal-message" class=" text-gray-200">${text}</p>
      <div class="flex gap-3">
        <button id="modal-cancel" class="px-2 py-2 rounded-md border border border-gray-400 hover:bg-gray-600 transition">取消</button>
        <button id="modal-confirm" class="text-white px-2 py-2 rounded-md border border-gray-400 hover:bg-gray-600 transition">确认</button>
      </div>
    `;

    // 添加到DOM
    // document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // 触发显示动画
    setTimeout(() => {
      modal.classList.remove('translate-y-full');
    }, 10);

    // 清理函数
    const clean = (result: boolean) => {
      modal.classList.add('translate-y-full');
      setTimeout(() => {
        // backdrop.remove();
        modal.remove();
        resolve(result);
      }, 300);
    };

    // 事件监听
    // backdrop.addEventListener('click', () => clean(false));

    (modal.querySelector('#modal-cancel') as HTMLButtonElement).addEventListener('click', () => clean(false));
    (modal.querySelector('#modal-confirm') as HTMLButtonElement).addEventListener('click', () => clean(true));
  });
},

showTooltipWithCopy(content: string, left: number, top: number) {
  const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>`;
  const tooltip = document.createElement('div');
  tooltip.className = 'fixed z-50 bg-[#2B2F31] text-gray-200 p-4 rounded-lg shadow-lg flex flex-col';
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.width = '250px'; // 固定宽度
  tooltip.style.whiteSpace = 'normal'; // 自动换行
  tooltip.style.overflowWrap = 'break-word'; // 长单词换行
  tooltip.innerHTML = `
    <button class="text-white self-end hover:text-gray-300 flex " id="copy-btn">${copyIcon}</button>
    <div class="mb-2">${content}</div>
  `;
  document.body.appendChild(tooltip);

  const copyBtn = tooltip.querySelector('#copy-btn') as HTMLButtonElement;
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(content).then(() => {
      copyBtn.innerHTML = '✅';
      setTimeout(() => copyBtn.innerHTML = copyIcon, 200);
    });
  });

  tooltip.addEventListener('mouseleave', () => {
    tooltip.remove();
  });
}




}

export default blocks;
