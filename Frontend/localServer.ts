import IndexPage from './src/index.html';
import HubPage from './src/hub/hub.html';
import LoginPage from './src/hub/login.html';
import PricingPage from './src/hub/pricing.html';
import DocsPage from './src/hub/docs.html';
import WelcomePage from './src/welcome.html';
import ProjectPage from './src/hub/projects.html'
import DownloadPage from './src/hub/download.html';
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
    "/": HubPage,

    // Hub 页面
    "/index": IndexPage,
    "/index.html":IndexPage,


    // 登录页面
    "/login": LoginPage,
    "/login.html":LoginPage,
    "/hub/login.html": LoginPage,

    // 定价页面
    "/pricing": PricingPage,
    "/pricing.html":PricingPage,
    "/hub/pricing.html": PricingPage,

    // 文档页面
    "/docs": DocsPage,
    "/docs.html":DocsPage,
    "/hub/docs.html": DocsPage,

    //项目界面
    "/projects":ProjectPage,
    "/projects.html":ProjectPage,
    "/hub/projects.html":ProjectPage,

    // 欢迎页面
    "/welcome": WelcomePage,
    "/welcome.html": WelcomePage,


    //下载页面
    "/download":DownloadPage,
    "/download.html":DownloadPage,
    "/hub/download.html":DownloadPage


  },

  // fetch 处理器处理未定义的请求
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/docs/')) {
      try {
        const filePath = './src' + url.pathname;
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




// import open from 'open';

// // 定义一个映射，将 URL 路径映射到实际的 HTML 文件路径
// const 路由映射: Record<string, string> = {
//     // 根路径
//     "/": './src/hub/hub.html',
    
//     // 首页
//     "/index": './src/index.html',
//     "/index.html": './src/index.html',

//     // 登录页
//     "/login": './src/hub/login.html',
//     "/login.html": './src/hub/login.html',
//     "/hub/login.html": './src/hub/login.html',

//     // 定价页
//     "/pricing": './src/hub/pricing.html',
//     "/pricing.html": './src/hub/pricing.html',
//     "/hub/pricing.html": './src/hub/pricing.html',

//     // 文档页
//     "/docs": './src/hub/docs.html',
//     "/docs.html": './src/hub/docs.html',
//     "/hub/docs.html": './src/hub/docs.html',

//     // 项目页
//     "/projects": './src/hub/projects.html',
//     "/projects.html": './src/hub/projects.html',
//     "/hub/projects.html": './src/hub/projects.html',

//     // 欢迎页
//     "/welcome": './src/welcome.html',
//     "/welcome.html": './src/welcome.html',
// };

// // 启动 Bun 服务器
// const server = Bun.serve({
//     port: 80,
    
//     async fetch(请求: Request): Promise<Response> {
//         const url = new URL(请求.url);
//         const 路径 = url.pathname;

//         // 1. 处理静态 HTML 页面路由
//         if (路由映射[路径]) {
//             const 文件路径 = 路由映射[路径];
//             try {
//                 const 文件 = Bun.file(文件路径);
//                 if (await 文件.exists()) {
//                     return new Response(文件, {
//                         headers: { 'Content-Type': 'text/html; charset=utf-8' }
//                     });
//                 }
//             } catch (e) {
//                 console.error(`加载文件错误 ${文件路径}:`, e);
//                 return new Response('500 服务器内部错误: 无法加载页面', { status: 500 });
//             }
//         }

//         // 2. 处理 /docs/ 下的静态资源
//         if (路径.startsWith('/docs/')) {
//             try {
//                 const 文件路径 = './src' + 路径;
//                 const 文件 = Bun.file(文件路径);
                
//                 if (await 文件.exists()) {
//                     return new Response(文件);
//                 }
//             } catch {
//                 // 不作处理，进入 404
//             }
//         }

//         // 3. 任何未匹配的请求返回 404
//         return new Response(`404 找不到 ${路径}`, { status: 404 });
//     },

//     // 启用开发模式
//     development: true,
// });

// // console.log(`Bun 服务器运行在: http://${server.hostname}:${server.port}`);

// // // 自动在浏览器中打开根页面
// // await open(`http://localhost:${server.port}/`);
