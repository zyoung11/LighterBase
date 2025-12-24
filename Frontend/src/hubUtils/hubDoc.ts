// Import HTML files as text
import introHtmlRaw from '../docs/intro.html' assert { type: 'text' };
import libraryHtmlRaw from '../docs/library.html' assert { type: 'text' };
import tutorialHtmlRaw from '../docs/tutorial.html' assert { type: 'text' };

// Import images
import databaseApimdImg from '../docs/imgs/Database_apimd.webp';
import databaseCreateImg from '../docs/imgs/Database_create.webp';
import databaseGojsImg from '../docs/imgs/Database_gojs.webp';
import databasePermissionImg from '../docs/imgs/Database_permission.webp';
import folderImg from '../docs/imgs/folder.webp';
import logDownloadImg from '../docs/imgs/log_download.webp';
import logInfoImg from '../docs/imgs/log_info.webp';
import settingAccountImg from '../docs/imgs/setting_account.webp';
import settingAiImg from '../docs/imgs/setting_ai.webp';

const imageMap: { [key: string]: string } = {
  '/docs/imgs/Database_apimd.webp': databaseApimdImg,
  '/docs/imgs/Database_create.webp': databaseCreateImg,
  '/docs/imgs/Database_gojs.webp': databaseGojsImg,
  '/docs/imgs/Database_permission.webp': databasePermissionImg,
  '/docs/imgs/folder.webp': folderImg,
  '/docs/imgs/log_download.webp': logDownloadImg,
  '/docs/imgs/log_info.webp': logInfoImg,
  '/docs/imgs/setting_account.webp': settingAccountImg,
  '/docs/imgs/setting_ai.webp': settingAiImg,
};

function loadExternalHtml(fileName: string): { html: string; styles: string } {
  try {
    let htmlContent: string;
    if (fileName === 'intro.html') {
      htmlContent = introHtmlRaw;
    } else if (fileName === 'library.html') {
      htmlContent = libraryHtmlRaw;
    } else if (fileName === 'tutorial.html') {
      htmlContent = tutorialHtmlRaw;
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

  // 渲染 Intro 内容
  const introCont = document.getElementById('intro-cont');
  if (introCont) {
    const { html: rawHtml, styles } = loadExternalHtml('intro.html');
    if (styles) {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    introCont.innerHTML = applyLazyLoading(rawHtml);
  }

  // 渲染 Install 内容
  const installIntro = document.getElementById('install-intro');
  if (installIntro) {
    const { html: rawHtml, styles } = loadExternalHtml('library.html');
    if (styles) {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    installIntro.innerHTML = applyLazyLoading(rawHtml);
  }

  // 渲染 Tutorials 内容
  const tutorialsCont = document.getElementById('tutorials-cont');
  if (tutorialsCont) {
    const { html: rawHtml, styles } = loadExternalHtml('tutorial.html');
    if (styles) {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    tutorialsCont.innerHTML = applyLazyLoading(rawHtml);
  }
})();
