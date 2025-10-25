import blocks from "./modules/blocks";
import auth from "./apis/auth";

const tabLogin = document.getElementById("tab-login") as HTMLButtonElement;
const tabReg = document.getElementById("tab-reg") as HTMLButtonElement;
const formLogin = document.getElementById("form-login") as HTMLFormElement;
const formReg = document.getElementById("form-reg") as HTMLFormElement;

// 新增获取注册表单的输入框元素
const regUsernameInput = document.getElementById("username") as HTMLInputElement;
const regPasswordInput = document.getElementById("password") as HTMLInputElement;

// 新增获取登录表单的输入框元素
const loginUsernameInput = document.getElementById("login-username") as HTMLInputElement;
const loginPasswordInput = document.getElementById("login-password") as HTMLInputElement;


function toggleForm(isLogin = true) {
  if (isLogin) {
    tabLogin.classList.add("bg-[#2B2F31]", "text-white");
    tabLogin.classList.remove("bg-transparent", "hover:bg-[#2B2F31]/50");
    tabReg.classList.remove("bg-[#2B2F31]", "text-white");
    tabReg.classList.add("bg-transparent", "hover:bg-[#2B2F31]/50");
    formLogin.classList.remove("hidden");
    formReg.classList.add("hidden");
  } else {
    tabReg.classList.add("bg-[#2B2F31]", "text-white");
    tabReg.classList.remove("bg-transparent", "hover:bg-[#2B2F31]/50");
    tabLogin.classList.remove("bg-[#2B2F31]", "text-white");
    tabLogin.classList.add("bg-transparent", "hover:bg-[#2B2F31]/50");
    formReg.classList.remove("hidden");
    formLogin.classList.add("hidden");
  }
}

tabLogin.addEventListener("click", () => toggleForm(true));
tabReg.addEventListener("click", () => toggleForm(false));


formLogin.addEventListener("submit", async(e) => {
  e.preventDefault();
  // userLogin内部处理了成功后的跳转和失败后的弹窗
  await auth.userLogin();
  // window.location.href = "/";
});


formReg.addEventListener("submit", async(e) => {
  e.preventDefault();
  
  // 获取注册时的用户名和密码 (在调用 auth.userRegister() 之前获取)
  const username = regUsernameInput.value;
  const password = regPasswordInput.value;
  
  const success = await auth.userRegister();
  
  if (success) {
    // 1. 注册成功弹出窗口提示
    await blocks.popupConfirm("成功注册"); // 依赖于 blocks 模块，假设它已正确导入和可用
    
    // 2. 自动填入登录输入框
    loginUsernameInput.value = username;
    loginPasswordInput.value = password;
    
    // 3. 切换到登录表单
    toggleForm(true); 
    
    // 清空注册表单
    regUsernameInput.value = '';
    regPasswordInput.value = '';
    (document.getElementById("email") as HTMLInputElement).value = '';
  }
  
});
