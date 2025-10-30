// hubConponents.ts

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.querySelector('form') as HTMLFormElement;
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = (document.querySelector('input[type="text"]') as HTMLInputElement).value;
      const password = (document.querySelector('input[type="password"]') as HTMLInputElement).value;

      // 简单检查：用户名和密码不为空
      if (username.trim() && password.trim()) {
        // 登录成功，跳转到hub页面
        window.location.href = 'hub';
      } else {
        // 可选：显示错误，但用户说不要弹窗，所以或许什么都不做或轻微提示
        // 这里不做任何事
      }
    });
  }
});
