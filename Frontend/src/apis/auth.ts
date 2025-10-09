import { URL } from "./api.ts";
import blocks from "../modules/blocks.ts";


const auth ={
async userRegister() {
    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    
    if (!email) {
        blocks.popupConfirm("邮箱不能为空");
        return;
    }
    try {
        if (!this.isValidEmail(email)) {
            blocks.popupConfirm("请输入有效的邮箱地址");
            return;
        }
        
        const res = await fetch(`${URL}/api/auto/create/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "name": username,
                "password_hash": password,
                "email": email  // 确保包含 email 字段
            })
        });
        
        if (res.ok) {
            blocks.popupConfirm("成功注册");
            // 清空表单
            (document.getElementById("username") as HTMLInputElement).value = '';
            (document.getElementById("password") as HTMLInputElement).value = '';
            (document.getElementById("email") as HTMLInputElement).value = '';
        } else {
            // 处理服务器返回的错误
            const errorData = await res.json().catch(() => ({}));
            blocks.popupConfirm(errorData.message || "注册失败");
        }
    } catch (err) {
        console.log("注册失败：", err);
        blocks.popupConfirm("注册失败，请检查网络连接");
    }
},


    async userLogin() {
        const loginusername = (document.getElementById("login-username")as HTMLInputElement).value;
        const loginpassword = (document.getElementById("login-password")as HTMLInputElement).value;
        console.log(loginusername,loginpassword);
        try{
            const res = await fetch(`${URL}/api/auth/login`, {
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
               document.cookie = `authToken=${token}; path=/;`;
               //path=/ 表示这个 cookie 在整个网站都有效
               const success = await blocks.popupConfirm("成功登录");
                if (success) {
                   window.location.href = "/";
               }
            }
        }catch(err){
        console.log("登录失败：",err);
     }
    },

isValidEmail(email: string): boolean {
    if (email.length === 0) {
        return false;
    }
    const EMAIL_REGEX =
        /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/i;
    return EMAIL_REGEX.test(email);
}
} 

export default auth;
