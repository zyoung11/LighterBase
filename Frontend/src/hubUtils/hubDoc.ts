async function loadExternalHtml(fileName: string): Promise<{ html: string; styles: string }> {
  try {
    const response = await fetch(`/docs/${fileName}`);
    if (!response.ok) throw new Error(`Failed to load ${fileName}`);
    const text = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // 提取样式
    const styleElements = doc.querySelectorAll('style');
    let styles = '';
    styleElements.forEach(style => {
      styles += style.textContent || '';
    });

    // 返回 body 的 HTML 和样式
    return {
      html: doc.body.innerHTML,
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

// ✅ 改为异步函数
(async () => {
  const foucFix = document.getElementById('fouc-fix');
  if (foucFix) foucFix.remove();

  // 渲染 Intro 内容 (使用 fetch 加载)
  const introCont = document.getElementById('intro-cont');
  if (introCont) {
    const { html: rawHtml, styles } = await loadExternalHtml('intro.html');
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
    const { html: rawHtml, styles } = await loadExternalHtml('library.html');
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
    const { html: rawHtml, styles } = await loadExternalHtml('tutorial.html');
    if (styles) {
      const styleEl = document.createElement('style');
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
    }
    tutorialsCont.innerHTML = applyLazyLoading(rawHtml);
  }
})();
