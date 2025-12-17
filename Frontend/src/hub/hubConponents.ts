// import auth from "../apis/auth";
// import { hubToken } from "./hubAuth"
import blocks from "../modules/blocks";
import logoIcon from "../icons/logoWhite.png"
import projects from "./projects"
import office from './office.jpg'
import githubImg from '../icons/git.svg'
import defaultImg from "../icons/projectsDefault.jpg"
// import { createLoader } from "../modules/loader";
import { compressImage,checkAuthentication } from "../modules/tools";
import { i18n, createLanguageSwitcher } from "../modules/i18n";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

let token = getCookie('hubAuthToken');

//检查token
if(token)
checkAuthentication(token,'login')
// await checkAuthentication(hubToken,'login')
// let token = hubToken
let isEmpty = false;

// 翻译页面函数
function translatePage() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      const translation = i18n.t(key);
      if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translation);
      } else {
        element.textContent = translation;
      }
    }
  });
}

// 创建导航栏函数
function createNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'flex justify-between items-center px-6 py-2 rounded-lg bg-[#181A1B]';

  // 左侧：Logo、Pricing、Docs
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center space-x-4';

   const logoBtn = document.createElement('button');
   logoBtn.className = 'flex items-center space-x-2';
   logoBtn.onclick = () => window.location.href = '/';
  const logoImg = document.createElement('img');
  logoImg.src = logoIcon;
  logoImg.className = 'w-12 h-12';
  logoImg.alt = 'Logo';
  const logoSpan = document.createElement('span');
  logoSpan.className = 'text-xl font-bold';
  logoSpan.textContent = 'LighterBase';
  logoBtn.appendChild(logoImg);
  logoBtn.appendChild(logoSpan);
  leftDiv.appendChild(logoBtn);

 const pricingBtn = document.createElement('button');
    pricingBtn.id='pricing-link';
    pricingBtn.textContent = i18n.t('hub.navbar.pricing');
    pricingBtn.className = 'bg-transparent text-white border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
    pricingBtn.onclick = () => window.location.href = '/pricing';
   leftDiv.appendChild(pricingBtn);

    const docsBtn = document.createElement('button');
    docsBtn.id='docs-link';
    docsBtn.textContent = i18n.t('hub.navbar.docs');
    docsBtn.className = 'bg-transparent text-white border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
    docsBtn.onclick = () => window.location.href = '/docs';
   leftDiv.appendChild(docsBtn);

    const downloadBtn = document.createElement('button');
    downloadBtn.id='download-link';
    downloadBtn.textContent = i18n.t('hub.navbar.download');
    downloadBtn.className = 'bg-transparent text-white border-none p-2 rounded-lg cursor-pointer font-semibold transition-transform duration-200 ease-in-out hover:scale-110';
    downloadBtn.onclick = () => window.location.href = '/download';
   leftDiv.appendChild(downloadBtn);

  nav.appendChild(leftDiv);

  // 右侧：Login in 或 用户名
  const rightDiv = document.createElement('div');
  rightDiv.className = 'relative flex';
 const userBtn = document.createElement('button');
    userBtn.id = 'user-link';
    userBtn.textContent = i18n.t('hub.navbar.login');
    userBtn.className = ' bg-[#46A3FF] text-white border border-white p-2 rounded-lg cursor-pointer hover:bg-[#2E96FF]';
    userBtn.onclick = () => window.location.href = '/login';

   // 添加语言切换按钮（放在用户名左边）
   const languageSwitcher = createLanguageSwitcher();
   rightDiv.appendChild(languageSwitcher);

   const newDiv = document.createElement('div');
   newDiv.className = 'relative';
   newDiv.appendChild(userBtn);

    const profileMenu = document.createElement('div');
    profileMenu.id = 'profile-menu';
    profileMenu.className = 'absolute top-full right-1 mt-1 w-[10vh] bg-[#2B2F31] border border-white rounded-lg shadow-lg hidden z-10';
    // Profile section with avatar and username
    const profileDiv = document.createElement('div');
    profileDiv.className = 'flex items-center space-x-2 px-2 py-2';
    const avatarImg = document.createElement('img');
    avatarImg.src = defaultImg;
    avatarImg.className = 'w-8 h-8 rounded-full';
    const usernameSpan = document.createElement('span');
    usernameSpan.id = 'profile-username';
    profileDiv.appendChild(avatarImg);
    profileDiv.appendChild(usernameSpan);
    profileMenu.appendChild(profileDiv);
    // Message button
    const messageBtn = document.createElement('button');
    messageBtn.id = 'message-btn';
    messageBtn.className = 'px-2 py-2 text-white hover:bg-[#3a3f41] rounded-lg w-full text-center';
    messageBtn.textContent = i18n.t('hub.navbar.messages');
    profileMenu.appendChild(messageBtn);
    // Setting button
    const settingBtn = document.createElement('button');
    settingBtn.id = 'setting-btn';
    settingBtn.className = 'px-2 py-2 text-white hover:bg-[#3a3f41] rounded-lg w-full text-center';
    settingBtn.textContent = i18n.t('hub.navbar.setting');
    profileMenu.appendChild(settingBtn);
    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'px-2 py-2 text-white hover:bg-[#3a3f41] rounded-lg w-full text-center';
    logoutBtn.textContent = i18n.t('hub.navbar.logout');
    profileMenu.appendChild(logoutBtn);

    newDiv.appendChild(profileMenu);

   rightDiv.appendChild(newDiv);

  nav.appendChild(rightDiv);

  return nav;
}

document.addEventListener('DOMContentLoaded', async () => {
  const officeImg = document.getElementById('officeSrc') as HTMLImageElement
  const gitImg = document.getElementById('gitImg') as HTMLImageElement
  if(officeImg && gitImg){
  officeImg.src = office;
  gitImg.src = githubImg;
}
// 生成导航栏
  const newNav = createNavBar();
  document.body.insertBefore(newNav, document.body.firstChild);

  // 初始化翻译
  translatePage();






  // 监听语言变化事件，更新未登录状态的用户按钮文本
  window.addEventListener('languageChanged', () => {
    const userBtn = document.getElementById('user-link') as HTMLButtonElement;
    const username = localStorage.getItem('username');
    if (!token || !username) {
      userBtn.textContent = i18n.t('hub.navbar.login');
    }
    const docsBtn = document.getElementById('docs-link') as HTMLButtonElement;
    const pricingBtn = document.getElementById('pricing-link') as HTMLButtonElement;
    const downloadBtn = document.getElementById('download-link') as HTMLButtonElement;
    docsBtn.textContent = i18n.t('hub.navbar.docs');
    pricingBtn.textContent = i18n.t('hub.navbar.pricing');
    downloadBtn.textContent = i18n.t('hub.navbar.download');
    
    // 重新翻译整个页面
    translatePage();
  });







  const username = localStorage.getItem('username');
  // console.log(username)
  const userBtn = document.getElementById('user-link') as HTMLButtonElement;
  const profileMenu = document.getElementById('profile-menu') as HTMLDivElement;
  const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
  const settingBtn = document.getElementById('setting-btn') as HTMLButtonElement;
  const messagesBtn = document.getElementById('message-btn') as HTMLButtonElement;
  const usernameSpan = document.getElementById('profile-username') as HTMLSpanElement;
  if (usernameSpan) {
    usernameSpan.textContent = username;
  }

  if (token && username && userBtn && profileMenu && logoutBtn) {
    userBtn.textContent = username;
    userBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      profileMenu.classList.toggle('hidden');
    };

    // 更新登出按钮文本
    const updateButtonText = () => {
      logoutBtn.textContent = i18n.t('hub.navbar.logout');
      settingBtn.textContent = i18n.t('hub.navbar.setting');
      messagesBtn.textContent = i18n.t('hub.navbar.messages');
      
    };
    updateButtonText();

    // 点击登出清除token
    logoutBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.cookie = 'hubAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      localStorage.removeItem('username');
      window.location.reload();
    });

    // 监听语言变化事件
    window.addEventListener('languageChanged', () => {
      updateButtonText();
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', function (e) {
      if (!userBtn.contains(e.target as Node) && !profileMenu.contains(e.target as Node)) {
        profileMenu.classList.add('hidden');
      }
    });
  }
   // 鼠标悬停效果功能
   const hoverArea = document.getElementById("hover-area") as HTMLElement;
   const overlay = document.getElementById("overlay") as HTMLElement;

   if (hoverArea && overlay) {
     const radius = 50; // 圆形半径
     let animationId: number;

     const updateClipPath = (e: MouseEvent) => {
       const rect = overlay.getBoundingClientRect();
       const mouseX = e.clientX - rect.left;
       const mouseY = e.clientY - rect.top;
       overlay.style.clipPath = `circle(${radius}px at ${mouseX}px ${mouseY}px)`;
     };

     hoverArea.addEventListener('mouseenter', () => {
       overlay.style.opacity = '1';
     });

     hoverArea.addEventListener('mousemove', (e) => {
       if (animationId) cancelAnimationFrame(animationId);
       animationId = requestAnimationFrame(() => updateClipPath(e));
     });

     hoverArea.addEventListener('mouseleave', () => {
       if (animationId) cancelAnimationFrame(animationId);
       overlay.style.opacity = '0';
       overlay.style.clipPath = 'none';
     });
   }

    // 项目创建功能
    const addBtn = document.getElementById('add-project-btn');
    const createModal = document.getElementById('create-modal');
    const cancelBtn = document.getElementById('cancel-create');
    if (addBtn && createModal && cancelBtn) {
      addBtn.addEventListener('click', () => {
        createModal.classList.remove('hidden');
        createModal.classList.add('flex');
      });
      cancelBtn.addEventListener('click', () => {
        createModal.classList.add('hidden');
        createModal.classList.remove('flex');
      });
      // 点击背景关闭模态窗口
      createModal.onclick = (e) => {
        if (e.target === createModal) {
          createModal.classList.add('hidden');
          createModal.classList.remove('flex');
        }
      };
    }

    // 创建项目表单
    const createForm = document.getElementById('create-project-form') as HTMLFormElement;
    const avatarInput = document.getElementById('project-avatar') as HTMLInputElement;
    const previewAvatar = document.getElementById('preview-avatar') as HTMLImageElement;
    const previewName = document.getElementById('preview-name') as HTMLInputElement;
    const previewDesc = document.getElementById('preview-description') as HTMLTextAreaElement;

    if (createForm && avatarInput && previewAvatar && previewName && previewDesc && token) {
      // 初始化预览头像
      previewAvatar.src = defaultImg;

      // 使头像可点击来触发文件上传
      previewAvatar.addEventListener('click', () => {
        avatarInput.click();
      });

      // 文件选择事件
      avatarInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            previewAvatar.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        } else {
          previewAvatar.src = defaultImg;
        }
      });

createForm.addEventListener('submit', async (e) => {
   const createModal = document.getElementById('create-modal');
   if(createModal){
     createModal.classList.add('hidden');
     createModal.classList.remove('flex');
   }
   e.preventDefault();
   const file = avatarInput.files?.[0];
   let avatarBase64 = '';
   if (file) {
     const originalBase64 = await new Promise<string>((resolve: (value: string) => void) => {
       const reader = new FileReader();
       reader.onload = () => {
         if (typeof reader.result === 'string') {
           resolve(reader.result);
         } else {
           resolve('');
         }
       };
       reader.onerror = () => resolve('');
       reader.readAsDataURL(file);
     });
     if(originalBase64)
     avatarBase64 = await compressImage(originalBase64, 400, 0.8);
   }
   const data = {
     project_name: previewName.value,
     project_avatar: avatarBase64,
     project_description: previewDesc.value,
   };
   const result = await projects.createProject(data, token);
   if (result) {
     // 重新加载项目，刷新网格
     window.location.reload(); // 简单方式，重新加载页面
     createForm.reset();
     previewAvatar.src = defaultImg;
     previewName.value = '';
     previewDesc.value = '';
     createModal?.classList.add('hidden');
     createModal?.classList.remove('flex');
   }
 });



   }
 });


window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    const styleTag = document.getElementById('fouc-fix');
    if (styleTag) {
        styleTag.remove();
    }
});
