import {jwtDecode} from "jwt-decode"
import auth from "./auth" 
const URL ="http://localhost:8080"
const cookies = document.cookie;
let authToken = "";
const authTokenMatch = cookies.match(/authToken=([^;]*)/);
if (authTokenMatch && authTokenMatch[1]) {
  authToken = authTokenMatch[1];
}
const exp = Number(jwtDecode(authToken).exp)*1000;
if(exp){
  if(exp < Date.now()){
    console.log("token已经过期");
    await auth.reflashToken();
    console.log("Token更新成功");    
  }
}
export {
    URL,
    authToken
};
