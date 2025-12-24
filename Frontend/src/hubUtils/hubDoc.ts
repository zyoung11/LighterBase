// Import HTML files as text
import startHtmlRaw from '../docs/start.html' assert { type: 'text' };

// Import images
import mainpageImg from '../docs/imgs/mainpage.jpeg';
import registerImg from '../docs/imgs/register.jpeg';
import loginpageImg from '../docs/imgs/loginpage.jpeg';
import projectcImg from '../docs/imgs/projectc.jpeg';
import arcDataImg from '../docs/imgs/arcData.jpeg';
import projectloginImg from '../docs/imgs/projectlogin.jpeg';
import projectDImg from '../docs/imgs/projectD.jpeg';
import projectERImg from '../docs/imgs/projectER.jpeg';
import queryImg from '../docs/imgs/query.jpeg';
import permissionImg from '../docs/imgs/permission.jpeg';
import SDKImg from '../docs/imgs/SDK.jpeg';
import SDKpImg from '../docs/imgs/SDKp.jpg';

const imageMap: { [key: string]: string } = {
  './imgs/mainpage.jpeg': mainpageImg,
  './imgs/register.jpeg': registerImg,
  './imgs/loginpage.jpeg': loginpageImg,
  './imgs/projectc.jpeg': projectcImg,
  './imgs/arcData.jpeg': arcDataImg,
  './imgs/projectlogin.jpeg': projectloginImg,
  './imgs/projectD.jpeg': projectDImg,
  './imgs/projectER.jpeg': projectERImg,
  './imgs/query.jpeg': queryImg,
  './imgs/permission.jpeg': permissionImg,
  './imgs/SDK.jpeg': SDKImg,
  './imgs/SDKp.jpg': SDKpImg,
};

// 在 hubDoc.ts 的 loadExternalHtml 函数中加强样式处理
function loadExternalHtml(fileName: string): { html: string; styles: string; bodyClass: string } {
  try {
    const htmlContent = fileName === 'start.html' ? String(startHtmlRaw) : '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    let styles = '';
    doc.querySelectorAll('style').forEach(style => {
      let css = style.textContent || '';
      
      // 1. 将 html/body 替换为容器类，捕获 start.html 定义的背景颜色和字体
      css = css.replace(/(?<![a-zA-Z0-9_-])html(?![a-zA-Z0-9_-])/g, '.shadow-root-container');
      css = css.replace(/(?<![a-zA-Z0-9_-])body(?![a-zA-Z0-9_-])/g, '.shadow-root-container');
      
      // 2. 将 :root 变量也绑定到容器上，确保变量在隔离环境下生效
      css = css.replace(/:root/g, '.shadow-root-container');
      
      styles += css;
    });

    // 提取正文内容（通常是 #write 区域或整个 body）
    const bodyEl = doc.querySelector('body');
    const bodyClass = bodyEl?.className || '';
    const innerHtml = bodyEl?.innerHTML || '';

    return { html: innerHtml, styles, bodyClass };
  } catch (error) {
    console.error('Error:', error);
    return { html: '', styles: '', bodyClass: '' };
  }
}

// 修改 Shadow DOM 挂载逻辑
(() => {
  const startCont = document.getElementById('start-cont');
  if (startCont) {
    const { html, styles, bodyClass } = loadExternalHtml('start.html');
    const shadow = startCont.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host { 
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: 100% !important;
        overflow: auto;
      }
      
      .shadow-root-container {
        all: initial; /* 彻底重置外部 docs.html 的 CSS 继承 */
        display: flex !important;
        flex-direction: column !important;
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        position: relative;
        box-sizing: border-box;
        
        /* 强制应用 start.html 的默认字体和颜色，防止 all: initial 抹除一切 */
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.42857;
      }
      
      /* 覆盖 start.html 中 #write 的 padding-top: 36px */
      .shadow-root-container #write {
        padding-top: 0 !important;
        flex: 1 !important;
      }

      /* 允许内部元素恢复正常显示 */
      .shadow-root-container * {
        box-sizing: border-box;
      }
      
      .shadow-root-container {
        all: initial; /* 彻底重置外部 docs.html 的 CSS 继承 */
        display: block;
        width: 100%;
        min-height: 100%;
        position: relative;
        box-sizing: border-box;
        
        /* 强制应用 start.html 的默认字体和颜色，防止 all: initial 抹除一切 */
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.42857;
      }
      
      /* 覆盖 start.html 中 #write 的 padding-top: 36px */
      .shadow-root-container #write {
        padding-top: 0 !important;
      }
        
        /* 强制应用 start.html 的默认字体和颜色，防止 all: initial 抹除一切 */
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        line-height: 1.42857;
      }

      /* 允许内部元素恢复正常显示 */
      .shadow-root-container * {
        box-sizing: border-box;
      }
      
      /* 注入 start.html 提取出来的原始样式 */
      ${styles}
    `;

    const container = document.createElement('div');
    // 合并 start.html 的 body class 和我们的容器 class
    container.className = `shadow-root-container ${bodyClass}`;
    container.innerHTML = html;

    // 处理图片路径映射
    container.querySelectorAll('img').forEach((img: HTMLImageElement) => {
      const src = img.getAttribute('src');
      if (src && imageMap[src]) {
        img.src = imageMap[src];
      }
    });

    shadow.appendChild(styleEl);
    shadow.appendChild(container);
  }
})();
