import blocks from "../modules/blocks";
import { URL } from "../apis/api";
// const URL = "htt[://localhost:8080"

const hubauth = {
async hubUserRegister(): Promise<boolean> {
    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    
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
        const loginusername = (document.getElementById("login-username")as HTMLInputElement).value;
        const loginpassword = (document.getElementById("login-password")as HTMLInputElement).value;
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
               // window.location.href = "hub.html";
            } else {
                const errorData = await res.json().catch(() => ({}));
                blocks.popupConfirm(errorData.message || "登录失败");
            }
        }catch(err){
        console.log("登录失败：",err);
        blocks.popupConfirm("登录失败，请检查网络连接"); // 登录失败时弹出窗口
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


export default hubauth
