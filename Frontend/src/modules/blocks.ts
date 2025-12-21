import { i18n } from "./i18n";


const blocks={
popupConfirm(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className =
      'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

    const panel = document.createElement('div');
    panel.className =
      'min-w-[280px] justify-center items-center rounded-xl bg-white/10 backdrop-blur-md text-gray-200 shadow-2xl p-6 border border-white/20 shadow-2xl';

    panel.innerHTML = `
      <p class="mb-5 text-center">${text}</p>
      <div class="flex justify-center gap-3">
        <button id="cancelBtn" class="text-white px-4 py-2 rounded-md border border-gray-400 hover-gray-600 transition">No</button>
        <button id="okBtn" class="text-white px-4 py-2 rounded-md border border-gray-400 hover:bg-gray-600 transition">Yes</button>

      </div>
    `;


    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    const cancelbtn = document.getElementById("cancelBtn") as HTMLButtonElement;
    const okbtn = document.getElementById("okBtn") as HTMLElement;
    cancelbtn.textContent = i18n.t('common.confirm.no');
    okbtn.textContent = i18n.t('common.confirm.yes');

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
    modal.className = 'min-w-[280px] flex fixed bottom-4 left-4 mx-auto justify-center items-center right-4 bg-white/10 p-3 shadow-2xl rounded-full border border-white/20';

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
  tooltip.className = 'fixed z-50 bg-[#2B2F31] text-gray-200 p-4 rounded-lg shadow-sm shadow-white flex flex-col';
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
},

createButton(text: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.innerText = text;
  button.style.backgroundColor = 'white';
  button.style.color = 'black';
  button.style.borderRadius = '10em';
  button.style.fontSize = '15px';
  button.style.fontWeight = '600';
  button.style.padding = '1em 2em';
  button.style.cursor = 'pointer';
  button.style.transition = 'all 0.3s ease-in-out';
  button.style.border = '1px solid black';
  button.style.boxShadow = '0 0 0 0 black';

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-4px) translateX(-2px)';
    button.style.boxShadow = '2px 5px 0 0 black';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0) translateX(0)';
    button.style.boxShadow = '0 0 0 0 black';
  });

  button.addEventListener('mousedown', () => {
    button.style.transform = 'translateY(2px) translateX(1px)';
    button.style.boxShadow = '0 0 0 0 black';
  });

  button.addEventListener('mouseup', () => {
    button.style.transform = 'translateY(-4px) translateX(-2px)';
    button.style.boxShadow = '2px 5px 0 0 black';
  });

  return button;
},

// 创建导航栏函数
// function createNavBar() {
//   const nav = document.createElement('nav');
//   nav.className = 'flex justify-between items-center px-6 py-[1vh] rounded-lg bg-[#181A1B]';

//   // 左侧：Logo、Pricing、Docs
//   const leftDiv = document.createElement('div');
//   leftDiv.className = 'flex items-center space-x-4';

//    const logoBtn = document.createElement('button');
//    logoBtn.className = 'flex items-center space-x-2';
//    logoBtn.onclick = () => window.location.href = '/';
//   const logoImg = document.createElement('img');
//   logoImg.src = logoIcon;
//   logoImg.className = 'w-[5vh] h-[5vh]';
//   logoImg.alt = 'Logo';
//   const logoSpan = document.createElement('span');
//   logoSpan.className = 'text-[1.5rem] font-bold';
//   logoSpan.textContent = 'LighterBase';
//   logoBtn.appendChild(logoImg);
//   logoBtn.appendChild(logoSpan);
//   leftDiv.appendChild(logoBtn);

//  const pricingBtn = document.createElement('button');
//     pricingBtn.id='pricing-link';
//     pricingBtn.textContent = i18n.t('hub.navbar.pricing');
//     pricingBtn.className = 'bg-transparent text-white text-[1.2rem] border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
//     pricingBtn.onclick = () => window.location.href = '/pricing';
//    leftDiv.appendChild(pricingBtn);

//     const docsBtn = document.createElement('button');
//     docsBtn.id='docs-link';
//     docsBtn.textContent = i18n.t('hub.navbar.docs');
//     docsBtn.className = 'bg-transparent text-white text-[1.2rem] border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
//     docsBtn.onclick = () => window.location.href = '/docs';
//    leftDiv.appendChild(docsBtn);

//      const downloadBtn = document.createElement('button');
//      downloadBtn.id='download-link';
//      downloadBtn.textContent = i18n.t('hub.navbar.download');
//      downloadBtn.className = 'bg-transparent text-white text-[1.2rem] border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
//      downloadBtn.onclick = () => window.location.href = '/download';
//     leftDiv.appendChild(downloadBtn);

//      const projectsBtn = document.createElement('button');
//      projectsBtn.id='projects-link';
//      projectsBtn.textContent = i18n.t('hub.navbar.projects');
//      projectsBtn.className = 'bg-transparent text-white text-[1.2rem] border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
//      projectsBtn.onclick = () => window.location.href = '/projects';
//     leftDiv.appendChild(projectsBtn);

//   nav.appendChild(leftDiv);

//   // 右侧：Login in 或 用户名
//    const rightDiv = document.createElement('div');
//    rightDiv.className = 'relative flex items-center';
//   const userBtn = document.createElement('button');
//      userBtn.id = 'user-link';
//      userBtn.className = ' bg-[#46A3FF] text-white text-[1.5rem] border border-white w-[4vh] h-[4vh] rounded-full cursor-pointer hover:bg-[#2E96FF] flex items-center justify-center';
//      userBtn.onclick = () => window.location.href = '/login';

//      const iconImg = document.createElement('img');
//      iconImg.src = userIcon;
//      iconImg.className = 'w-6 h-6';
//      userBtn.appendChild(iconImg);

//     // 添加消息按钮（放在语言切换按钮左边）
//     const navMessageBtn = document.createElement('button');
//     navMessageBtn.id = 'nav-message-btn';
//     navMessageBtn.className = 'bg-transparent text-white border-none w-10 h-10 rounded-full cursor-pointer hover:scale-110 flex items-center justify-center';
//     navMessageBtn.onclick = () => window.location.href = '/messages'; // 假设跳转到消息页面

//     const messageIcon = document.createElement('img');
//     messageIcon.src = messagesIcon;
//     messageIcon.className = 'w-[3vh] h-[3vh]';
//     navMessageBtn.appendChild(messageIcon);
//     rightDiv.appendChild(navMessageBtn);

//     // 添加语言切换按钮（放在用户名左边）
//     const languageSwitcher = createLanguageSwitcher();
//     rightDiv.appendChild(languageSwitcher);

//     rightDiv.appendChild(userBtn);

//   nav.appendChild(rightDiv);

//   return nav;
// }





}

export default blocks;
