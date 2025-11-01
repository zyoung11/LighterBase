// hubConponents.ts

import auth from "../apis/auth";

let isEmpty = false;

document.addEventListener('DOMContentLoaded', async () => {
  const formLogin = document.getElementById("form-login") as HTMLFormElement;
  const loginUsernameInput = document.getElementById("login-username") as HTMLInputElement;
  const loginPasswordInput = document.getElementById("login-password") as HTMLInputElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const emailField = document.getElementById("email-field") as HTMLDivElement;

  if (!formLogin || !loginUsernameInput || !loginPasswordInput || !emailInput || !emailField) {
    console.error("Required elements not found in DOM");
    return;
  }

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
});
