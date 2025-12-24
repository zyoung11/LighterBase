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

const imageMap: { [key: string]: string } = {
  './imgs/mainpage.jpeg': mainpageImg,
  './imgs/register.jpeg': registerImg,
  './imgs/loginpage.jpeg': loginpageImg,
  './imgs/projectc.jpeg': projectcImg,
  './imgs/arcData.jpeg': arcDataImg,
  './imgs/projectlogin.jpeg': projectloginImg,
  './imgs/projectD.jpeg': projectDImg,
};

function loadExternalHtml(fileName: string): { html: string; styles: string } {
  try {
    let htmlContent: string;
    if (fileName === 'start.html') {
      htmlContent = startHtmlRaw;
    } else {
      throw new Error(`Unknown file: ${fileName}`);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    // 提取样式
    const styleElements = doc.querySelectorAll('style');
    let styles = '';
    styleElements.forEach(style => {
      styles += style.textContent || '';
    });

    // 获取 body 的 HTML
    let bodyHtml = doc.body.innerHTML;

    // 替换图片 src
    Object.keys(imageMap).forEach(oldSrc => {
      const newSrc = imageMap[oldSrc]!;
      bodyHtml = bodyHtml.replace(new RegExp(oldSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newSrc);
    });

    // 返回 body 的 HTML 和样式
    return {
      html: bodyHtml,
      styles: styles
    };

  } catch (error) {
    console.error('Error loading HTML:', error);
    return {
      html: `<div style="color:red">加载文档失败: ${fileName}</div>`,
      styles: ''
    };
  }
}





const applyLazyLoading = (html: string): string => {
    return html.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
        if (attrs.toLowerCase().includes('loading=')) {
            return match; 
        }
        return `<img loading="lazy" ${attrs}>`;
    });
};

// ✅ 改为同步函数
(() => {
  const foucFix = document.getElementById('fouc-fix');
  if (foucFix) foucFix.remove();

  // 渲染 Start 内容
  const startCont = document.getElementById('start-cont');
  if (startCont) {
    const { html: rawHtml, styles } = loadExternalHtml('start.html');
    if (styles) {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    startCont.innerHTML = applyLazyLoading(rawHtml);
  }
})();
