// import auth from "../apis/auth";
import  hubauth from "./hubAuth"
import blocks from "../modules/blocks";
import logoIcon from "../icons/LOGOW.png"
import projects from "./projects"
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

  // 定义 loadProjects 函数
  function loadProjects(token: string) {
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
      projects.getAllProjects(token).then(data => {
        if (data) {
          projectsGrid.innerHTML = '';
          data.forEach((project: any) => {
            const projectDiv = document.createElement('div');
            projectDiv.className = 'bg-[#2B2F31] p-4 rounded-lg cursor-pointer hover:bg-[#3a3f41] transition-colors';
            projectDiv.setAttribute('data-id', project.id);
            projectDiv.innerHTML = `
              <img src="${project.project_avatar}" alt="Avatar" class="w-16 h-16 rounded-full mb-2">
              <h3 class="text-xl font-bold mb-2">${project.project_name}</h3>
              <p class="text-sm">${project.project_description}</p>
            `;
            projectDiv.addEventListener('click', () => selectProject(project, data, token));
            projectsGrid.appendChild(projectDiv);
          });
        }
      });
    }
  }

  // 选择项目函数
  function selectProject(selectedProject: any, allProjects: any[], token: string) {
    const grid = document.getElementById('projects-grid');
    const selectedLayout = document.getElementById('selected-layout');
    const sidebar = document.getElementById('sidebar');
    const selectedCard = document.getElementById('selected-project-card');
    const otherProjects = document.getElementById('other-projects');
    const detailName = document.getElementById('detail-name');
    const detailDescription = document.getElementById('detail-description');
    const deleteBtn = document.getElementById('delete-project-btn');
    const backBtn = document.getElementById('back-btn');

    if (grid && selectedLayout && sidebar && selectedCard && otherProjects && detailName && detailDescription && deleteBtn && backBtn) {
      // 隐藏网格，显示选中布局
      grid.classList.add('hidden');
      selectedLayout.classList.remove('hidden');

      // 设置选中项目卡片
      selectedCard.innerHTML = `
        <img src="${selectedProject.project_avatar}" alt="Avatar" class="w-12 h-12 rounded-full mb-2">
        <h4 class="text-lg font-bold">${selectedProject.project_name}</h4>
        <p class="text-sm">${selectedProject.project_description}</p>
      `;

      // 设置其他项目
      otherProjects.innerHTML = '';
      allProjects.filter(p => p.project_id !== selectedProject.project_id).forEach(project => {
        const div = document.createElement('div');
        div.className = 'bg-[#2B2F31] p-4 rounded cursor-pointer hover:bg-[#3a3f41]';
        div.innerHTML = `
          <img src="${project.project_avatar}" alt="Avatar" class="w-12 h-12 rounded-full mb-2">
          <h4 class="text-lg font-bold mb-1">${project.project_name}</h4>
          <p class="text-sm">${project.project_description}</p>
        `;
        div.addEventListener('click', () => selectProject(project, allProjects, token));
        otherProjects.appendChild(div);
      });

      // 设置详情
      detailName.textContent = selectedProject.project_name;
      detailDescription.textContent = selectedProject.project_description;

      // 删除按钮
      deleteBtn.onclick = async () => {
        await projects.deleteProject(selectedProject.id, token);
        selectedLayout.classList.add('hidden');
        grid.classList.remove('hidden');
        loadProjects(token);
      };

      // 返回按钮
      backBtn.onclick = () => {
        selectedLayout.classList.add('hidden');
        grid.classList.remove('hidden');
      };
    }
  }

  // 项目相关功能
  if (token) {
    loadProjects(token);
  }

  // 添加项目按钮
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
      }
    });

    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = avatarInput.files?.[0];
      let avatarBase64 = '';
      if (file) {
        avatarBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      const data = {
        project_name: nameInput.value,
        project_avatar: avatarBase64,
        project_description: descInput.value,
      };
      const result = await projects.createProject(data, token);
      if (result) {
        loadProjects(token);
        createForm.reset();
        previewAvatar.src = '';
        previewName.textContent = '';
        previewDesc.textContent = '';
        createModal?.classList.add('hidden');
        createModal?.classList.remove('flex');
      }
    });
  }

  // 项目列表事件委托
  const projectsList = document.getElementById('projects-list');
  if (projectsList && token) {
    projectsList.addEventListener('click', async (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('delete-btn')) {
        const id = parseInt(target.getAttribute('data-id')!);
        await projects.deleteProject(id, token);
        loadProjects(token);
      } else if (target.classList.contains('edit-btn')) {
        const id = parseInt(target.getAttribute('data-id')!);
        const newDesc = prompt('New description:');
        if (newDesc) {
          // 获取当前项目以保留其他字段
          const project = await projects.getSingleProject(id, token);
          if (project) {
            await projects.updateProject(id, {
              project_name: project.project_name,
              project_avatar: project.project_avatar,
              project_description: newDesc
            }, token);
            loadProjects(token);
          }
        }
      }
    });
  }



  // 获取单个用户功能
  const getUserBtn = document.getElementById('get-user-btn');
  if (getUserBtn && token) {
    getUserBtn.addEventListener('click', async () => {
      const userId = parseInt(prompt('Enter user ID:') || '0');
      if (userId) {
        const user = await projects.getSingleUser(userId, token);
        if (user) {
          alert(`User: ${user.user_name}`);
        }
      }
    });
  }

  // 获取单个项目功能
  const getSingleProjectBtn = document.getElementById('get-single-project-btn');
  const singleProjectIdInput = document.getElementById('single-project-id') as HTMLInputElement;
  const singleProjectDisplay = document.getElementById('single-project-display');
  if (getSingleProjectBtn && singleProjectIdInput && singleProjectDisplay && token) {
    getSingleProjectBtn.addEventListener('click', async () => {
      const id = parseInt(singleProjectIdInput.value);
      if (id) {
        const project = await projects.getSingleProject(id, token);
        if (project) {
          singleProjectDisplay.innerHTML = `
            <h3 class="text-xl font-bold">${project.project_name}</h3>
            <p>Description: ${project.project_description}</p>
            <p>Avatar: ${project.project_avatar}</p>
          `;
          singleProjectDisplay.classList.remove('hidden');
        } else {
          singleProjectDisplay.innerHTML = '<p>Project not found.</p>';
          singleProjectDisplay.classList.remove('hidden');
        }
      }
    });
  }
});
