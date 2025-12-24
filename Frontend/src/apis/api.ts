import config from "../config.json"


let theURL = config.localUrl
let URL = config.localUrl
const cookies = document.cookie;
let authToken = "";
const authTokenMatch = cookies.match(/authToken=([^;]*)/);
if (authTokenMatch && authTokenMatch[1]) {
  authToken = authTokenMatch[1];
}
let hubAuthToken = ""
const hubAuthTokenMatch = cookies.match(/hubAuthToken=([^;]*)/);
if (hubAuthTokenMatch && hubAuthTokenMatch[1]) {
  hubAuthToken = hubAuthTokenMatch[1];
}
// 初始化时从 URL 参数读取 apiUrl
const urlParams = new URLSearchParams(window.location.search);
const apiUrlParam = urlParams.get('apiUrl');
if (apiUrlParam) {
  URL = decodeURIComponent(apiUrlParam);
}

function setBaseUrl(url?: string): void {
  if (url && typeof url === 'string' && url.trim()) {
    URL = url.trim();
  } else {
    URL = config.localUrl
  }
}

export {
    URL,
    theURL,
    authToken,
    hubAuthToken,
    setBaseUrl
};
