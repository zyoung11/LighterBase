import IndexPage from './app/index.html';
import ProjectPage from './app/hub/projects.html'
import AdminPage from './app/hub/admin.html'
import LoginPage from "./app/hub/login.html"
import open from 'open';

const server = Bun.serve({
  // port: 80,
  port: 3000,
  // 使用 routes 选项定义自定义 URL 路径
  routes: {
    // // 根路径
    // "/": IndexPage,

    // // Hub 页面
    // "/hub": HubPage,
    // "/hub.html":HubPage,
    // "/hub/hub.html": HubPage,
    // 根路径

    //项目界面
    "/":ProjectPage,


    // Hub 页面
    "/index": IndexPage,
    "/index.html":IndexPage,

    // 登录页面
    "/login": LoginPage,
    "/login.html":LoginPage,
    "/hub/login.html": LoginPage,


    //管理界面
    "/admin":AdminPage,
    "/admin.html":AdminPage,
    "/hub/admin.html":AdminPage,





  },

  // fetch 处理器处理未定义的请求
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/musics/')) {
      try {
        const filePath = './app' + url.pathname;
        const file = Bun.file(filePath);
        return new Response(file);
      } catch {
        return new Response('404 Not Found', { status: 404 });
      }
    }
    if (url.pathname.startsWith('/docs/')) {
      try {
        const filePath = './app' + url.pathname;
        const file = Bun.file(filePath);
        return new Response(file);
      } catch {
        return new Response('404 Not Found', { status: 404 });
      }
    }
    return new Response(`404 Not Found for ${url.pathname}`, { status: 404 });
  },

  development: true,
});

console.log(`Bun 服务器运行在: http://${server.hostname}:${server.port}`);
// console.log(`访问页面: http://localhost:3000`);

// // // 自动在浏览器中打开 /hub 页面
// // await open('http://localhost:3000/hub');


