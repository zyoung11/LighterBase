
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
}

}

export default blocks;
