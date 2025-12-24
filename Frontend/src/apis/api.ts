const apiUrl = "http://localhost:8080"
// const apiUrl = "http://www.smallwoodice.cn:8080"
let theURL = apiUrl
let URL = apiUrl
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
    URL = apiUrl
  }
}

export {
    URL,
    theURL,
    authToken,
    hubAuthToken,
    setBaseUrl
};
