// import auth from "../apis/auth";
import  hubauth from "./hubAuth" 
import blocks from "../modules/blocks";
import logoIcon from "../icons/LOGOW.png"
// hubConponents.ts

let isEmpty = false;

// 创建导航栏函数
function createNavBar() {
  const nav = document.createElement('nav');
  nav.className = 'flex justify-between items-center px-6 py-2 rounded-lg bg-[#181A1B]';

  // 左侧：Logo、Pricing、Docs
  const leftDiv = document.createElement('div');
  leftDiv.className = 'flex items-center space-x-4';

  const logoBtn = document.createElement('button');
  logoBtn.className = 'flex items-center space-x-2';
  logoBtn.onclick = () => window.location.href = 'hub.html';
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

  const pricingBtn = blocks.createButton('Pricing');
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
  pricingBtn.onclick = () => window.location.href = 'pricing.html';
  leftDiv.appendChild(pricingBtn);

  const docsBtn = blocks.createButton('Docs');
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
  docsBtn.onclick = () => window.location.href = 'docs.html';
  leftDiv.appendChild(docsBtn);

  nav.appendChild(leftDiv);

  // 右侧：Login in 或 用户名
  const rightDiv = document.createElement('div');
  rightDiv.className = 'relative';
  const userBtn = blocks.createButton('Login in');
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
  userBtn.onclick = () => window.location.href = 'login.html';
  rightDiv.appendChild(userBtn);

  const logoutMenu = document.createElement('div');
  logoutMenu.id = 'logout-menu';
  logoutMenu.className = 'absolute top-full mt-1 bg-[#2B2F31] rounded-lg shadow-lg hidden z-10';
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logout-btn';
  logoutBtn.className = 'px-4 py-2 text-white hover:bg-[#3a3f41] rounded-lg w-16 text-center';
  logoutBtn.textContent = '登出';
  logoutMenu.appendChild(logoutBtn);
  rightDiv.appendChild(logoutMenu);

  nav.appendChild(rightDiv);

  return nav;
}

document.addEventListener('DOMContentLoaded', async () => {
  // 生成导航栏
  const newNav = createNavBar();
  document.body.insertBefore(newNav, document.body.firstChild);

  // 检查登录状态
  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }

  const token = getCookie('hubAuthToken');
  const username = localStorage.getItem('username');
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

    // 点击登出清除token
    logoutBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      document.cookie = 'hubAuthToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      localStorage.removeItem('username');
      window.location.reload();
    });

    // 点击其他地方隐藏菜单
    document.addEventListener('click', function (e) {
      if (!userBtn.contains(e.target as Node) && !logoutMenu.contains(e.target as Node)) {
        logoutMenu.classList.add('hidden');
      }
    });
  }

  // 登录功能
  const formLogin = document.getElementById("form-login") as HTMLFormElement;
  const loginUsernameInput = document.getElementById("login-username") as HTMLInputElement;
  const loginPasswordInput = document.getElementById("login-password") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const emailField = document.getElementById("email-field") as HTMLDivElement;

  if (formLogin && loginUsernameInput && loginPasswordInput && emailInput && emailField) {
    // isEmpty = await auth.isLogin();
    // if (!isEmpty) {
    //   emailField.style.display = 'block';
    //   emailInput.required = true;
    // } else {
    //   emailField.style.display = 'none';
    //   emailInput.required = false;
    // }

    formLogin.addEventListener("submit", async(e) => {
      e.preventDefault();
      if (!isEmpty) {
        // 设置注册输入
        (document.getElementById("username") as HTMLInputElement).value = loginUsernameInput.value;
        (document.getElementById("password") as HTMLInputElement).value = loginPasswordInput.value;
        const success = await hubauth.hubUserRegister();
        if (success) {
          await hubauth.hubUserLogin();
        }
      } else {
        await hubauth.hubUserLogin();
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
});
