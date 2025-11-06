import auth from "../apis/auth";
// hubConponents.ts

let isEmpty = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 登录功能
  const formLogin = document.getElementById("form-login") as HTMLFormElement;
  const loginUsernameInput = document.getElementById("login-username") as HTMLInputElement;
  const loginPasswordInput = document.getElementById("login-password") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const emailField = document.getElementById("email-field") as HTMLDivElement;

  if (formLogin && loginUsernameInput && loginPasswordInput && emailInput && emailField) {
    isEmpty = await auth.isLogin();
    if (!isEmpty) {
      emailField.style.display = 'block';
      emailInput.required = true;
    } else {
      emailField.style.display = 'none';
      emailInput.required = false;
    }

    formLogin.addEventListener("submit", async(e) => {
      e.preventDefault();
      if (!isEmpty) {
        // 设置注册输入
        (document.getElementById("username") as HTMLInputElement).value = loginUsernameInput.value;
        (document.getElementById("password") as HTMLInputElement).value = loginPasswordInput.value;
        const success = await auth.userRegister();
        if (success) {
          await auth.userLogin();
        }
      } else {
        await auth.userLogin();
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
