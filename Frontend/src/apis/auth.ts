import { URL ,authToken,hubAuthToken} from "./api.ts";
import blocks from "../modules/blocks.ts";


const auth ={
async userRegister(username?: string, password?: string, email?: string): Promise<boolean> {
    // if (!username) username = (document.getElementById("username") as HTMLInputElement)?.value;
    // if (!password) password = (document.getElementById("password") as HTMLInputElement)?.value;
    // if (!email) email = (document.getElementById("email") as HTMLInputElement)?.value;
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
        const res = await fetch(`${URL}/api/auto/create/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization":`Bearer ${hubAuthToken}`
            },
            body: JSON.stringify({
                "name": username,
                "password_hash": password,
                "email": email 
            })
        });
        // console.log("查看现在的url:",URL)
        if (res.ok) {
            return true;
        } else {
            blocks.popupConfirm( "注册失败");
            return false; 
        }
    } catch (err) {
        blocks.popupConfirm("注册失败，请检查网络连接");
        return false;
    }
},


    async userLogin(username?: string, password?: string) {
        // if (!username) username = (document.getElementById("login-username")as HTMLInputElement)?.value;
        // if (!password) password = (document.getElementById("login-password")as HTMLInputElement)?.value;
        // console.log(username,password);
        try{
            const res = await fetch(`${URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization":`Bearer ${hubAuthToken}`
                },
                body: JSON.stringify({
                    "name":username,
                    "password_hash":password
                  })
              });
              const data = await res.json();
              const token = data.token;
            if (res.ok) {
               document.cookie = `authToken=${token}; path=/;`;
               window.location.href = `/index?apiUrl=${encodeURIComponent(URL)}`;
               // window.location.href = "/";
            } else {
                const errorData = await res.json().catch(() => ({}));
                blocks.popupConfirm(errorData.message || "登录失败");
            }
        }catch(err){
        console.log("登录失败：",err);
        blocks.popupConfirm("登录失败，请检查网络连接"); // 登录失败时弹出窗口
     }
   },

async isLogin(){
    try{
        const res = await fetch(`${URL}/api/auth/init`,{
            method:"GET",
            // headers:{
            //     "Authorization":`Bearer ${hubAuthToken}`

            // }
        });
        const data = await res.json()
        return data.init
    }catch(e){
        console.log(e);
        return false;
    }
},

async reflashToken(url:string,currentToken:string) : Promise<any> {
    try{
        console.log("开始刷新token")
        const res = await fetch(`${url}/api/auth/refresh`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${currentToken}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            console.log("查看更新后的token：",data.token)
            return data.token;
        }
        
    }catch(err){
        console.log("刷新Token失败：",err);
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
