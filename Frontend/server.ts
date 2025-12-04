// 导入 HTML 文件作为 HTMLBundle
import IndexPage from './src/index.html';
import HubPage from './src/hub/hub.html';
import LoginPage from './src/hub/login.html';
import PricingPage from './src/hub/pricing.html';
import DocsPage from './src/hub/docs.html';
import WelcomePage from './src/welcome.html';
import ProjectPage from './src/hub/projects.html'
import open from 'open';

const server = Bun.serve({
  port: 8080,

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

  // 启用开发模式以支持热重载
  development: true,
});

// console.log(`Bun 服务器运行在: http://${server.hostname}:${server.port}`);
// console.log(`访问页面: http://localhost:3000/ (根页面), http://localhost:3000/hub (Hub页面), 等`);

// // 自动在浏览器中打开 /hub 页面
// await open('http://localhost:3000/hub');
