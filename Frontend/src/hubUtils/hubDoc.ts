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


function loadExternalHtml(fileName: string): { html: string; styles: string; bodyClass: string } {
  try {
    const htmlContent = fileName === 'start.html' ? String(startHtmlRaw) : '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 1. 提取并“重定向”所有样式
    let styles = '';
    doc.querySelectorAll('style').forEach(style => {
      let css = style.textContent || '';
      
      // 将 html 和 body 选择器替换为我们的 Shadow 容器类名
      css = css.replace(/(?<![a-zA-Z0-9_-])html(?![a-zA-Z0-9_-])/g, '.shadow-root-container');
      css = css.replace(/(?<![a-zA-Z0-9_-])body(?![a-zA-Z0-9_-])/g, '.shadow-root-container');
      
      // 将 :root 变量也作用于容器
      css = css.replace(/:root/g, '.shadow-root-container');

      // 【关键修改】：去除背景颜色
      // 匹配 --bg-color 并强制设为透明
      css = css.replace(/--bg-color\s*:\s*[^;]+;/g, '--bg-color: transparent !important;');
      // 匹配直接写在样式里的 background-color: #fff 等
      css = css.replace(/background-color\s*:\s*#[a-fA-F0-9]+;?/g, 'background-color: transparent !important;');
      
      styles += css;
    });

    // 2. 提取 Body 内容和 Class
    const bodyEl = doc.querySelector('body');
    const bodyClass = bodyEl?.className || '';
    const innerHtml = bodyEl?.innerHTML || '';

    return { html: innerHtml, styles, bodyClass };
  } catch (error) {
    console.error('Error:', error);
    return { html: '', styles: '', bodyClass: '' };
  }
}








(() => {
  const startCont = document.getElementById('start-cont');
  if (startCont) {
    const { html, styles, bodyClass } = loadExternalHtml('start.html');
    
    // 1. 创建隔离的 Shadow DOM
    const shadow = startCont.attachShadow({ mode: 'open' });

    // 2. 注入样式
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host { 
        display: block; 
        width: 100%; 
        height: 100%; 
        background: transparent !important;
      }
      
      .shadow-root-container {
        /* all: unset 让文字颜色、字体等能继承 docs.html 的深色模式设定 */
        all: unset; 
        display: block;
        width: 100%;
        min-height: 100%;
        position: relative;
        box-sizing: border-box;
        padding: 40px;
        background: transparent !important;
        
        /* 确保基础字体与外部一致 */
        font-family: inherit; 
        color: inherit;
      }

      /* 恢复内部元素的标准行为，防止 unset 影响过深 */
      .shadow-root-container * {
        box-sizing: border-box;
      }
      
      /* 注入 start.html 的原始样式（已处理为透明背景） */
      ${styles}

      /* 针对 Typora 等生成的文档，确保图片和表格在深色背景下有良好的表现 */
      .shadow-root-container img {
        max-width: 100%;
      }
      .shadow-root-container table {
        border-color: rgba(255,255,255,0.1);
      }
    `;

    // 3. 构造内容容器
    const container = document.createElement('div');
    container.className = `shadow-root-container ${bodyClass}`;
    container.innerHTML = html;

    // 4. 图片路径映射
    container.querySelectorAll('img').forEach((img: any) => {
      const src = img.getAttribute('src');
      if (src && imageMap[src]) {
        img.src = imageMap[src];
      }
    });

    // 5. 挂载
    shadow.appendChild(styleEl);
    shadow.appendChild(container);
  }
})();
