import blocks from "../modules/blocks";
import { URL } from "../apis/api";
// const URL = "http://localhost:8080"

const hubauth = {
async hubUserRegister(): Promise<boolean> {
    const usernameInput = document.getElementById("username") as HTMLInputElement;
    const passwordInput = document.getElementById("password") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    if (!usernameInput || !passwordInput || !emailInput) {
        return false;
    }
    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = emailInput.value;
    
    if (!email) {
        blocks.popupConfirm("邮箱不能为空");
        return false;
    }
    try {
        if (!this.isValidEmail(email)) {
            blocks.popupConfirm("请输入有效的邮箱地址");
            return false; 
        }
        console.log(username,password,email)
        const res = await fetch(`${URL}/api/users/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": username,
                "password_hash": password,
                "email": email 
            })
        });
        
        if (res.ok) {
            return true;
        } else {
            blocks.popupConfirm( "注册失败");
            return false; 
        }
    } catch (err) {
        console.log("注册失败：", err);
        blocks.popupConfirm("注册失败，请检查网络连接");
        return false;
    }
},


    async hubUserLogin() {
        const usernameInput = document.getElementById("username") as HTMLInputElement;
        const passwordInput = document.getElementById("password") as HTMLInputElement;
        if (!usernameInput || !passwordInput) {
            return false;
        }
        const loginusername = usernameInput.value;
        const loginpassword = passwordInput.value;
        console.log(loginusername,loginpassword);
        try{
            const res = await fetch(`${URL}/api/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "name":loginusername,
                    "password_hash":loginpassword
                  })
              });
              const data = await res.json();
              const token = data.token;
            if (res.ok) {
                document.cookie = `hubAuthToken=${token}; path=/;`;
                // console.log(data.user)
                localStorage.setItem('username',loginusername);
                return true;
            } else {
                const errorData = await res.json().catch(() => ({}));
                blocks.popupConfirm(errorData.message || "登录失败");
                return false;
            }
        }catch(err){
        console.log("登录失败：",err);
        blocks.popupConfirm("登录失败，请检查网络连接"); // 登录失败时弹出窗口
        return false;
      }
    },
isValidEmail(email: string): boolean {
    if (email.length === 0) {
        return false;
    }
    const EMAIL_REGEX =
        /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/i;
    return EMAIL_REGEX.test(email);
},

init() {
    const self = this;
    document.addEventListener('DOMContentLoaded', function () {
      // 检查是否在登录页面
      if (!document.getElementById('toggle-login')) {
        return;
      }

      document.body.style.opacity = '1';

      const styleTag = document.getElementById('fouc-fix');
      if (styleTag) {
        styleTag.remove();
      }

      // 元素引用
      const toggleLogin = document.getElementById('toggle-login') as HTMLElement;
      const toggleRegister = document.getElementById('toggle-register')as HTMLElement;
      const authForm = document.getElementById('auth-form')as HTMLElement;
      const emailField = document.getElementById('email-field')as HTMLElement;
      const submitBtn = document.getElementById('submit-btn')as HTMLElement;
      const usernameInput = document.getElementById('username')as HTMLInputElement;
      const passwordInput = document.getElementById('password')as HTMLInputElement;
      const emailInput = document.getElementById('email')as HTMLInputElement;

        let isLoginMode = true;

        // 切换到登录模式
        function switchToLogin() {
            isLoginMode = true;
            emailField.classList.add('hidden');
            emailInput.required = false;
            submitBtn.textContent = '登录';
            toggleLogin.className = 'w-[50%] px-2 py-2 bg-[#46A3FF] text-white rounded-l-lg transition-colors';
            toggleRegister.className = 'w-[50%] px-2 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] text-gray-200 rounded-r-lg transition-colors';
        }

        // 切换到注册模式
        function switchToRegister() {
            isLoginMode = false;
            emailField.classList.remove('hidden');
            emailInput.required = true;
            submitBtn.textContent = '注册';
            toggleLogin.className = 'w-[50%] px-2 py-2 bg-[#2B2F31] hover:bg-[#3a3f41] text-gray-200 rounded-l-lg transition-colors';
            toggleRegister.className = 'w-[50%] px-2 py-2 bg-[#46A3FF] text-white rounded-r-lg transition-colors';
        }

        // 事件监听器
        toggleLogin.addEventListener('click', switchToLogin);
        toggleRegister.addEventListener('click', switchToRegister);

        // 表单提交
        authForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            const email = emailInput.value.trim();

            if (isLoginMode) {
                if (!username || !password) {
                    alert('请填写用户名和密码');
                    return;
                }
                // 登录
                const success = await self.hubUserLogin();
                if (success) {
                    window.location.href = '/projects';
                }
            } else {
                if (!username || !password || !email) {
                    alert('请填写用户名、密码和邮箱');
                    return;
                }
                // 注册
                const success = await self.hubUserRegister();
                if (success) {
                    // 注册成功，填充用户名和密码，切换到登录
                    usernameInput.value = username;
                    passwordInput.value = password;
                    switchToLogin();
                    alert('注册成功，请登录');
                }
            }
        });
    });
}

   
}

hubauth.init();

export default hubauth
