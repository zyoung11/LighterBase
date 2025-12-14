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
      element.textContent = i18n.t(key);
    }
  });
  
  // 特殊处理pricing页面的音乐控制按钮
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn) {
    playPauseBtn.textContent = i18n.t('pricing.music.pause');
  }
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

  const pricingBtn = blocks.createButton(i18n.t('hub.navbar.pricing'));
  pricingBtn.id='pricing-link';
  pricingBtn.style.backgroundColor = 'lightgray';
  pricingBtn.style.color = 'gray';
  pricingBtn.style.border = '1px solid gray';
  pricingBtn.style.boxShadow = '0 0 0 0 gray';
  pricingBtn.style.padding = '0.5rem 1rem';
  pricingBtn.style.borderRadius = '0.5rem';
  pricingBtn.onmouseenter = () => {
    pricingBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    pricingBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
  pricingBtn.onmouseleave = () => {
    pricingBtn.style.transform = 'translateY(0) translateX(0)';
    pricingBtn.style.boxShadow = '0 0 0 0 gray';
  };
  pricingBtn.onmousedown = () => {
    pricingBtn.style.transform = 'translateY(2px) translateX(1px)';
    pricingBtn.style.boxShadow = '0 0 0 0 gray';
  };
  pricingBtn.onmouseup = () => {
    pricingBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    pricingBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
   pricingBtn.onclick = () => window.location.href = '/pricing';
  leftDiv.appendChild(pricingBtn);

  const docsBtn = blocks.createButton(i18n.t('hub.navbar.docs'));
  docsBtn.id='docs-link'
  docsBtn.style.backgroundColor = 'lightgray';
  docsBtn.style.color = 'gray';
  docsBtn.style.border = '1px solid gray';
  docsBtn.style.boxShadow = '0 0 0 0 gray';
  docsBtn.style.padding = '0.5rem 1rem';
  docsBtn.style.borderRadius = '0.5rem';
  docsBtn.onmouseenter = () => {
    docsBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    docsBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
  docsBtn.onmouseleave = () => {
    docsBtn.style.transform = 'translateY(0) translateX(0)';
    docsBtn.style.boxShadow = '0 0 0 0 gray';
  };
  docsBtn.onmousedown = () => {
    docsBtn.style.transform = 'translateY(2px) translateX(1px)';
    docsBtn.style.boxShadow = '0 0 0 0 gray';
  };
  docsBtn.onmouseup = () => {
    docsBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    docsBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
   docsBtn.onclick = () => window.location.href = '/docs';

  leftDiv.appendChild(docsBtn);

  nav.appendChild(leftDiv);

  // 右侧：Login in 或 用户名
  const rightDiv = document.createElement('div');
  rightDiv.className = 'relative';
  const userBtn = blocks.createButton(i18n.t('hub.navbar.login'));
  userBtn.id = 'user-link';
  userBtn.style.backgroundColor = 'lightgray';
  userBtn.style.color = 'gray';
  userBtn.style.border = '1px solid gray';
  userBtn.style.boxShadow = '0 0 0 0 gray';
  userBtn.style.padding = '0.5rem 1rem';
  userBtn.style.borderRadius = '0.5rem';
  userBtn.onmouseenter = () => {
    userBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    userBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
  userBtn.onmouseleave = () => {
    userBtn.style.transform = 'translateY(0) translateX(0)';
    userBtn.style.boxShadow = '0 0 0 0 gray';
  };
  userBtn.onmousedown = () => {
    userBtn.style.transform = 'translateY(2px) translateX(1px)';
    userBtn.style.boxShadow = '0 0 0 0 gray';
  };
  userBtn.onmouseup = () => {
    userBtn.style.transform = 'translateY(-4px) translateX(-2px)';
    userBtn.style.boxShadow = '2px 5px 0 0 gray';
  };
userBtn.onclick = () => window.location.href = '/login';

  // 添加语言切换按钮（放在用户名左边）
  const languageSwitcher = createLanguageSwitcher();
  rightDiv.appendChild(languageSwitcher);

  rightDiv.appendChild(userBtn);

  const logoutMenu = document.createElement('div');
  logoutMenu.id = 'logout-menu';
  logoutMenu.className = 'absolute top-full mt-1 bg-[#2B2F31] rounded-lg shadow-lg hidden z-10';
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logout-btn';
  logoutBtn.className = 'px-2 py-2 text-white hover:bg-[#3a3f41] rounded-lg w-16 text-center';
  logoutBtn.textContent = i18n.t('hub.navbar.logout');
  logoutMenu.appendChild(logoutBtn);
  rightDiv.appendChild(logoutMenu);

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
    docsBtn.textContent = i18n.t('hub.navbar.docs');
    pricingBtn.textContent = i18n.t('hub.navbar.pricing');
    
    // 重新翻译整个页面
    translatePage();
  });







  const username = localStorage.getItem('username');
  // console.log(username)
  const userBtn = document.getElementById('user-link') as HTMLButtonElement;
  const logoutMenu = document.getElementById('logout-menu') as HTMLDivElement;
  const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;

  if (token && username && userBtn && logoutMenu && logoutBtn) {
    userBtn.textContent = username;
    userBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      logoutMenu.classList.toggle('hidden');
    };

    // 更新登出按钮文本
    const updateLogoutButtonText = () => {
      logoutBtn.textContent = i18n.t('hub.navbar.logout');
    };
    updateLogoutButtonText();

    // 点击登出清除token
    logoutBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.cookie = 'hubAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      localStorage.removeItem('username');
      window.location.reload();
    });

    // 监听语言变化事件
    window.addEventListener('languageChanged', () => {
      updateLogoutButtonText();
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', function (e) {
      if (!userBtn.contains(e.target as Node) && !logoutMenu.contains(e.target as Node)) {
        logoutMenu.classList.add('hidden');
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
   }

   // 创建项目表单
   const createForm = document.getElementById('create-project-form') as HTMLFormElement;
   const avatarInput = document.getElementById('project-avatar') as HTMLInputElement;
   const nameInput = document.getElementById('project-name') as HTMLInputElement;
   const descInput = document.getElementById('project-description') as HTMLTextAreaElement;
   const previewAvatar = document.getElementById('preview-avatar') as HTMLImageElement;
   const previewName = document.getElementById('preview-name');
   const previewDesc = document.getElementById('preview-description');

   if (createForm && avatarInput && nameInput && descInput && previewAvatar && previewName && previewDesc && token) {
     // 实时预览
     previewAvatar.src=defaultImg;
     nameInput.addEventListener('input', () => {
       previewName.textContent = nameInput.value;
     });
     descInput.addEventListener('input', () => {
       previewDesc.textContent = descInput.value;
     });
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
    project_name: nameInput.value,
    project_avatar: avatarBase64,
    project_description: descInput.value,
  };
  const result = await projects.createProject(data, token);
  if (result) {
    // 重新加载项目，刷新网格
    window.location.reload(); // 简单方式，重新加载页面
    createForm.reset();
    previewAvatar.src = '';
    previewName.textContent = '';
    previewDesc.textContent = '';
    createModal?.classList.add('hidden');
    createModal?.classList.remove('flex');
  }
});



   }
 });


window.addEventListener('load', () => {
    // 确保加载器存在，并在所有资源（包括 hubDoc.ts 中的 marked.parse）完成后隐藏
    // const loader = (window as any).myLoader; // 假设通过全局变量访问
    // if (loader) {
    //     loader.hide(); 
    // }
    // 执行 docs.html 中原有的 FOUC 修复，显示页面内容
    document.body.style.opacity = '1';
    const styleTag = document.getElementById('fouc-fix');
    if (styleTag) {
        styleTag.remove();
    }
});
